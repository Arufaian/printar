import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	categories,
	optionGroups,
	options,
	orderItemOptions,
	orderItems,
	orders,
	products,
	profiles,
	variants
} from '$lib/server/db/schema';
import { generateSlug } from '$lib/utils/string';

const normalizeOptionIds = (formValues: FormDataEntryValue[]) => {
	const optionIds = formValues
		.filter((value): value is string => typeof value === 'string')
		.map((value) => value.trim())
		.filter((value) => value.length > 0);

	return Array.from(new Set(optionIds)).sort();
};

const isSameOptionSet = (left: string[], right: string[]) => {
	if (left.length !== right.length) return false;
	return left.every((value, index) => value === right[index]);
};

class AddToCartError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

const resolveProductByParams = async (params: { categorySlug: string; productSlug: string }) => {
	const [categoryRow] = await db
		.select({
			id: categories.id,
			name: categories.name,
			slug: categories.slug
		})
		.from(categories)
		.where(eq(categories.slug, params.categorySlug))
		.limit(1);

	if (!categoryRow) {
		return { categoryRow: null, productRow: null };
	}

	const categoryProductRows = await db
		.select({
			id: products.id,
			name: products.name,
			slug: products.slug,
			description: products.description
		})
		.from(products)
		.where(and(eq(products.categoryId, categoryRow.id), isNull(products.deletedAt)));

	const productRow = categoryProductRows.find((product) => {
		const normalizedSlug = (product.slug ?? '').trim();
		if (normalizedSlug && normalizedSlug === params.productSlug) {
			return true;
		}

		if (product.id === params.productSlug) {
			return true;
		}

		const generatedSlug = generateSlug(product.name ?? '');
		return generatedSlug.length > 0 && generatedSlug === params.productSlug;
	});

	return {
		categoryRow,
		productRow: productRow ?? null
	};
};

export const load: PageServerLoad = async ({ params }) => {
	const { categoryRow, productRow } = await resolveProductByParams(params);

	if (!categoryRow) {
		throw error(404, 'Kategori tidak ditemukan.');
	}

	if (!productRow) {
		throw error(404, 'Produk tidak ditemukan.');
	}

	const variantRows = await db
		.select({
			id: variants.id,
			name: variants.name,
			price: variants.price,
			stock: variants.stock,
			imgUrl: variants.imgUrl
		})
		.from(variants)
		.where(eq(variants.productId, productRow.id));

	const mappedVariants = variantRows.map((variant) => ({
		id: variant.id,
		name: variant.name?.trim() || 'Varian',
		price: typeof variant.price === 'number' && Number.isFinite(variant.price) ? variant.price : 0,
		stock: typeof variant.stock === 'number' && Number.isFinite(variant.stock) ? variant.stock : 0,
		imgUrl:
			variant.imgUrl?.trim() ||
			`https://picsum.photos/seed/variant-${encodeURIComponent(variant.id)}/700/700`
	}));

	const optionGroupRows = await db
		.select({
			id: optionGroups.id,
			name: optionGroups.name
		})
		.from(optionGroups)
		.where(eq(optionGroups.productId, productRow.id));

	const optionGroupIds = optionGroupRows.map((group) => group.id);
	const optionRows =
		optionGroupIds.length > 0
			? await db
					.select({
						id: options.id,
						name: options.name,
						additionalPrice: options.additionalPrice,
						optionGroupId: options.optionGroupId
					})
					.from(options)
					.where(inArray(options.optionGroupId, optionGroupIds))
			: [];

	const optionsByGroupId = new Map<
		string,
		Array<{ id: string; name: string; additionalPrice: number }>
	>();

	for (const option of optionRows) {
		if (!option.optionGroupId) continue;

		const groupOptions = optionsByGroupId.get(option.optionGroupId) ?? [];
		groupOptions.push({
			id: option.id,
			name: option.name?.trim() || 'Opsi',
			additionalPrice:
				typeof option.additionalPrice === 'number' && Number.isFinite(option.additionalPrice)
					? option.additionalPrice
					: 0
		});
		optionsByGroupId.set(option.optionGroupId, groupOptions);
	}

	const mappedOptionGroups = optionGroupRows
		.map((group) => ({
			id: group.id,
			name: group.name?.trim() || 'Pilihan',
			options: optionsByGroupId.get(group.id) ?? []
		}))
		.filter((group) => group.options.length > 0);

	const gallery: Array<{ variantId: string | null; src: string; alt: string }> = mappedVariants.map(
		(variant) => ({
			variantId: variant.id,
			src: variant.imgUrl,
			alt: `${productRow.name ?? 'Produk'} - ${variant.name}`
		})
	);

	if (gallery.length === 0) {
		gallery.push({
			variantId: null,
			src: `https://picsum.photos/seed/product-${encodeURIComponent(productRow.id)}/700/700`,
			alt: productRow.name ?? 'Produk'
		});
	}

	const normalizedProductSlug =
		(productRow.slug ?? '').trim() || generateSlug(productRow.name ?? '') || productRow.id;

	return {
		category: {
			name: categoryRow.name ?? 'Kategori',
			slug: categoryRow.slug ?? params.categorySlug
		},
		product: {
			id: productRow.id,
			slug: normalizedProductSlug,
			name: productRow.name ?? 'Produk tanpa nama',
			description: productRow.description ?? ''
		},
		variants: mappedVariants,
		optionGroups: mappedOptionGroups,
		gallery,
		defaultVariantId: mappedVariants[0]?.id ?? null
	};
};

export const actions: Actions = {
	addToCart: async (event) => {
		const { user } = await event.locals.safeGetSession();

		if (!user) {
			return fail(401, { message: 'Please sign in first to add items to cart.' });
		}

		const formData = await event.request.formData();
		const variantId = String(formData.get('variantId') ?? '').trim();
		const quantityRaw = Number(formData.get('quantity'));
		const optionIds = normalizeOptionIds(formData.getAll('optionIds'));

		console.log('[addToCart] payload', {
			userId: user.id,
			variantId,
			quantity: quantityRaw,
			optionIds
		});

		if (!variantId) {
			return fail(400, { message: 'Variant is required.' });
		}

		if (!Number.isInteger(quantityRaw) || quantityRaw < 1) {
			return fail(400, { message: 'Quantity must be at least 1.' });
		}

		const { productRow } = await resolveProductByParams(event.params);
		if (!productRow) {
			return fail(404, { message: 'Product not found.' });
		}

		const [profileRow] = await db
			.select({ id: profiles.id })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);

		if (!profileRow) {
			return fail(403, { message: 'Profile not found for current user.' });
		}

		const [variantRow] = await db
			.select({
				id: variants.id,
				productId: variants.productId,
				price: variants.price,
				stock: variants.stock
			})
			.from(variants)
			.where(and(eq(variants.id, variantId), eq(variants.productId, productRow.id)))
			.limit(1);

		if (!variantRow) {
			return fail(400, { message: 'Selected variant is invalid.' });
		}

		const variantStock = Number.isFinite(variantRow.stock) ? (variantRow.stock ?? 0) : 0;
		if (variantStock <= 0) {
			return fail(400, { message: 'Selected variant is out of stock.' });
		}

		if (quantityRaw > variantStock) {
			return fail(400, { message: `Only ${variantStock} item(s) left in stock.` });
		}

		const optionGroupRows = await db
			.select({ id: optionGroups.id })
			.from(optionGroups)
			.where(eq(optionGroups.productId, productRow.id));

		const optionGroupIds = optionGroupRows.map((group) => group.id);
		const validOptionRows =
			optionIds.length === 0 || optionGroupIds.length === 0
				? []
				: await db
						.select({
							id: options.id,
							additionalPrice: options.additionalPrice
						})
						.from(options)
						.where(
							and(inArray(options.id, optionIds), inArray(options.optionGroupId, optionGroupIds))
						);

		if (optionIds.length > 0 && validOptionRows.length !== optionIds.length) {
			return fail(400, { message: 'One or more selected options are invalid.' });
		}

		const validOptionMap = new Map(
			validOptionRows.map((option) => [option.id, option.additionalPrice ?? 0] as const)
		);

		try {
			await db.transaction(async (tx) => {
				const [existingDraftOrder] = await tx
					.select({
						id: orders.id
					})
					.from(orders)
					.where(and(eq(orders.profileId, user.id), eq(orders.status, 'draft')))
					.orderBy(desc(orders.createdAt))
					.limit(1);

				let draftOrderId = existingDraftOrder?.id;

				if (!draftOrderId) {
					const [createdDraftOrder] = await tx
						.insert(orders)
						.values({
							profileId: user.id,
							status: 'draft',
							totalPrice: 0
						})
						.returning({ id: orders.id });

					draftOrderId = createdDraftOrder.id;
				}

				const existingLineItems = await tx
					.select({
						id: orderItems.id,
						quantity: orderItems.quantity
					})
					.from(orderItems)
					.where(and(eq(orderItems.orderId, draftOrderId), eq(orderItems.variantId, variantId)));

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

				const normalizedIncomingOptionIds = [...optionIds].sort();

				const matchingExistingItem = existingLineItems.find((item) => {
					const normalizedExistingOptionIds = [
						...(optionIdsByOrderItemId.get(item.id) ?? [])
					].sort();
					return isSameOptionSet(normalizedExistingOptionIds, normalizedIncomingOptionIds);
				});

				if (matchingExistingItem) {
					const existingQuantity = matchingExistingItem.quantity ?? 0;
					const nextQuantity = existingQuantity + quantityRaw;

					if (nextQuantity > variantStock) {
						throw new AddToCartError(400, `Only ${variantStock} item(s) left in stock.`);
					}

					await tx
						.update(orderItems)
						.set({
							quantity: nextQuantity,
							price: variantRow.price ?? 0
						})
						.where(eq(orderItems.id, matchingExistingItem.id));
				} else {
					const [createdItem] = await tx
						.insert(orderItems)
						.values({
							orderId: draftOrderId,
							variantId,
							quantity: quantityRaw,
							price: variantRow.price ?? 0
						})
						.returning({ id: orderItems.id });

					if (optionIds.length > 0) {
						await tx.insert(orderItemOptions).values(
							optionIds.map((optionId) => ({
								orderItemId: createdItem.id,
								optionId,
								price: validOptionMap.get(optionId) ?? 0
							}))
						);
					}
				}

				const draftItems = await tx
					.select({
						id: orderItems.id,
						quantity: orderItems.quantity,
						price: orderItems.price
					})
					.from(orderItems)
					.where(eq(orderItems.orderId, draftOrderId));

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

				const optionPriceByOrderItemId = new Map<string, number>();
				for (const itemOption of draftItemOptions) {
					if (!itemOption.orderItemId) continue;

					const current = optionPriceByOrderItemId.get(itemOption.orderItemId) ?? 0;
					optionPriceByOrderItemId.set(itemOption.orderItemId, current + (itemOption.price ?? 0));
				}

				const totalPrice = draftItems.reduce((total, item) => {
					const unitPrice = (item.price ?? 0) + (optionPriceByOrderItemId.get(item.id) ?? 0);
					return total + unitPrice * (item.quantity ?? 0);
				}, 0);

				await tx.update(orders).set({ totalPrice }).where(eq(orders.id, draftOrderId));
			});
		} catch (err) {
			if (err instanceof AddToCartError) {
				return fail(err.status, { message: err.message });
			}

			console.error('[addToCart] unexpected error', err);
			return fail(500, { message: 'Failed to add item to cart. Please try again.' });
		}

		return {
			type: 'success' as const,
			text: 'Item added to cart.'
		};
	}
};
