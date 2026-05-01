import { fail, redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import {
	addresses,
	orderItemOptions,
	orderItems,
	options,
	orders,
	products,
	variants
} from '$lib/server/db/schema';
import {
	CheckoutIntentError,
	getCheckoutIntentSummaryRealtime
} from '$lib/server/services/checkout-intent';
import type { Actions, PageServerLoad } from './$types';

const uuidSchema = z.uuid('ID checkout tidak valid.');
const customerNoteSchema = z.string().max(200, 'Catatan maksimal 200 karakter.');

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

	let intentSummary: Awaited<ReturnType<typeof getCheckoutIntentSummaryRealtime>>;
	try {
		intentSummary = await getCheckoutIntentSummaryRealtime(user.id, parsedIntentId.data);
	} catch (err) {
		if (err instanceof CheckoutIntentError) {
			throw redirect(303, '/cart');
		}

		throw err;
	}

	const [orderRow] = await db
		.select({
			id: orders.id,
			addressId: orders.addressId,
			deliveryMethod: orders.deliveryMethod,
			recipientName: addresses.recipientName,
			label: addresses.label,
			addressLine: addresses.addressLine,
			city: addresses.city,
			postalCode: addresses.postalCode,
			phone: addresses.phone,
			customerNote: orders.customerNote
		})
		.from(orders)
		.leftJoin(addresses, eq(orders.addressId, addresses.id))
		.where(
			and(
				eq(orders.id, intentSummary.orderId),
				eq(orders.profileId, user.id),
				eq(orders.status, 'draft')
			)
		)
		.limit(1);

	if (!orderRow) {
		throw redirect(303, '/cart');
	}

	const selectedItemIds = intentSummary.selectedItemIds;

	const itemRows = await db
		.select({
			id: orderItems.id,
			quantity: orderItems.quantity,
			itemPrice: orderItems.price,
			variantName: variants.name,
			variantImage: variants.imgUrl,
			productName: products.name
		})
		.from(orderItems)
		.leftJoin(variants, eq(orderItems.variantId, variants.id))
		.leftJoin(products, eq(variants.productId, products.id))
		.where(
			and(eq(orderItems.orderId, intentSummary.orderId), inArray(orderItems.id, selectedItemIds))
		);

	if (itemRows.length === 0 || itemRows.length !== selectedItemIds.length) {
		throw redirect(303, '/cart');
	}

	const optionRows = await db
		.select({
			orderItemId: orderItemOptions.orderItemId,
			optionPrice: orderItemOptions.price,
			optionName: options.name
		})
		.from(orderItemOptions)
		.leftJoin(options, eq(orderItemOptions.optionId, options.id))
		.where(inArray(orderItemOptions.orderItemId, selectedItemIds));

	const optionNamesByItemId = new Map<string, string[]>();
	const optionPriceByItemId = new Map<string, number>();

	for (const optionRow of optionRows) {
		if (!optionRow.orderItemId) continue;

		const optionName = optionRow.optionName?.trim() || 'Opsi';
		const optionsForItem = optionNamesByItemId.get(optionRow.orderItemId) ?? [];
		optionsForItem.push(optionName);
		optionNamesByItemId.set(optionRow.orderItemId, optionsForItem);

		const currentOptionPrice = optionPriceByItemId.get(optionRow.orderItemId) ?? 0;
		optionPriceByItemId.set(
			optionRow.orderItemId,
			currentOptionPrice + (optionRow.optionPrice ?? 0)
		);
	}

	const items = itemRows
		.map((itemRow) => {
			const optionAdditionalPrice = optionPriceByItemId.get(itemRow.id) ?? 0;
			const unitPrice = (itemRow.itemPrice ?? 0) + optionAdditionalPrice;
			const quantity = itemRow.quantity ?? 0;

			return {
				id: itemRow.id,
				name: itemRow.productName?.trim() || 'Produk Tanpa Nama',
				variant: itemRow.variantName?.trim() || 'Varian',
				image: itemRow.variantImage?.trim() || null,
				options: optionNamesByItemId.get(itemRow.id) ?? [],
				quantity,
				unitPrice,
				lineTotal: quantity * unitPrice
			};
		})
		.sort((a, b) => selectedItemIds.indexOf(a.id) - selectedItemIds.indexOf(b.id));

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

	const selectedDeliveryMethod = orderRow.deliveryMethod;

	return {
		intentId: intentSummary.intentId,
		customerNote: orderRow.customerNote,
		selectedAddress,
		selectedDeliveryMethod,
		selectedDeliveryMethodLabel: selectedDeliveryMethod
			? (deliveryMethodLabelById[selectedDeliveryMethod] ?? selectedDeliveryMethod)
			: null,
		items
	};
};

export const actions: Actions = {
	saveCustomerNote: async (event) => {
		const { user } = await event.locals.safeGetSession();

		if (!user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const formData = await event.request.formData();
		const intentId = String(formData.get('intentId') ?? '').trim();
		const customerNoteInput = String(formData.get('customerNote') ?? '');

		const parsedIntentId = uuidSchema.safeParse(intentId);
		if (!parsedIntentId.success) {
			return fail(400, { message: 'ID checkout tidak valid.' });
		}

		const normalizedCustomerNote = customerNoteInput.trim();
		const parsedCustomerNote = customerNoteSchema.safeParse(normalizedCustomerNote);
		if (!parsedCustomerNote.success) {
			return fail(400, { message: 'Catatan maksimal 200 karakter.' });
		}

		let intentSummary: Awaited<ReturnType<typeof getCheckoutIntentSummaryRealtime>>;
		try {
			intentSummary = await getCheckoutIntentSummaryRealtime(user.id, parsedIntentId.data);
		} catch (err) {
			console.error(err);
			if (err instanceof CheckoutIntentError) {
				return fail(404, { message: 'Checkout intent tidak ditemukan.' });
			}

			throw err;
		}

		const [ownedDraftOrder] = await db
			.select({ id: orders.id })
			.from(orders)
			.where(
				and(
					eq(orders.id, intentSummary.orderId),
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
			.set({ customerNote: parsedCustomerNote.data === '' ? null : parsedCustomerNote.data })
			.where(
				and(
					eq(orders.id, intentSummary.orderId),
					eq(orders.profileId, user.id),
					eq(orders.status, 'draft')
				)
			);

		return {
			type: 'success' as const,
			text: 'Catatan pesanan berhasil disimpan.',
			customerNote: parsedCustomerNote.data === '' ? null : parsedCustomerNote.data
		};
	}
};
