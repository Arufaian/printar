import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { checkoutIntentItems, checkoutIntents, orderItems, orders } from '$lib/server/db/schema';
import { CheckoutIntentError } from './errors';

type CreateOrRefreshParams = {
	userId: string;
	selectedItemIds: string[];
};

export async function createOrRefreshCheckoutIntentFromCart({
	userId,
	selectedItemIds
}: CreateOrRefreshParams): Promise<{ intentId: string; orderId: string }> {
	if (selectedItemIds.length === 0) {
		throw new CheckoutIntentError(400, 'Pilih minimal satu item untuk checkout.');
	}

	const selectedRows = await db
		.select({
			itemId: orderItems.id,
			orderId: orderItems.orderId,
			filePath: orderItems.filePath
		})
		.from(orderItems)
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.where(
			and(
				inArray(orderItems.id, selectedItemIds),
				eq(orders.profileId, userId),
				eq(orders.status, 'draft')
			)
		);

	if (selectedRows.length !== selectedItemIds.length) {
		throw new CheckoutIntentError(404, 'Satu atau lebih item checkout tidak ditemukan.');
	}

	const orderIdSet = new Set(
		selectedRows.map((row) => row.orderId).filter((value): value is string => Boolean(value))
	);
	if (orderIdSet.size !== 1) {
		throw new CheckoutIntentError(400, 'Item checkout harus berasal dari keranjang yang sama.');
	}

	const missingDesignFile = selectedRows.some((row) => !(row.filePath?.trim() ?? ''));
	if (missingDesignFile) {
		throw new CheckoutIntentError(
			400,
			'Masih ada item yang belum memiliki file desain. Lengkapi dulu sebelum checkout.'
		);
	}

	const orderId = orderIdSet.values().next().value as string;

	const [sourceOrder] = await db
		.select({ deliveryMethod: orders.deliveryMethod, shippingCost: orders.shippingCost })
		.from(orders)
		.where(and(eq(orders.id, orderId), eq(orders.profileId, userId), eq(orders.status, 'draft')))
		.limit(1);

	if (!sourceOrder) {
		throw new CheckoutIntentError(404, 'Keranjang draft tidak ditemukan.');
	}

	const [existingIntent] = await db
		.select({ id: checkoutIntents.id })
		.from(checkoutIntents)
		.where(
			and(
				eq(checkoutIntents.profileId, userId),
				eq(checkoutIntents.orderId, orderId),
				eq(checkoutIntents.source, 'cart'),
				eq(checkoutIntents.status, 'active')
			)
		)
		.limit(1);

	const intentId = existingIntent?.id ?? crypto.randomUUID();

	if (existingIntent) {
		await db
			.update(checkoutIntents)
			.set({
				deliveryMethod: sourceOrder.deliveryMethod,
				shippingCost: sourceOrder.shippingCost ?? 0,
				updatedAt: new Date()
			})
			.where(eq(checkoutIntents.id, existingIntent.id));

		await db.delete(checkoutIntentItems).where(eq(checkoutIntentItems.intentId, existingIntent.id));
	} else {
		await db.insert(checkoutIntents).values({
			id: intentId,
			profileId: userId,
			orderId,
			source: 'cart',
			status: 'active',
			deliveryMethod: sourceOrder.deliveryMethod,
			shippingCost: sourceOrder.shippingCost ?? 0
		});
	}

	await db.insert(checkoutIntentItems).values(
		selectedItemIds.map((orderItemId) => ({
			intentId,
			orderItemId
		}))
	);

	return { intentId, orderId };
}
