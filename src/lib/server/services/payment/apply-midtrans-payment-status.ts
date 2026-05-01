import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import {
	checkoutIntentItems,
	checkoutIntents,
	orderItemOptions,
	orderItems,
	orderStatusLogs,
	orders,
	payments,
	variants
} from '$lib/server/db/schema';
import { mapMidtransStatusToOrderStatus } from './midtrans.js';

const paymentStatuses = new Set(['pending', 'settlement', 'expire', 'cancel']);

export class StockInsufficientError extends Error {}

type ApplyParams = {
	orderId: string;
	transactionStatus: string;
	paymentType?: string | null;
	rawPayload: Record<string, unknown>;
	receivedAt?: string;
};

export async function applyMidtransPaymentStatus(
	tx: {
		select: any;
		update: any;
		insert: any;
		delete: any;
	},
	params: ApplyParams
): Promise<{ found: boolean; paymentStatus: string | null; mappedOrderStatus: string | null }> {
	const normalizedStatus = params.transactionStatus.toLowerCase();
	const paymentStatus = paymentStatuses.has(normalizedStatus) ? normalizedStatus : null;
	if (!paymentStatus) {
		return { found: true, paymentStatus: null, mappedOrderStatus: null };
	}

	const mappedOrderStatus = mapMidtransStatusToOrderStatus(params.transactionStatus);
	const receivedAt = params.receivedAt ?? new Date().toISOString();

	const [orderRow] = await tx
		.select({ id: orders.id, status: orders.status })
		.from(orders)
		.where(eq(orders.id, params.orderId))
		.limit(1);

	if (!orderRow?.id) {
		return { found: false, paymentStatus, mappedOrderStatus };
	}

	const [existingPayment] = await tx
		.select({ id: payments.id, rawResponse: payments.rawResponse })
		.from(payments)
		.where(eq(payments.orderId, params.orderId))
		.limit(1);

	const existingRawResponse =
		existingPayment?.rawResponse && typeof existingPayment.rawResponse === 'object'
			? existingPayment.rawResponse
			: {};

	const mergedRawResponse = {
		...existingRawResponse,
		webhook_last_payload: params.rawPayload,
		webhook_received_at: receivedAt,
		received_at: receivedAt
	};

	if (existingPayment?.id) {
		await tx
			.update(payments)
			.set({
				status: paymentStatus,
				paymentMethod: params.paymentType ?? null,
				rawResponse: mergedRawResponse
			})
			.where(eq(payments.id, existingPayment.id));
	} else {
		await tx.insert(payments).values({
			orderId: params.orderId,
			status: paymentStatus,
			paymentMethod: params.paymentType ?? null,
			rawResponse: mergedRawResponse
		});
	}

	const shouldDecrementStock = mappedOrderStatus === 'paid' && orderRow.status !== 'paid';
	if (shouldDecrementStock) {
		const itemRows = await tx
			.select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
			.from(orderItems)
			.where(eq(orderItems.orderId, params.orderId));

		for (const itemRow of itemRows) {
			const variantId = itemRow.variantId;
			const quantity = itemRow.quantity ?? 0;
			if (!variantId || quantity <= 0) continue;

			const updatedRows = await tx
				.update(variants)
				.set({ stock: sql`${variants.stock} - ${quantity}` })
				.where(and(eq(variants.id, variantId), gte(variants.stock, quantity)))
				.returning({ id: variants.id });

			if (updatedRows.length === 0) {
				throw new StockInsufficientError('Stok varian tidak mencukupi untuk settlement.');
			}
		}
	}

	if (mappedOrderStatus && mappedOrderStatus !== orderRow.status) {
		await tx.update(orders).set({ status: mappedOrderStatus }).where(eq(orders.id, params.orderId));

		await tx.insert(orderStatusLogs).values({
			orderId: params.orderId,
			status: mappedOrderStatus,
			changeBy: null
		});
	}

	if (mappedOrderStatus === 'paid') {
		const [activeIntent] = await tx
			.select({ id: checkoutIntents.id, sourceOrderId: checkoutIntents.orderId })
			.from(checkoutIntents)
			.where(
				and(
					eq(checkoutIntents.transactionOrderId, params.orderId),
					eq(checkoutIntents.status, 'active')
				)
			)
			.limit(1);

		if (activeIntent?.id && activeIntent.sourceOrderId) {
			const selectedIntentItems = await tx
				.select({ orderItemId: checkoutIntentItems.orderItemId })
				.from(checkoutIntentItems)
				.where(eq(checkoutIntentItems.intentId, activeIntent.id));

			const selectedItemIds = selectedIntentItems
				.map((item: { orderItemId: string | null }) => item.orderItemId)
				.filter((itemId: string | null): itemId is string => Boolean(itemId));

			if (selectedItemIds.length > 0) {
				await tx
					.delete(orderItemOptions)
					.where(inArray(orderItemOptions.orderItemId, selectedItemIds));

				await tx
					.delete(orderItems)
					.where(
						and(
							eq(orderItems.orderId, activeIntent.sourceOrderId),
							inArray(orderItems.id, selectedItemIds)
						)
					);
			}

			const remainingItems = await tx
				.select({ id: orderItems.id, quantity: orderItems.quantity, price: orderItems.price })
				.from(orderItems)
				.where(eq(orderItems.orderId, activeIntent.sourceOrderId));

			const remainingItemIds = remainingItems.map((item: { id: string }) => item.id);
			let remainingOptionsTotal = 0;

			if (remainingItemIds.length > 0) {
				const remainingOptions = await tx
					.select({ price: orderItemOptions.price })
					.from(orderItemOptions)
					.where(inArray(orderItemOptions.orderItemId, remainingItemIds));

				remainingOptionsTotal = remainingOptions.reduce(
					(total: number, option: { price: number | null }) => total + (option.price ?? 0),
					0
				);
			}

			const remainingItemsTotal = remainingItems.reduce(
				(total: number, item: { price: number | null; quantity: number | null }) =>
					total + (item.price ?? 0) * (item.quantity ?? 0),
				0
			);

			const [sourceOrder] = await tx
				.select({ shippingCost: orders.shippingCost })
				.from(orders)
				.where(eq(orders.id, activeIntent.sourceOrderId))
				.limit(1);

			const nextTotalPrice =
				remainingItemsTotal + remainingOptionsTotal + (sourceOrder?.shippingCost ?? 0);

			await tx
				.update(orders)
				.set({ totalPrice: nextTotalPrice, customerNote: null })
				.where(eq(orders.id, activeIntent.sourceOrderId));

			await tx
				.update(checkoutIntents)
				.set({
					status: 'converted',
					convertedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(checkoutIntents.id, activeIntent.id));
		}
	}

	return { found: true, paymentStatus, mappedOrderStatus };
}
