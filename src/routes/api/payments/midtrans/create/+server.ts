import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { orderStatusLogs, orders, payments, profiles } from '$lib/server/db/schema';
import {
	CheckoutIntentError,
	getCheckoutIntentSummaryRealtime
} from '$lib/server/services/checkout-intent';
import { createSnapTransaction } from '$lib/server/services/payment';
import type { RequestHandler } from './$types';

const createRequestSchema = z.object({
	intentId: z.uuid('ID checkout tidak valid.')
});

const nowIso = () => new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

const getClientFacingError = (message: string) => ({ message });

export const POST: RequestHandler = async (event) => {
	const { user } = await event.locals.safeGetSession();
	if (!user) {
		return json(getClientFacingError('Silakan login terlebih dahulu.'), { status: 401 });
	}

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		return json(getClientFacingError('Payload request tidak valid.'), { status: 400 });
	}

	const parsedBody = createRequestSchema.safeParse(body);
	if (!parsedBody.success) {
		return json(getClientFacingError('ID checkout tidak valid.'), { status: 400 });
	}

	let summary: Awaited<ReturnType<typeof getCheckoutIntentSummaryRealtime>>;
	try {
		summary = await getCheckoutIntentSummaryRealtime(user.id, parsedBody.data.intentId);
	} catch (error) {
		if (error instanceof CheckoutIntentError) {
			return json(getClientFacingError('Checkout intent tidak ditemukan.'), { status: 404 });
		}

		console.error('[midtrans:create] failed to resolve checkout summary', error);
		return json(getClientFacingError('Gagal menyiapkan pembayaran.'), { status: 500 });
	}

	const [ownedDraftOrder] = await db
		.select({
			id: orders.id,
			status: orders.status,
			profileId: orders.profileId,
			totalPrice: orders.totalPrice,
			customerNote: orders.customerNote,
			deliveryMethod: orders.deliveryMethod,
			profileName: profiles.name
		})
		.from(orders)
		.leftJoin(profiles, eq(orders.profileId, profiles.id))
		.where(and(eq(orders.id, summary.orderId), eq(orders.profileId, user.id), eq(orders.status, 'draft')))
		.limit(1);

	if (!ownedDraftOrder) {
		return json(getClientFacingError('Keranjang draft tidak ditemukan.'), { status: 404 });
	}

	const grossAmount = summary.grandTotal;
	if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
		return json(getClientFacingError('Total pembayaran tidak valid.'), { status: 400 });
	}

	const midtransOrderId = `${ownedDraftOrder.id}-${nowIso()}`;
	const callbacks = {
		finish: `${event.url.origin}/checkout/payment?intentId=${encodeURIComponent(summary.intentId)}&result=finish`,
		unfinish: `${event.url.origin}/checkout/payment?intentId=${encodeURIComponent(summary.intentId)}&result=unfinish`,
		error: `${event.url.origin}/checkout/payment?intentId=${encodeURIComponent(summary.intentId)}&result=error`
	};

	let midtransResponse: Awaited<ReturnType<typeof createSnapTransaction>>;
	try {
		midtransResponse = await createSnapTransaction({
			orderId: midtransOrderId,
			grossAmount,
			customer: {
				firstName: ownedDraftOrder.profileName ?? undefined
			},
			itemDetails: [
				{
					id: ownedDraftOrder.id,
					name: `Checkout ${ownedDraftOrder.id}`,
					quantity: 1,
					price: grossAmount
				}
			],
			callbacks
		});
	} catch (error) {
		console.error('[midtrans:create] failed to create transaction', error);
		return json(getClientFacingError('Gagal membuat transaksi pembayaran.'), { status: 502 });
	}

	const rawResponsePayload = {
		...(midtransResponse.rawResponse ?? {}),
		midtrans_order_id: midtransOrderId
	};

	const [existingPayment] = await db
		.select({ id: payments.id })
		.from(payments)
		.where(eq(payments.orderId, ownedDraftOrder.id))
		.limit(1);

	if (existingPayment?.id) {
		await db
			.update(payments)
			.set({
				status: 'pending',
				paymentMethod:
					typeof midtransResponse.rawResponse?.payment_type === 'string'
						? midtransResponse.rawResponse.payment_type
						: null,
				rawResponse: rawResponsePayload
			})
			.where(eq(payments.id, existingPayment.id));
	} else {
		await db.insert(payments).values({
			orderId: ownedDraftOrder.id,
			status: 'pending',
			paymentMethod:
				typeof midtransResponse.rawResponse?.payment_type === 'string'
					? midtransResponse.rawResponse.payment_type
					: null,
			rawResponse: rawResponsePayload
		});
	}

	if (ownedDraftOrder.status !== 'pending_payment') {
		await db
			.update(orders)
			.set({ status: 'pending_payment' })
			.where(and(eq(orders.id, ownedDraftOrder.id), eq(orders.profileId, user.id)));

		const [existingPendingLog] = await db
			.select({ id: orderStatusLogs.id })
			.from(orderStatusLogs)
			.where(
				and(
					eq(orderStatusLogs.orderId, ownedDraftOrder.id),
					eq(orderStatusLogs.status, 'pending_payment')
				)
			)
			.limit(1);

		if (!existingPendingLog?.id) {
			await db.insert(orderStatusLogs).values({
				orderId: ownedDraftOrder.id,
				status: 'pending_payment',
				changeBy: user.id
			});
		}
	}

	return json({
		snapToken: midtransResponse.token,
		redirectUrl: midtransResponse.redirect_url,
		orderId: ownedDraftOrder.id
	});
};
