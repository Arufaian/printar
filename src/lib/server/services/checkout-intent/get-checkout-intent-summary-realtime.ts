import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	checkoutIntentItems,
	checkoutIntents,
	orderItemOptions,
	orderItems,
	orders
} from '$lib/server/db/schema';
import { CheckoutIntentError } from './errors';

export type CheckoutIntentSummary = {
	intentId: string;
	orderId: string;
	selectedItemIds: string[];
	selectedCount: number;
	selectedSubtotal: number;
	shippingCost: number;
	grandTotal: number;
};

type OrderStatusFilter = 'draft' | 'pending_payment';

type GetCheckoutIntentSummaryOptions = {
	allowedOrderStatuses?: OrderStatusFilter[];
};

export async function getCheckoutIntentSummaryRealtime(
	userId: string,
	intentId: string,
	options: GetCheckoutIntentSummaryOptions = {}
): Promise<CheckoutIntentSummary> {
	const allowedOrderStatuses = options.allowedOrderStatuses ?? ['draft'];

	const [intent] = await db
		.select({
			id: checkoutIntents.id,
			orderId: checkoutIntents.orderId,
			status: checkoutIntents.status,
			shippingCost: orders.shippingCost
		})
		.from(checkoutIntents)
		.innerJoin(orders, eq(checkoutIntents.orderId, orders.id))
		.where(
			and(
				eq(checkoutIntents.id, intentId),
				eq(checkoutIntents.profileId, userId),
				eq(checkoutIntents.status, 'active'),
				inArray(orders.status, allowedOrderStatuses)
			)
		)
		.limit(1);

	if (!intent?.orderId) {
		throw new CheckoutIntentError(404, 'Checkout intent tidak ditemukan atau tidak aktif.');
	}

	const selectedIntentItems = await db
		.select({ orderItemId: checkoutIntentItems.orderItemId })
		.from(checkoutIntentItems)
		.where(eq(checkoutIntentItems.intentId, intent.id));

	const selectedItemIds = selectedIntentItems
		.map((item) => item.orderItemId)
		.filter((itemId): itemId is string => Boolean(itemId));

	if (selectedItemIds.length === 0) {
		throw new CheckoutIntentError(
			400,
			'Checkout intent tidak memiliki item. Silakan pilih ulang item.'
		);
	}

	const itemRows = await db
		.select({
			id: orderItems.id,
			quantity: orderItems.quantity,
			price: orderItems.price
		})
		.from(orderItems)
		.where(and(eq(orderItems.orderId, intent.orderId), inArray(orderItems.id, selectedItemIds)));

	if (itemRows.length !== selectedItemIds.length) {
		throw new CheckoutIntentError(404, 'Sebagian item checkout sudah tidak tersedia.');
	}

	const optionRows = await db
		.select({
			orderItemId: orderItemOptions.orderItemId,
			price: orderItemOptions.price
		})
		.from(orderItemOptions)
		.where(inArray(orderItemOptions.orderItemId, selectedItemIds));

	const optionPriceByItemId = new Map<string, number>();
	for (const optionRow of optionRows) {
		if (!optionRow.orderItemId) continue;
		const current = optionPriceByItemId.get(optionRow.orderItemId) ?? 0;
		optionPriceByItemId.set(optionRow.orderItemId, current + (optionRow.price ?? 0));
	}

	const selectedSubtotal = itemRows.reduce((total, item) => {
		const unitPrice = (item.price ?? 0) + (optionPriceByItemId.get(item.id) ?? 0);
		return total + unitPrice * (item.quantity ?? 0);
	}, 0);

	const shippingCost = intent.shippingCost ?? 0;

	return {
		intentId: intent.id,
		orderId: intent.orderId,
		selectedItemIds,
		selectedCount: selectedItemIds.length,
		selectedSubtotal,
		shippingCost,
		grandTotal: selectedSubtotal + shippingCost
	};
}
