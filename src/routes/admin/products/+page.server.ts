import { db } from '$lib/server/db';
import { products, variants, categories } from '$lib/server/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { count, min, sum } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const productData = await db
		.select({
			id: products.id,
			name: products.name,
			description: products.description,
			categoryId: products.categoryId,
			createdAt: products.createdAt,
			deletedAt: products.deletedAt,
			categoryName: categories.name,
			variantsCount: count(variants.id),
			lowestPrice: min(variants.price),
			totalStock: sum(variants.stock)
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id))
		.leftJoin(variants, eq(variants.productId, products.id))
		.groupBy(products.id, categories.name)
		.orderBy(products.createdAt);

	const response = productData.map((p) => ({
		...p,
		totalStock: p.totalStock ? Number(p.totalStock) : null
	}));

	return {
		response
	};
};
