import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItems } from '$lib/server/db/schema';
import { loadDraftOrder } from './load-draft-order';

export async function getDraftCartCount(userId: string): Promise<number> {
	const draftOrder = await loadDraftOrder(userId);

	if (!draftOrder) {
		return 0;
	}

	const draftItems = await db
		.select({
			quantity: orderItems.quantity
		})
		.from(orderItems)
		.where(eq(orderItems.orderId, draftOrder.id));

	return draftItems.reduce((total, item) => total + (item.quantity ?? 0), 0);
}
