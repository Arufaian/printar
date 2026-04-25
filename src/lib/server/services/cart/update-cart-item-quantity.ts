import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItems } from '$lib/server/db/schema';
import type { DraftItemOwnership } from '$lib/types/cart';
import { CartActionError } from './errors';
import { recalculateDraftTotal } from './recalculate-draft-total';

type UpdateCartItemQuantityInput = {
	ownedItem: DraftItemOwnership;
	quantity: number;
};

export async function updateCartItemQuantity(input: UpdateCartItemQuantityInput): Promise<void> {
	if (input.quantity > input.ownedItem.variantStock) {
		throw new CartActionError(400, `Only ${input.ownedItem.variantStock} item(s) left in stock.`);
	}

	await db.transaction(async (tx) => {
		await tx
			.update(orderItems)
			.set({ quantity: input.quantity })
			.where(eq(orderItems.id, input.ownedItem.itemId));

		await recalculateDraftTotal(tx, input.ownedItem.orderId);
	});
}
