import { and, count, inArray, isNotNull, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { categories, products } from '$lib/server/db/schema';
import { generateSlug } from '$lib/utils/string';

export const load: PageServerLoad = async () => {
	const categoryRows = await db
		.select({
			id: categories.id,
			name: categories.name,
			slug: categories.slug
		})
		.from(categories);

	if (categoryRows.length === 0) {
		return { categories: [] };
	}

	const categoryIds = categoryRows.map((category) => category.id);

	const countRows = await db
		.select({
			categoryId: products.categoryId,
			totalProducts: count(products.id)
		})
		.from(products)
		.where(
			and(
				isNull(products.deletedAt),
				isNotNull(products.categoryId),
				inArray(products.categoryId, categoryIds)
			)
		)
		.groupBy(products.categoryId);

	const countByCategoryId = new Map<string, number>();
	for (const row of countRows) {
		if (!row.categoryId) continue;
		countByCategoryId.set(row.categoryId, row.totalProducts);
	}

	const categoriesWithProducts = categoryRows
		.map((category) => {
			const totalProducts = countByCategoryId.get(category.id) ?? 0;
			const normalizedSlug = (category.slug ?? '').trim() || generateSlug(category.name ?? '');

			return {
				name: category.name?.trim() || 'Kategori',
				slug: normalizedSlug,
				totalProducts,
				image: `https://picsum.photos/seed/category-${encodeURIComponent(normalizedSlug || category.id)}/900/600`
			};
		})
		.filter((category) => category.totalProducts > 0 && category.slug.length > 0)
		.sort((left, right) => {
			if (left.totalProducts !== right.totalProducts) {
				return right.totalProducts - left.totalProducts;
			}

			return left.name.localeCompare(right.name, 'id-ID');
		});

	return {
		categories: categoriesWithProducts
	};
};
