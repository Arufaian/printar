import { redirect } from '@sveltejs/kit';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItems, orders, payments, products, variants } from '$lib/server/db/schema';
import type { OrderListItem } from '$lib/types/order-list';
import type { PageServerLoad } from './$types';

const PREVIEW_LIMIT = 3;

export const load: PageServerLoad = async (event) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/sign-in?redirect=/customer/orders');
	}

	const orderRows = await db
		.select({
			id: orders.id,
			status: orders.status,
			createdAt: orders.createdAt,
			totalPrice: orders.totalPrice,
			deliveryMethod: orders.deliveryMethod
		})
		.from(orders)
		.where(and(eq(orders.profileId, user.id), ne(orders.status, 'draft')))
		.orderBy(desc(orders.createdAt));

	if (orderRows.length === 0) {
		return {
			orders: [] as OrderListItem[]
		};
	}

	const orderIds = orderRows.map((order) => order.id);

	const paymentRows = await db
		.select({
			orderId: payments.orderId,
			status: payments.status,
			createdAt: payments.createdAt
		})
		.from(payments)
		.where(inArray(payments.orderId, orderIds))
		.orderBy(desc(payments.createdAt));

	const latestPaymentStatusByOrderId = new Map<string, string | null>();
	for (const paymentRow of paymentRows) {
		if (!paymentRow.orderId || latestPaymentStatusByOrderId.has(paymentRow.orderId)) continue;
		latestPaymentStatusByOrderId.set(paymentRow.orderId, paymentRow.status ?? null);
	}

	const orderItemRows = await db
		.select({
			id: orderItems.id,
			orderId: orderItems.orderId,
			quantity: orderItems.quantity,
			productName: products.name,
			variantName: variants.name,
			variantImage: variants.imgUrl
		})
		.from(orderItems)
		.leftJoin(variants, eq(orderItems.variantId, variants.id))
		.leftJoin(products, eq(variants.productId, products.id))
		.where(inArray(orderItems.orderId, orderIds));

	const itemRowsByOrderId = new Map<string, typeof orderItemRows>();
	for (const row of orderItemRows) {
		if (!row.orderId) continue;
		const existing = itemRowsByOrderId.get(row.orderId) ?? [];
		existing.push(row);
		itemRowsByOrderId.set(row.orderId, existing);
	}

	const mappedOrders: OrderListItem[] = orderRows.map((orderRow) => {
		const rows = itemRowsByOrderId.get(orderRow.id) ?? [];
		const previewItems = rows.slice(0, PREVIEW_LIMIT).map((row) => ({
			id: row.id,
			name: row.productName?.trim() || 'Produk Tanpa Nama',
			variant: row.variantName?.trim() || 'Varian',
			quantity: row.quantity ?? 0,
			image: row.variantImage?.trim() || null
		}));

		return {
			id: orderRow.id,
			status: orderRow.status ?? 'pending_payment',
			createdAt: orderRow.createdAt ? new Date(orderRow.createdAt).toISOString() : null,
			totalPrice: orderRow.totalPrice ?? 0,
			deliveryMethod: orderRow.deliveryMethod ?? null,
			itemCount: rows.length,
			latestPaymentStatus: latestPaymentStatusByOrderId.get(orderRow.id) ?? null,
			previewItems,
			remainingItemCount: Math.max(0, rows.length - previewItems.length)
		};
	});

	return {
		orders: mappedOrders
	};
};
