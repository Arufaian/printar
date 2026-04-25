import { and, eq, inArray, isNull } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { categories, optionGroups, options, products, variants } from '$lib/server/db/schema';
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
