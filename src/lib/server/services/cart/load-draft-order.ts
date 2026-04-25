import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';

export async function loadDraftOrder(userId: string) {
	const [draftOrder] = await db
		.select({
			id: orders.id,
			shippingCost: orders.shippingCost,
			totalPrice: orders.totalPrice
		})
		.from(orders)
		.where(and(eq(orders.profileId, userId), eq(orders.status, 'draft')))
		.orderBy(desc(orders.createdAt))
		.limit(1);

	return draftOrder ?? null;
}
