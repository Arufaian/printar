import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { categories, products, variants } from '$lib/server/db/schema';
import { generateSlug } from '$lib/utils/string';

export const load: PageServerLoad = async ({ params }) => {
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
		throw error(404, 'Kategori tidak ditemukan.');
	}

	const productRows = await db
		.select({
			id: products.id,
			name: products.name,
			slug: products.slug,
			description: products.description
		})
		.from(products)
		.where(and(eq(products.categoryId, categoryRow.id), isNull(products.deletedAt)))
		.orderBy(desc(products.createdAt));

	const activeProductRows = productRows.filter((product) => product.id);
	const activeProductIds = activeProductRows.map((product) => product.id);

	const variantRows =
		activeProductIds.length > 0
			? await db
					.select({
						productId: variants.productId,
						price: variants.price,
						imgUrl: variants.imgUrl
					})
					.from(variants)
					.where(inArray(variants.productId, activeProductIds))
			: [];

	const lowestVariantByProductId = new Map<string, { price: number; imgUrl: string | null }>();

	for (const variant of variantRows) {
		if (!variant.productId || typeof variant.price !== 'number' || Number.isNaN(variant.price)) {
			continue;
		}

		const current = lowestVariantByProductId.get(variant.productId);
		if (!current || variant.price < current.price) {
			lowestVariantByProductId.set(variant.productId, {
				price: variant.price,
				imgUrl: variant.imgUrl
			});
		}
	}

	const mappedProducts = activeProductRows.map((product) => {
		const lowestVariant = lowestVariantByProductId.get(product.id);
		const normalizedSlug =
			(product.slug ?? '').trim() || generateSlug(product.name ?? '') || product.id;

		return {
			id: product.id,
			slug: normalizedSlug,
			title: product.name ?? 'Produk tanpa nama',
			description: product.description ?? '',
			price: lowestVariant?.price ?? 0,
			image:
				lowestVariant?.imgUrl?.trim() ||
				`https://picsum.photos/seed/product-${encodeURIComponent(product.id)}/500/500`
		};
	});

	return {
		category: {
			name: categoryRow.name ?? 'Kategori',
			slug: categoryRow.slug ?? params.categorySlug
		},
		products: mappedProducts
	};
};
