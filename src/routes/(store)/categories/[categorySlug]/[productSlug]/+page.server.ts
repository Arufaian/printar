import { and, eq, inArray } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { optionGroups, options, profiles, variants } from '$lib/server/db/schema';
import {
	CartActionError,
	addItemToDraftCart,
	parseOptionalDesignFilePath
} from '$lib/server/services/cart';
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
			return fail(401, {
				message: 'Silakan login terlebih dahulu untuk menambahkan item ke keranjang.'
			});
		}

		const formData = await event.request.formData();
		const variantId = String(formData.get('variantId') ?? '').trim();
		const quantityRaw = Number(formData.get('quantity'));
		const optionIds = normalizeOptionIds(formData.getAll('optionIds'));
		const designFilePathResult = parseOptionalDesignFilePath(formData.get('designFilePath'));

		if (!variantId) {
			return fail(400, { message: 'Varian wajib dipilih.' });
		}

		if (!Number.isInteger(quantityRaw) || quantityRaw < 1) {
			return fail(400, { message: 'Jumlah minimal 1.' });
		}

		if (!designFilePathResult.ok) {
			return fail(400, { message: designFilePathResult.message });
		}

		const params = {
			categorySlug: event.params.categorySlug ?? '',
			productSlug: event.params.productSlug ?? ''
		};

		const { productRow } = await resolveStoreProductByParams(params);
		if (!productRow) {
			return fail(404, { message: 'Produk tidak ditemukan.' });
		}

		const [profileRow] = await db
			.select({ id: profiles.id })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);

		if (!profileRow) {
			return fail(403, { message: 'Profil pengguna tidak ditemukan.' });
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
			return fail(400, { message: 'Varian yang dipilih tidak valid.' });
		}

		const variantStock = Number.isFinite(variantRow.stock) ? (variantRow.stock ?? 0) : 0;
		if (variantStock <= 0) {
			return fail(400, { message: 'Varian yang dipilih sedang habis.' });
		}

		if (quantityRaw > variantStock) {
			return fail(400, { message: `Stok tersisa ${variantStock} item.` });
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
			return fail(400, { message: 'Satu atau lebih opsi yang dipilih tidak valid.' });
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
				optionPriceById,
				designFilePath: designFilePathResult.value
			});
		} catch (err) {
			if (err instanceof CartActionError) {
				return fail(err.status, { message: err.message });
			}

			console.error('[addToCart] unexpected error', err);
			return fail(500, { message: 'Gagal menambahkan item ke keranjang. Silakan coba lagi.' });
		}

		return {
			type: 'success' as const,
			text: 'Item berhasil ditambahkan ke keranjang.'
		};
	}
};
