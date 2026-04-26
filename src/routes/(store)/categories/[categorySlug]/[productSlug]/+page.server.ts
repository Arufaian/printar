import { and, eq, inArray } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { optionGroups, options, profiles, variants } from '$lib/server/db/schema';
import { CartActionError, addItemToDraftCart } from '$lib/server/services/cart';
import {
	StoreCategoryNotFoundError,
	StoreProductNotFoundError,
	buildStoreProductDetailPayload,
	normalizeOptionIds,
	resolveStoreProductByParams
} from '$lib/server/services/store-product';

export const load = async (
	event: Parameters<NonNullable<import('./$types').PageServerLoad>>[0]
) => {
	const params = {
		categorySlug: event.params.categorySlug ?? '',
		productSlug: event.params.productSlug ?? ''
	};

	try {
		return await buildStoreProductDetailPayload(params);
	} catch (err) {
		if (err instanceof StoreCategoryNotFoundError) {
			throw error(404, err.message);
		}

		if (err instanceof StoreProductNotFoundError) {
			throw error(404, err.message);
		}

		throw err;
	}
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

		if (!variantId) {
			return fail(400, { message: 'Variant is required.' });
		}

		if (!Number.isInteger(quantityRaw) || quantityRaw < 1) {
			return fail(400, { message: 'Quantity must be at least 1.' });
		}

		const params = {
			categorySlug: event.params.categorySlug ?? '',
			productSlug: event.params.productSlug ?? ''
		};

		const { productRow } = await resolveStoreProductByParams(params);
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

		const optionPriceById = new Map(
			validOptionRows.map((option) => [option.id, option.additionalPrice ?? 0] as const)
		);

		try {
			await addItemToDraftCart({
				userId: user.id,
				variantId,
				quantity: quantityRaw,
				variantPrice: variantRow.price ?? 0,
				variantStock,
				optionIds,
				optionPriceById
			});
		} catch (err) {
			if (err instanceof CartActionError) {
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
