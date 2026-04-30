import { error, redirect } from '@sveltejs/kit';
import { PUBLIC_MIDTRANS_CLIENT_KEY } from '$env/static/public';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	addresses,
	orderItemOptions,
	orderItems,
	orderStatusLogs,
	options,
	orders,
	payments,
	products,
	profiles,
	variants
} from '$lib/server/db/schema';
import type { OrderDetailData, OrderDetailTimelineEntry } from '$lib/types/order-detail';
import type { OrderStatusBadgeVariant } from '$lib/types/order-list';
import type { PageServerLoad } from './$types';

const getStatusLabel = (status: string) => {
	switch (status) {
		case 'pending_payment':
			return 'Menunggu Pembayaran';
		case 'paid':
			return 'Dibayar';
		case 'file_review':
			return 'Review File';
		case 'revision_requested':
			return 'Revisi';
		case 'printing':
			return 'Diproses';
		case 'ready':
			return 'Siap';
		case 'shipped':
			return 'Dikirim';
		case 'completed':
			return 'Selesai';
		case 'canceled':
			return 'Dibatalkan';
		default:
			return status;
	}
};

const getStatusVariant = (status: string): OrderStatusBadgeVariant => {
	switch (status) {
		case 'paid':
		case 'completed':
			return 'default';
		case 'pending_payment':
		case 'revision_requested':
			return 'secondary';
		case 'canceled':
			return 'destructive';
		default:
			return 'outline';
	}
};

const getStatusClass = (status: string) =>
	status === 'pending_payment' ? 'border-amber-300 bg-amber-100 text-amber-800' : '';

const formatOrderCode = (id: string) => `ORD-${id.slice(0, 8).toUpperCase()}`;

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
			deliveryMethod: orders.deliveryMethod,
			shippingCost: orders.shippingCost,
			totalPrice: orders.totalPrice,
			customerNote: orders.customerNote,
			addressRecipientName: addresses.recipientName,
			addressLabel: addresses.label,
			addressLine: addresses.addressLine,
			addressCity: addresses.city,
			addressPostalCode: addresses.postalCode,
			addressPhone: addresses.phone
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
			variantName: variants.name,
			variantImage: variants.imgUrl
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
		const optionPrice = optionTotalByItemId.get(itemRow.id) ?? 0;
		const unitPrice = (itemRow.itemPrice ?? 0) + optionPrice;
		const quantity = itemRow.quantity ?? 0;

		return {
			id: itemRow.id,
			name: itemRow.productName?.trim() || 'Produk Tanpa Nama',
			variant: itemRow.variantName?.trim() || 'Varian',
			image: itemRow.variantImage?.trim() || null,
			quantity,
			unitPrice,
			lineTotal: unitPrice * quantity,
			options: optionsByItemId.get(itemRow.id) ?? []
		};
	});

	const latestPaymentRows = await db
		.select({ status: payments.status, paymentMethod: payments.paymentMethod })
		.from(payments)
		.where(eq(payments.orderId, orderRow.id))
		.orderBy(desc(payments.createdAt))
		.limit(1);

	const latestPayment = latestPaymentRows[0];

	const statusLogRows = await db
		.select({
			status: orderStatusLogs.status,
			createdAt: orderStatusLogs.createdAt,
			changedByName: profiles.name
		})
		.from(orderStatusLogs)
		.leftJoin(profiles, eq(orderStatusLogs.changeBy, profiles.id))
		.where(eq(orderStatusLogs.orderId, orderRow.id))
		.orderBy(asc(orderStatusLogs.createdAt));

	const timeline: OrderDetailTimelineEntry[] =
		statusLogRows.length > 0
			? statusLogRows.map((row) => ({
					status: row.status ?? orderRow.status ?? 'pending_payment',
					label: getStatusLabel(row.status ?? orderRow.status ?? 'pending_payment'),
					createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
					changedByName: row.changedByName?.trim() || null
				}))
			: [
					{
						status: orderRow.status ?? 'pending_payment',
						label: getStatusLabel(orderRow.status ?? 'pending_payment'),
						createdAt: orderRow.createdAt ? new Date(orderRow.createdAt).toISOString() : null,
						changedByName: null
					}
				];

	const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);
	const shippingCost = orderRow.shippingCost ?? 0;
	const grandTotal = orderRow.totalPrice ?? subtotal + shippingCost;
	const status = orderRow.status ?? 'pending_payment';

	const detail: OrderDetailData = {
		id: orderRow.id,
		orderCode: formatOrderCode(orderRow.id),
		status,
		statusLabel: getStatusLabel(status),
		statusBadgeVariant: getStatusVariant(status),
		statusBadgeClass: getStatusClass(status),
		createdAt: orderRow.createdAt ? new Date(orderRow.createdAt).toISOString() : null,
		deliveryMethod: orderRow.deliveryMethod ?? null,
		shippingCost,
		subtotal,
		grandTotal,
		customerNote: orderRow.customerNote ?? null,
		latestPaymentStatus: latestPayment?.status ?? null,
		latestPaymentMethod: latestPayment?.paymentMethod ?? null,
		address: {
			recipientName: orderRow.addressRecipientName?.trim() || '-',
			label: orderRow.addressLabel?.trim() || '-',
			addressLine: orderRow.addressLine?.trim() || '-',
			city: orderRow.addressCity?.trim() || '-',
			postalCode: orderRow.addressPostalCode?.trim() || '-',
			phone: orderRow.addressPhone?.trim() || '-'
		},
		items,
		timeline
	};

	return {
		order: detail,
		canPay: status === 'pending_payment',
		midtransClientKey: PUBLIC_MIDTRANS_CLIENT_KEY,
		midtransScriptUrl:
			process.env.MIDTRANS_IS_PRODUCTION === 'true'
				? 'https://app.midtrans.com/snap/snap.js'
				: 'https://app.sandbox.midtrans.com/snap/snap.js'
	};
};
