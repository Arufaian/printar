import { redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { PUBLIC_MIDTRANS_CLIENT_KEY } from '$env/static/public';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { addresses, orders } from '$lib/server/db/schema';
import {
	CheckoutIntentError,
	getCheckoutIntentSummaryRealtime
} from '$lib/server/services/checkout-intent';
import type { PageServerLoad } from './$types';

const uuidSchema = z.uuid('ID checkout tidak valid.');

const deliveryMethodLabelById: Record<string, string> = {
	courier: 'Diantar ke alamat',
	pickup: 'Ambil di toko'
};

export const load: PageServerLoad = async (event) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		throw redirect(
			303,
			`/sign-in?redirect=${encodeURIComponent(event.url.pathname + event.url.search)}`
		);
	}

	const intentId = event.url.searchParams.get('intentId')?.trim() ?? '';
	const parsedIntentId = uuidSchema.safeParse(intentId);
	if (!parsedIntentId.success) {
		throw redirect(303, '/cart');
	}

	let summary: Awaited<ReturnType<typeof getCheckoutIntentSummaryRealtime>>;
	try {
		summary = await getCheckoutIntentSummaryRealtime(user.id, parsedIntentId.data);
	} catch (error) {
		if (error instanceof CheckoutIntentError) {
			throw redirect(303, '/cart');
		}
		throw error;
	}

	const [orderRow] = await db
		.select({
			id: orders.id,
			status: orders.status,
			addressId: orders.addressId,
			deliveryMethod: orders.deliveryMethod,
			customerNote: orders.customerNote,
			recipientName: addresses.recipientName,
			label: addresses.label,
			addressLine: addresses.addressLine,
			city: addresses.city,
			postalCode: addresses.postalCode,
			phone: addresses.phone
		})
		.from(orders)
		.leftJoin(addresses, eq(orders.addressId, addresses.id))
		.where(
			and(
				eq(orders.id, summary.orderId),
				eq(orders.profileId, user.id),
				inArray(orders.status, ['draft', 'pending_payment'])
			)
		)
		.limit(1);

	if (!orderRow) {
		throw redirect(303, '/cart');
	}

	const selectedAddress = orderRow.addressId
		? {
				id: orderRow.addressId,
				recipientName: orderRow.recipientName,
				label: orderRow.label,
				addressLine: orderRow.addressLine,
				city: orderRow.city,
				postalCode: orderRow.postalCode,
				phone: orderRow.phone
			}
		: null;

	const selectedDeliveryMethodLabel = orderRow.deliveryMethod
		? (deliveryMethodLabelById[orderRow.deliveryMethod] ?? orderRow.deliveryMethod)
		: null;

	const midtransScriptUrl =
		process.env.MIDTRANS_IS_PRODUCTION === 'true'
			? 'https://app.midtrans.com/snap/snap.js'
			: 'https://app.sandbox.midtrans.com/snap/snap.js';

	return {
		intentId: summary.intentId,
		orderId: summary.orderId,
		grandTotal: summary.grandTotal,
		customerNote: orderRow.customerNote,
		selectedAddress,
		selectedDeliveryMethodLabel,
		midtransClientKey: PUBLIC_MIDTRANS_CLIENT_KEY,
		midtransScriptUrl
	};
};
