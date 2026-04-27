import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orderItemOptions, orderItems, orders } from '$lib/server/db/schema';
import { CartActionError } from './errors';
import { recalculateDraftTotal } from './recalculate-draft-total';

const isSameOptionSet = (left: string[], right: string[]) => {
	if (left.length !== right.length) return false;
	return left.every((value, index) => value === right[index]);
};

const normalizeFilePath = (filePath?: string | null) => filePath?.trim() ?? '';

export const hasSameCartItemConfiguration = (input: {
	existingOptionIds: string[];
	incomingOptionIds: string[];
	existingFilePath?: string | null;
	incomingFilePath?: string;
}) => {
	const normalizedExistingOptionIds = [...input.existingOptionIds].sort();
	const normalizedIncomingOptionIds = [...input.incomingOptionIds].sort();

	if (!isSameOptionSet(normalizedExistingOptionIds, normalizedIncomingOptionIds)) {
		return false;
	}

	return normalizeFilePath(input.existingFilePath) === normalizeFilePath(input.incomingFilePath);
};

type AddItemToDraftCartInput = {
	userId: string;
	variantId: string;
	quantity: number;
	variantPrice: number;
	variantStock: number;
	optionIds: string[];
	optionPriceById: Map<string, number>;
	designFilePath?: string;
};

export async function addItemToDraftCart(input: AddItemToDraftCartInput): Promise<void> {
	await db.transaction(async (tx) => {
		const [existingDraftOrder] = await tx
			.select({ id: orders.id })
			.from(orders)
			.where(and(eq(orders.profileId, input.userId), eq(orders.status, 'draft')))
			.orderBy(desc(orders.createdAt))
			.limit(1);

		let draftOrderId = existingDraftOrder?.id;

		if (!draftOrderId) {
			const [createdDraftOrder] = await tx
				.insert(orders)
				.values({
					profileId: input.userId,
					status: 'draft',
					totalPrice: 0
				})
				.returning({ id: orders.id });

			draftOrderId = createdDraftOrder.id;
		}

		const existingLineItems = await tx
			.select({
				id: orderItems.id,
				quantity: orderItems.quantity,
				filePath: orderItems.filePath
			})
			.from(orderItems)
			.where(and(eq(orderItems.orderId, draftOrderId), eq(orderItems.variantId, input.variantId)));

		const existingItemIds = existingLineItems
			.map((item) => item.id)
			.filter((itemId): itemId is string => Boolean(itemId));

		const existingItemOptionRows =
			existingItemIds.length > 0
				? await tx
						.select({
							orderItemId: orderItemOptions.orderItemId,
							optionId: orderItemOptions.optionId
						})
						.from(orderItemOptions)
						.where(inArray(orderItemOptions.orderItemId, existingItemIds))
				: [];

		const optionIdsByOrderItemId = new Map<string, string[]>();
		for (const row of existingItemOptionRows) {
			if (!row.orderItemId || !row.optionId) continue;

			const list = optionIdsByOrderItemId.get(row.orderItemId) ?? [];
			list.push(row.optionId);
			optionIdsByOrderItemId.set(row.orderItemId, list);
		}

		const matchingExistingItem = existingLineItems.find((item) => {
			return hasSameCartItemConfiguration({
				existingOptionIds: optionIdsByOrderItemId.get(item.id) ?? [],
				incomingOptionIds: input.optionIds,
				existingFilePath: item.filePath,
				incomingFilePath: input.designFilePath
			});
		});

		if (matchingExistingItem) {
			const existingQuantity = matchingExistingItem.quantity ?? 0;
			const nextQuantity = existingQuantity + input.quantity;

			if (nextQuantity > input.variantStock) {
				throw new CartActionError(400, `Stok tersisa ${input.variantStock} item.`);
			}

			await tx
				.update(orderItems)
				.set({
					quantity: nextQuantity,
					price: input.variantPrice
				})
				.where(eq(orderItems.id, matchingExistingItem.id));
		} else {
			const [createdItem] = await tx
				.insert(orderItems)
				.values({
					orderId: draftOrderId,
					variantId: input.variantId,
					quantity: input.quantity,
					price: input.variantPrice,
					filePath: input.designFilePath
				})
				.returning({ id: orderItems.id });

			if (input.optionIds.length > 0) {
				await tx.insert(orderItemOptions).values(
					input.optionIds.map((optionId) => ({
						orderItemId: createdItem.id,
						optionId,
						price: input.optionPriceById.get(optionId) ?? 0
					}))
				);
			}
		}

		await recalculateDraftTotal(tx, draftOrderId);
	});
}
