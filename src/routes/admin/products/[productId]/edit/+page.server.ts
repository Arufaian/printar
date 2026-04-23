import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { categories, optionGroups, options, products, variants } from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { productSchema } from '$lib/validation/product/product.schema';
import type { PageServerLoad } from './$types';

const productIdSchema = z.uuid('ID produk tidak valid.');

export const load: PageServerLoad = async ({ params }) => {
	const parsedProductId = productIdSchema.safeParse(params.productId);

	if (!parsedProductId.success) {
		throw error(400, 'ID produk tidak valid.');
	}

	const productId = parsedProductId.data;

	const [product] = await db
		.select({
			id: products.id,
			name: products.name,
			description: products.description,
			categoryId: products.categoryId
		})
		.from(products)
		.where(eq(products.id, productId));

	if (!product) {
		throw error(404, 'Produk tidak ditemukan.');
	}

	const variantRows = await db
		.select({
			id: variants.id,
			name: variants.name,
			price: variants.price,
			stock: variants.stock,
			img_url: variants.imgUrl
		})
		.from(variants)
		.where(eq(variants.productId, productId));

	const optionGroupRows = await db
		.select({
			id: optionGroups.id,
			name: optionGroups.name
		})
		.from(optionGroups)
		.where(eq(optionGroups.productId, productId));

	const optionGroupsWithOptions = await Promise.all(
		optionGroupRows.map(async (group) => {
			const groupOptions = await db
				.select({
					id: options.id,
					name: options.name,
					additionalPrice: options.additionalPrice
				})
				.from(options)
				.where(eq(options.optionGroupId, group.id));

			return {
				id: group.id,
				name: group.name ?? '',
				options: groupOptions.map((option) => ({
					id: option.id,
					name: option.name ?? '',
					additionalPrice: option.additionalPrice ?? 0
				}))
			};
		})
	);

	const categoryRows = await db
		.select({
			id: categories.id,
			name: categories.name
		})
		.from(categories);

	const form = await superValidate(
		{
			id: product.id,
			name: product.name ?? '',
			description: product.description ?? '',
			categoryId: product.categoryId ?? '',
			variants:
				variantRows.length > 0
					? variantRows.map((variant) => ({
							id: variant.id,
							name: variant.name ?? '',
							price: variant.price ?? 0,
							stock: variant.stock ?? 0,
							img_url: variant.img_url ?? ''
						}))
					: [{ name: '', price: 0, stock: 0, img_url: '' }],
			optionGroups: optionGroupsWithOptions
		},
		zod4(productSchema),
		{ errors: false }
	);

	const categoryOptions = categoryRows.map((category) => ({
		id: category.id,
		name: category.name ?? '-'
	}));

	return {
		form,
		categoryOptions
	};
};
