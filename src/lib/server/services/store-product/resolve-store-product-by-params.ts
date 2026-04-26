import { and, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, products } from '$lib/server/db/schema';
import { generateSlug } from '$lib/utils/string';

type StoreParams = { categorySlug: string; productSlug: string };

type ResolvedStoreProduct = {
	categoryRow: { id: string; name: string | null; slug: string | null } | null;
	productRow: {
		id: string;
		name: string | null;
		slug: string | null;
		description: string | null;
	} | null;
};

export async function resolveStoreProductByParams(
	params: StoreParams
): Promise<ResolvedStoreProduct> {
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
}
