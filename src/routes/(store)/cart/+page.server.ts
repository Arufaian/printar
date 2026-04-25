import { and, desc, eq, inArray } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import {
	orderItemOptions,
	orderItems,
	orders,
	options,
	products,
	variants
} from '$lib/server/db/schema';

type CartItemData = {
	id: string;
	title: string;
	variant: string;
	options: string[];
	image: string;
	unitPrice: number;
	quantity: number;
	stock: number;
};

class CartActionError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

const loadDraftOrder = async (userId: string) => {
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
};

const buildCartPayload = async (userId: string) => {
	const draftOrder = await loadDraftOrder(userId);

	if (!draftOrder) {
		return {
			cartItems: [] as CartItemData[],
			summary: {
				orderId: null,
				subtotal: 0,
				shippingCost: 0,
				total: 0
			}
		};
	}

	const itemRows = await db
		.select({
			id: orderItems.id,
			quantity: orderItems.quantity,
			itemPrice: orderItems.price,
			variantName: variants.name,
			variantStock: variants.stock,
			variantImage: variants.imgUrl,
			productName: products.name
		})
		.from(orderItems)
		.leftJoin(variants, eq(orderItems.variantId, variants.id))
		.leftJoin(products, eq(variants.productId, products.id))
		.where(eq(orderItems.orderId, draftOrder.id));

	const itemIds = itemRows.map((item) => item.id).filter((id): id is string => Boolean(id));

	const optionRows =
		itemIds.length > 0
			? await db
					.select({
						orderItemId: orderItemOptions.orderItemId,
						optionPrice: orderItemOptions.price,
						optionName: options.name
					})
					.from(orderItemOptions)
					.leftJoin(options, eq(orderItemOptions.optionId, options.id))
					.where(inArray(orderItemOptions.orderItemId, itemIds))
			: [];

	const optionNamesByItemId = new Map<string, string[]>();
	const optionPriceByItemId = new Map<string, number>();

	for (const optionRow of optionRows) {
		if (!optionRow.orderItemId) continue;

		const normalizedOptionName = optionRow.optionName?.trim() || 'Option';
		const optionList = optionNamesByItemId.get(optionRow.orderItemId) ?? [];
		optionList.push(normalizedOptionName);
		optionNamesByItemId.set(optionRow.orderItemId, optionList);

		const currentOptionPrice = optionPriceByItemId.get(optionRow.orderItemId) ?? 0;
		optionPriceByItemId.set(
			optionRow.orderItemId,
			currentOptionPrice + (optionRow.optionPrice ?? 0)
		);
	}

	const cartItems: CartItemData[] = itemRows.map((item) => {
		const basePrice = item.itemPrice ?? 0;
		const optionAdditionalPrice = optionPriceByItemId.get(item.id) ?? 0;

		return {
			id: item.id,
			title: item.productName?.trim() || 'Untitled Product',
			variant: item.variantName?.trim() || 'Variant',
			options: optionNamesByItemId.get(item.id) ?? [],
			image:
				item.variantImage?.trim() ||
				`https://picsum.photos/seed/cart-item-${encodeURIComponent(item.id)}/120/120`,
			unitPrice: basePrice + optionAdditionalPrice,
			quantity: item.quantity ?? 1,
			stock: item.variantStock ?? 0
		};
	});

	const subtotal = cartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
	const shippingCost = draftOrder.shippingCost ?? 0;
	const total = draftOrder.totalPrice ?? subtotal + shippingCost;

	return {
		cartItems,
		summary: {
			orderId: draftOrder.id,
			subtotal,
			shippingCost,
			total
		}
	};
};

const requireDraftItemOwnership = async (userId: string, itemId: string) => {
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
};

export const load = async (
	event: Parameters<NonNullable<import('./$types').PageServerLoad>>[0]
) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/sign-in?redirect=/cart');
	}

	return buildCartPayload(user.id);
};

export const actions: Actions = {
	updateQuantity: async (event) => {
		const { user } = await event.locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'Please sign in first.' });
		}

		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '').trim();
		const quantity = Number(formData.get('quantity'));

		if (!itemId) {
			return fail(400, { message: 'Cart item is required.' });
		}

		if (!Number.isInteger(quantity) || quantity < 1) {
			return fail(400, { message: 'Quantity must be at least 1.' });
		}

		try {
			const ownedItem = await requireDraftItemOwnership(user.id, itemId);
			if (quantity > ownedItem.variantStock) {
				return fail(400, { message: `Only ${ownedItem.variantStock} item(s) left in stock.` });
			}

			await db.transaction(async (tx) => {
				await tx.update(orderItems).set({ quantity }).where(eq(orderItems.id, ownedItem.itemId));

				const draftItems = await tx
					.select({
						id: orderItems.id,
						quantity: orderItems.quantity,
						price: orderItems.price
					})
					.from(orderItems)
					.where(eq(orderItems.orderId, ownedItem.orderId));

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

				await tx.update(orders).set({ totalPrice }).where(eq(orders.id, ownedItem.orderId));
			});

			return {
				type: 'success' as const,
				text: 'Item quantity updated.'
			};
		} catch (err) {
			if (err instanceof CartActionError) {
				return fail(err.status, { message: err.message });
			}

			console.error('[cart:updateQuantity] unexpected error', err);
			return fail(500, { message: 'Failed to update quantity. Please try again.' });
		}
	},

	removeItem: async (event) => {
		const { user } = await event.locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'Please sign in first.' });
		}

		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '').trim();

		if (!itemId) {
			return fail(400, { message: 'Cart item is required.' });
		}

		try {
			const ownedItem = await requireDraftItemOwnership(user.id, itemId);

			await db.transaction(async (tx) => {
				await tx.delete(orderItemOptions).where(eq(orderItemOptions.orderItemId, ownedItem.itemId));
				await tx.delete(orderItems).where(eq(orderItems.id, ownedItem.itemId));

				const draftItems = await tx
					.select({
						id: orderItems.id,
						quantity: orderItems.quantity,
						price: orderItems.price
					})
					.from(orderItems)
					.where(eq(orderItems.orderId, ownedItem.orderId));

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

				await tx.update(orders).set({ totalPrice }).where(eq(orders.id, ownedItem.orderId));
			});

			return {
				type: 'success' as const,
				text: 'Item removed from cart.'
			};
		} catch (err) {
			if (err instanceof CartActionError) {
				return fail(err.status, { message: err.message });
			}

			console.error('[cart:removeItem] unexpected error', err);
			return fail(500, { message: 'Failed to remove item. Please try again.' });
		}
	}
};
