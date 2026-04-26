import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItemOptions, orderItems } from '$lib/server/db/schema';
import type { DraftItemOwnership } from '$lib/types/cart';
import { recalculateDraftTotal } from './recalculate-draft-total';

export async function removeCartItem(ownedItem: DraftItemOwnership): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(orderItemOptions).where(eq(orderItemOptions.orderItemId, ownedItem.itemId));
		await tx.delete(orderItems).where(eq(orderItems.id, ownedItem.itemId));

		await recalculateDraftTotal(tx, ownedItem.orderId);
	});
}
