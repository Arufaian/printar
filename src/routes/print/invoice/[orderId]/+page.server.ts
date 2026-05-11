import { error, redirect } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { formatOrderStatusLabel } from '$lib/utils/string';
import {
	addresses,
	orderItemOptions,
	orderItems,
	options,
	orders,
	payments,
	products,
	variants
} from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/sign-in?redirect=/customer/orders');
	}

	const orderId = event.params.orderId;

	const [orderRow] = await db
		.select({
			id: orders.id,
			status: orders.status,
			createdAt: orders.createdAt,
			shippingCost: orders.shippingCost,
			totalPrice: orders.totalPrice,
			customerNote: orders.customerNote,
			addressRecipientName: addresses.recipientName
		})
		.from(orders)
		.leftJoin(addresses, eq(orders.addressId, addresses.id))
		.where(and(eq(orders.id, orderId), eq(orders.profileId, user.id)))
		.limit(1);

	if (!orderRow?.id) {
		throw error(404, 'Pesanan tidak ditemukan.');
	}

	const itemRows = await db
		.select({
			id: orderItems.id,
			quantity: orderItems.quantity,
			itemPrice: orderItems.price,
			productName: products.name,
			variantName: variants.name
		})
		.from(orderItems)
		.leftJoin(variants, eq(orderItems.variantId, variants.id))
		.leftJoin(products, eq(variants.productId, products.id))
		.where(eq(orderItems.orderId, orderRow.id));

	const orderItemIds = itemRows.map((row) => row.id);

	const optionRows =
		orderItemIds.length > 0
			? await db
					.select({
						orderItemId: orderItemOptions.orderItemId,
						optionName: options.name,
						optionPrice: orderItemOptions.price
					})
					.from(orderItemOptions)
					.leftJoin(options, eq(orderItemOptions.optionId, options.id))
					.where(inArray(orderItemOptions.orderItemId, orderItemIds))
			: [];

	const optionsByItemId = new Map<string, string[]>();
	const optionTotalByItemId = new Map<string, number>();

	for (const optionRow of optionRows) {
		if (!optionRow.orderItemId) continue;
		const existingOptions = optionsByItemId.get(optionRow.orderItemId) ?? [];
		existingOptions.push(optionRow.optionName?.trim() || 'Opsi');
		optionsByItemId.set(optionRow.orderItemId, existingOptions);

		const existingPrice = optionTotalByItemId.get(optionRow.orderItemId) ?? 0;
		optionTotalByItemId.set(optionRow.orderItemId, existingPrice + (optionRow.optionPrice ?? 0));
	}

	const items = itemRows.map((itemRow) => {
		const quantity = itemRow.quantity ?? 0;
		const optionPrice = optionTotalByItemId.get(itemRow.id) ?? 0;
		const unitPrice = (itemRow.itemPrice ?? 0) + optionPrice;

		return {
			id: itemRow.id,
			name: itemRow.productName?.trim() || 'Produk Tanpa Nama',
			variant: itemRow.variantName?.trim() || 'Varian',
			options: optionsByItemId.get(itemRow.id) ?? [],
			quantity,
			unitPrice,
			lineTotal: quantity * unitPrice
		};
	});

	const latestPaymentRows = await db
		.select({ status: payments.status, paymentMethod: payments.paymentMethod })
		.from(payments)
		.where(eq(payments.orderId, orderRow.id))
		.orderBy(desc(payments.createdAt))
		.limit(1);

	const latestPayment = latestPaymentRows[0];
	const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);
	const shippingCost = orderRow.shippingCost ?? 0;
	const grandTotal = orderRow.totalPrice ?? subtotal + shippingCost;
	const status = orderRow.status ?? 'pending_payment';

	const invoice = {
		orderId,
		invoiceNumber: `INV-${orderId.slice(0, 8).toUpperCase()}`,
		issueDate: orderRow.createdAt
			? new Date(orderRow.createdAt).toISOString()
			: new Date().toISOString(),
		customerName: orderRow.addressRecipientName?.trim() || 'Pelanggan',
		paymentMethod: latestPayment?.paymentMethod ?? '-',
		status: formatOrderStatusLabel(status),
		items,
		shippingCost,
		subtotal,
		grandTotal,
		notes: orderRow.customerNote?.trim() || '-'
	};

	return {
		invoice
	};
};
