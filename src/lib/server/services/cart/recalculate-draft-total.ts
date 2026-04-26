import { eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItemOptions, orderItems, orders } from '$lib/server/db/schema';

type CartTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function recalculateDraftTotal(tx: CartTx, orderId: string): Promise<void> {
	const draftItems = await tx
		.select({
			id: orderItems.id,
			quantity: orderItems.quantity,
			price: orderItems.price
		})
		.from(orderItems)
		.where(eq(orderItems.orderId, orderId));

	const draftItemIds = draftItems
		.map((item) => item.id)
		.filter((itemId): itemId is string => Boolean(itemId));

	const draftItemOptions =
		draftItemIds.length > 0
			? await tx
					.select({
						orderItemId: orderItemOptions.orderItemId,
						price: orderItemOptions.price
					})
					.from(orderItemOptions)
					.where(inArray(orderItemOptions.orderItemId, draftItemIds))
			: [];

	const optionPriceByItemId = new Map<string, number>();
	for (const itemOption of draftItemOptions) {
		if (!itemOption.orderItemId) continue;

		const current = optionPriceByItemId.get(itemOption.orderItemId) ?? 0;
		optionPriceByItemId.set(itemOption.orderItemId, current + (itemOption.price ?? 0));
	}

	const totalPrice = draftItems.reduce((total, item) => {
		const unitPrice = (item.price ?? 0) + (optionPriceByItemId.get(item.id) ?? 0);
		return total + unitPrice * (item.quantity ?? 0);
	}, 0);

	await tx.update(orders).set({ totalPrice }).where(eq(orders.id, orderId));
}
