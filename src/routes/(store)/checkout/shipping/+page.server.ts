import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { addresses, orderItems, orders } from '$lib/server/db/schema';
import {
	CheckoutIntentError,
	getCheckoutIntentSummaryRealtime
} from '$lib/server/services/checkout-intent';
import type { Actions, PageServerLoad } from './$types';

const uuidSchema = z.uuid('ID tidak valid.');
const COURIER_SHIPPING_COST = 18000;
const deliveryMethods = [
	{ id: 'courier', label: 'Diantar ke alamat' },
	{ id: 'pickup', label: 'Ambil di toko' }
] as const;
const deliveryMethodSchema = z.enum(['courier', 'pickup'], {
	message: 'Metode pengiriman tidak valid.'
});

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

	let intentSummary: Awaited<ReturnType<typeof getCheckoutIntentSummaryRealtime>>;
	try {
		intentSummary = await getCheckoutIntentSummaryRealtime(user.id, parsedIntentId.data);
	} catch (err) {
		if (err instanceof CheckoutIntentError) {
			throw redirect(303, '/cart');
		}

		throw err;
	}

	const [draftOrder] = await db
		.select({
			id: orders.id,
			addressId: orders.addressId,
			deliveryMethod: orders.deliveryMethod,
			shippingCost: orders.shippingCost
		})
		.from(orders)
		.where(
			and(
				eq(orders.profileId, user.id),
				eq(orders.status, 'draft'),
				eq(orders.id, intentSummary.orderId)
			)
		)
		.limit(1);

	if (!draftOrder) {
		throw error(404, 'Keranjang draft tidak ditemukan. Silakan mulai checkout dari keranjang.');
	}

	const [draftOrderItem] = await db
		.select({ id: orderItems.id })
		.from(orderItems)
		.where(eq(orderItems.orderId, draftOrder.id))
		.limit(1);

	if (!draftOrderItem) {
		throw redirect(303, '/cart');
	}

	const userAddresses = await db
		.select({
			id: addresses.id,
			recipientName: addresses.recipientName,
			label: addresses.label,
			isDefault: addresses.isDefault,
			addressLine: addresses.addressLine,
			city: addresses.city,
			postalCode: addresses.postalCode,
			phone: addresses.phone
		})
		.from(addresses)
		.where(eq(addresses.profileId, user.id));

	return {
		intentId: intentSummary.intentId,
		orderId: draftOrder.id,
		selectedAddressId: draftOrder.addressId,
		selectedDeliveryMethod: draftOrder.deliveryMethod,
		shippingCost: draftOrder.shippingCost,
		deliveryMethods,
		addresses: userAddresses,
		manageAddressUrl: '/customer/addresses'
	};
};

export const actions: Actions = {
	selectAddress: async (event) => {
		const { user } = await event.locals.safeGetSession();

		if (!user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const formData = await event.request.formData();
		const intentId = String(formData.get('intentId') ?? '').trim();
		const orderId = String(formData.get('orderId') ?? '').trim();
		const addressId = String(formData.get('addressId') ?? '').trim();

		if (!intentId || !orderId || !addressId) {
			return fail(400, { message: 'Data alamat tidak lengkap.' });
		}

		const parsedIntentId = uuidSchema.safeParse(intentId);
		if (!parsedIntentId.success) {
			return fail(400, { message: 'ID checkout tidak valid.' });
		}

		try {
			await getCheckoutIntentSummaryRealtime(user.id, parsedIntentId.data);
		} catch (err) {
			if (err instanceof CheckoutIntentError) {
				return fail(404, { message: 'Checkout intent tidak ditemukan.' });
			}

			throw err;
		}

		const parsedOrderId = uuidSchema.safeParse(orderId);
		const parsedAddressId = uuidSchema.safeParse(addressId);

		if (!parsedOrderId.success || !parsedAddressId.success) {
			return fail(400, { message: 'ID alamat atau order tidak valid.' });
		}

		const [ownedAddress] = await db
			.select({ id: addresses.id })
			.from(addresses)
			.where(and(eq(addresses.id, parsedAddressId.data), eq(addresses.profileId, user.id)))
			.limit(1);

		if (!ownedAddress) {
			return fail(404, { message: 'Alamat tidak ditemukan.' });
		}

		const [ownedDraftOrder] = await db
			.select({ id: orders.id })
			.from(orders)
			.where(
				and(
					eq(orders.id, parsedOrderId.data),
					eq(orders.profileId, user.id),
					eq(orders.status, 'draft')
				)
			)
			.limit(1);

		if (!ownedDraftOrder) {
			return fail(404, { message: 'Keranjang draft tidak ditemukan.' });
		}

		await db
			.update(orders)
			.set({ addressId: parsedAddressId.data })
			.where(
				and(
					eq(orders.id, parsedOrderId.data),
					eq(orders.profileId, user.id),
					eq(orders.status, 'draft')
				)
			);

		throw redirect(303, `/checkout/shipping?intentId=${encodeURIComponent(parsedIntentId.data)}`);
	},
	selectDeliveryMethod: async (event) => {
		const { user } = await event.locals.safeGetSession();

		if (!user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const formData = await event.request.formData();
		const intentId = String(formData.get('intentId') ?? '').trim();
		const orderId = String(formData.get('orderId') ?? '').trim();
		const deliveryMethod = String(formData.get('deliveryMethod') ?? '').trim();

		if (!intentId || !orderId || !deliveryMethod) {
			return fail(400, { message: 'Data metode pengiriman tidak lengkap.' });
		}

		const parsedIntentId = uuidSchema.safeParse(intentId);
		if (!parsedIntentId.success) {
			return fail(400, { message: 'ID checkout tidak valid.' });
		}

		try {
			await getCheckoutIntentSummaryRealtime(user.id, parsedIntentId.data);
		} catch (err) {
			if (err instanceof CheckoutIntentError) {
				return fail(404, { message: 'Checkout intent tidak ditemukan.' });
			}

			throw err;
		}

		const parsedOrderId = uuidSchema.safeParse(orderId);
		const parsedDeliveryMethod = deliveryMethodSchema.safeParse(deliveryMethod);

		if (!parsedOrderId.success) {
			return fail(400, { message: 'ID order tidak valid.' });
		}

		if (!parsedDeliveryMethod.success) {
			return fail(400, { message: 'Metode pengiriman tidak valid.' });
		}

		const [ownedDraftOrder] = await db
			.select({ id: orders.id })
			.from(orders)
			.where(
				and(
					eq(orders.id, parsedOrderId.data),
					eq(orders.profileId, user.id),
					eq(orders.status, 'draft')
				)
			)
			.limit(1);

		if (!ownedDraftOrder) {
			return fail(404, { message: 'Keranjang draft tidak ditemukan.' });
		}

		await db
			.update(orders)
			.set({
				deliveryMethod: parsedDeliveryMethod.data,
				shippingCost: parsedDeliveryMethod.data === 'courier' ? COURIER_SHIPPING_COST : 0
			})
			.where(
				and(
					eq(orders.id, parsedOrderId.data),
					eq(orders.profileId, user.id),
					eq(orders.status, 'draft')
				)
			);

		throw redirect(303, `/checkout/shipping?intentId=${encodeURIComponent(parsedIntentId.data)}`);
	}
};
