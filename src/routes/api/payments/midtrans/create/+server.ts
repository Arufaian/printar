import { json } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { orders, profiles } from '$lib/server/db/schema';
import {
	CheckoutIntentError,
	getCheckoutIntentSummaryRealtime,
	materializeTransactionOrderFromIntent
} from '$lib/server/services/checkout-intent';
import { createSnapForOrder } from '$lib/server/services/payment/create-snap-order';
import type { RequestHandler } from './$types';

const createRequestSchema = z.object({
	intentId: z.uuid('ID checkout tidak valid.')
});

const getClientFacingError = (message: string, code?: string) =>
	code ? { message, code } : { message };

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
		summary = await getCheckoutIntentSummaryRealtime(user.id, parsedBody.data.intentId, {
			allowedOrderStatuses: ['draft', 'pending_payment']
		});
	} catch (error) {
		console.error(error);
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
		.where(
			and(
				eq(orders.id, summary.orderId),
				eq(orders.profileId, user.id),
				inArray(orders.status, ['draft', 'pending_payment'])
			)
		)
		.limit(1);

	if (!ownedDraftOrder) {
		return json(getClientFacingError('Keranjang draft tidak ditemukan.'), { status: 404 });
	}

	const grossAmount = summary.grandTotal;
	if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
		return json(getClientFacingError('Total pembayaran tidak valid.'), { status: 400 });
	}

	let materializedOrder: Awaited<ReturnType<typeof materializeTransactionOrderFromIntent>>;
	try {
		materializedOrder = await materializeTransactionOrderFromIntent({
			userId: user.id,
			intentId: summary.intentId,
			sourceOrderId: summary.orderId,
			grossAmount
		});
	} catch (error) {
		if (error instanceof CheckoutIntentError) {
			return json(getClientFacingError(error.message), { status: error.status });
		}

		console.error('[midtrans:create] failed to materialize transaction order', error);
		return json(getClientFacingError('Gagal menyiapkan order transaksi.'), { status: 500 });
	}

	const result = await createSnapForOrder({
		orderId: materializedOrder.transactionOrderId,
		grossAmount,
		origin: event.url.origin,
		callbacksPath: {
			finish: `/checkout/payment?intentId=${encodeURIComponent(summary.intentId)}&result=finish`,
			unfinish: `/checkout/payment?intentId=${encodeURIComponent(summary.intentId)}&result=unfinish`,
			error: `/checkout/payment?intentId=${encodeURIComponent(summary.intentId)}&result=error`
		},
		customerFirstName: materializedOrder.customerFirstName,
		itemName: `Checkout ${materializedOrder.transactionOrderId}`,
		statusBeforeCreate: materializedOrder.statusBeforeCreate,
		changeByUserId: user.id
	});

	return json(result.body, { status: result.status });
};
