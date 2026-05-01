import { error } from '@sveltejs/kit';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	addresses,
	optionGroups,
	options,
	orderItemOptions,
	orderItems,
	orderStatusLogs,
	orders,
	payments,
	products,
	profiles,
	variants
} from '$lib/server/db/schema';
import type { AdminOrderDetailData, AdminOrderDetailTimelineEntry } from '$lib/types/admin-orders';
import {
	formatDeliveryMethodLabel,
	formatOrderCode,
	formatOrderStatusLabel
} from '$lib/utils/string';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const orderId = params.orderId;

	const [orderRow] = await db
		.select({
			id: orders.id,
			status: orders.status,
			createdAt: orders.createdAt,
			updatedAt: orders.updatedAt,
			deliveryMethod: orders.deliveryMethod,
			shippingCost: orders.shippingCost,
			totalPrice: orders.totalPrice,
			customerNote: orders.customerNote,
			customerName: profiles.name,
			addressRecipientName: addresses.recipientName,
			addressLabel: addresses.label,
			addressLine: addresses.addressLine,
			addressCity: addresses.city,
			addressPostalCode: addresses.postalCode,
			addressPhone: addresses.phone
		})
		.from(orders)
		.leftJoin(profiles, eq(orders.profileId, profiles.id))
		.leftJoin(addresses, eq(orders.addressId, addresses.id))
		.where(eq(orders.id, orderId))
		.limit(1);

	if (!orderRow?.id) {
		throw error(404, 'Order tidak ditemukan.');
	}

	const itemRows = await db
		.select({
			id: orderItems.id,
			quantity: orderItems.quantity,
			itemPrice: orderItems.price,
			filePath: orderItems.filePath,
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
						optionPrice: orderItemOptions.price,
						groupName: optionGroups.name
					})
					.from(orderItemOptions)
					.leftJoin(options, eq(orderItemOptions.optionId, options.id))
					.leftJoin(optionGroups, eq(options.optionGroupId, optionGroups.id))
					.where(inArray(orderItemOptions.orderItemId, orderItemIds))
			: [];

	const optionsByItemId = new Map<string, string[]>();
	const optionTotalByItemId = new Map<string, number>();

	for (const optionRow of optionRows) {
		if (!optionRow.orderItemId) continue;
		const current = optionsByItemId.get(optionRow.orderItemId) ?? [];
		const optionLabel = optionRow.groupName?.trim()
			? `${optionRow.groupName}: ${optionRow.optionName?.trim() || 'Opsi'}`
			: optionRow.optionName?.trim() || 'Opsi';
		current.push(optionLabel);
		optionsByItemId.set(optionRow.orderItemId, current);

		const currentTotal = optionTotalByItemId.get(optionRow.orderItemId) ?? 0;
		optionTotalByItemId.set(optionRow.orderItemId, currentTotal + (optionRow.optionPrice ?? 0));
	}

	const items = itemRows.map((itemRow) => {
		const optionUnitPrice = optionTotalByItemId.get(itemRow.id) ?? 0;
		const basePrice = itemRow.itemPrice ?? 0;
		const quantity = itemRow.quantity ?? 0;
		const unitPrice = basePrice + optionUnitPrice;

		return {
			id: itemRow.id,
			name: itemRow.productName?.trim() || 'Produk Tanpa Nama',
			variant: itemRow.variantName?.trim() || 'Varian',
			image: itemRow.variantImage?.trim() || null,
			quantity,
			unitPrice,
			lineTotal: unitPrice * quantity,
			options: optionsByItemId.get(itemRow.id) ?? [],
			filePath: itemRow.filePath?.trim() || null
		};
	});

	const [latestPayment] = await db
		.select({ status: payments.status, paymentMethod: payments.paymentMethod })
		.from(payments)
		.where(eq(payments.orderId, orderRow.id))
		.orderBy(desc(payments.createdAt))
		.limit(1);

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

	const timeline: AdminOrderDetailTimelineEntry[] =
		statusLogRows.length > 0
			? statusLogRows.map((logRow) => {
					const status = logRow.status ?? orderRow.status ?? 'pending_payment';
					return {
						status,
						label: formatOrderStatusLabel(status),
						createdAt: logRow.createdAt ? new Date(logRow.createdAt).toISOString() : null,
						changedByName: logRow.changedByName?.trim() || null
					};
				})
			: [
					{
						status: orderRow.status ?? 'pending_payment',
						label: formatOrderStatusLabel(orderRow.status ?? 'pending_payment'),
						createdAt: orderRow.createdAt ? new Date(orderRow.createdAt).toISOString() : null,
						changedByName: null
					}
				];

	const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
	const shippingCost = orderRow.shippingCost ?? 0;
	const grandTotal = orderRow.totalPrice ?? subtotal + shippingCost;
	const status = orderRow.status ?? 'pending_payment';

	const detail: AdminOrderDetailData = {
		id: orderRow.id,
		orderCode: formatOrderCode(orderRow.id),
		status,
		statusLabel: formatOrderStatusLabel(status),
		createdAt: orderRow.createdAt ? new Date(orderRow.createdAt).toISOString() : null,
		updatedAt: orderRow.updatedAt ? new Date(orderRow.updatedAt).toISOString() : null,
		deliveryMethod: orderRow.deliveryMethod ?? null,
		deliveryMethodLabel: formatDeliveryMethodLabel(orderRow.deliveryMethod ?? null),
		shippingCost,
		subtotal,
		grandTotal,
		customerNote: orderRow.customerNote ?? null,
		customerName: orderRow.customerName?.trim() || 'Pelanggan',
		customerEmail: null,
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
		order: detail
	};
};
