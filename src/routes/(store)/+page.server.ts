import { desc, eq, inArray, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { categories, products, variants } from '$lib/server/db/schema';
import { generateSlug } from '$lib/utils/string';

const HOMEPAGE_PRODUCT_LIMIT = 6;

export const load: PageServerLoad = async () => {
	const latestProductRows = await db
		.select({
			id: products.id,
			name: products.name,
			description: products.description,
			productSlug: products.slug,
			categorySlug: categories.slug
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id))
		.where(isNull(products.deletedAt))
		.orderBy(desc(products.createdAt))
		.limit(HOMEPAGE_PRODUCT_LIMIT);

	if (latestProductRows.length === 0) {
		return { latestProducts: [] };
	}

	const productIds = latestProductRows.map((product) => product.id);

	const variantRows = await db
		.select({
			productId: variants.productId,
			price: variants.price,
			imgUrl: variants.imgUrl
		})
		.from(variants)
		.where(inArray(variants.productId, productIds));

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

	const latestProducts = latestProductRows.map((product) => {
		const lowestVariant = lowestVariantByProductId.get(product.id);
		const productSlug = (product.productSlug ?? '').trim() || generateSlug(product.name ?? '');
		const categorySlug = (product.categorySlug ?? '').trim();

		return {
			id: product.id,
			title: product.name ?? 'Produk tanpa nama',
			description: product.description ?? '',
			price: lowestVariant?.price ?? 0,
			categorySlug: categorySlug || undefined,
			productSlug: productSlug || undefined,
			image:
				lowestVariant?.imgUrl?.trim() ||
				`https://picsum.photos/seed/${encodeURIComponent(product.id)}/500/500`
		};
	});

	return {
		latestProducts
	};
};
