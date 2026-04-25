import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItems, orders, variants } from '$lib/server/db/schema';
import type { DraftItemOwnership } from '$lib/types/cart';
import { CartActionError } from './errors';

export async function requireDraftItemOwnership(
	userId: string,
	itemId: string
): Promise<DraftItemOwnership> {
	const [draftItem] = await db
		.select({
			orderId: orderItems.orderId,
			itemId: orderItems.id,
			variantStock: variants.stock
		})
		.from(orderItems)
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.leftJoin(variants, eq(orderItems.variantId, variants.id))
		.where(and(eq(orderItems.id, itemId), eq(orders.profileId, userId), eq(orders.status, 'draft')))
		.limit(1);

	if (!draftItem?.orderId || !draftItem.itemId) {
		throw new CartActionError(404, 'Cart item not found.');
	}

	return {
		orderId: draftItem.orderId,
		itemId: draftItem.itemId,
		variantStock: draftItem.variantStock ?? 0
	};
}
