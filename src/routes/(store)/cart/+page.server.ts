import { and, desc, eq, inArray } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
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

export const load: PageServerLoad = async (event) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/sign-in?redirect=/cart');
	}

	const [draftOrder] = await db
		.select({
			id: orders.id,
			shippingCost: orders.shippingCost,
			totalPrice: orders.totalPrice
		})
		.from(orders)
		.where(and(eq(orders.profileId, user.id), eq(orders.status, 'draft')))
		.orderBy(desc(orders.createdAt))
		.limit(1);

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
