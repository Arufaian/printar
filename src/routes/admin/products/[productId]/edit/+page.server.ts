import { error, fail } from '@sveltejs/kit';
import { DrizzleQueryError, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { categories, optionGroups, options, products, variants } from '$lib/server/db/schema';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { productSchema } from '$lib/validation/product/product.schema';
import { generateSlug } from '$lib/utils/string';
import type { Actions, PageServerLoad } from './$types';

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
			slug: products.slug,
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
			slug: product.slug ?? '',
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

export const actions = {
	default: async (event) => {
		const parsedProductId = productIdSchema.safeParse(event.params.productId);

		if (!parsedProductId.success) {
			return fail(400, { message: 'ID produk pada URL tidak valid.' });
		}

		const productId = parsedProductId.data;
		const form = await superValidate(event, zod4(productSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		if (form.data.id && form.data.id !== productId) {
			return message(
				form,
				{
					type: 'error',
					text: 'Data produk tidak sesuai. Silakan refresh halaman lalu coba lagi.'
				},
				{ status: 400 }
			);
		}

		const sanitizedName = form.data.name.trim();
		const sanitizedSlug = generateSlug(form.data.slug);
		const sanitizedDescription = form.data.description?.trim();

		try {
			await db.transaction(async (tx) => {
				const updatedProduct = await tx
					.update(products)
					.set({
						name: sanitizedName,
						slug: sanitizedSlug,
						description: sanitizedDescription,
						categoryId: form.data.categoryId
					})
					.where(eq(products.id, productId))
					.returning({ id: products.id });

				if (updatedProduct.length === 0) {
					throw error(404, 'Produk tidak ditemukan.');
				}

				await tx.delete(variants).where(eq(variants.productId, productId));
				await tx.delete(optionGroups).where(eq(optionGroups.productId, productId));

				await tx.insert(variants).values(
					form.data.variants.map((variant) => ({
						productId,
						name: variant.name.trim(),
						price: variant.price,
						stock: variant.stock,
						imgUrl: variant.img_url
					}))
				);

				for (const group of form.data.optionGroups) {
					const [createdGroup] = await tx
						.insert(optionGroups)
						.values({
							productId,
							name: group.name.trim()
						})
						.returning({ id: optionGroups.id });

					if (!createdGroup?.id) {
						throw new Error('Failed to create option group.');
					}

					await tx.insert(options).values(
						group.options.map((option) => ({
							optionGroupId: createdGroup.id,
							name: option.name.trim(),
							additionalPrice: option.additionalPrice
						}))
					);
				}
			});

			return message(form, {
				type: 'success',
				text: 'Produk berhasil diperbarui.'
			});
		} catch (caughtError) {
			if (caughtError instanceof DrizzleQueryError) {
				return message(
					form,
					{
						type: 'error',
						text: 'Slug produk sudah digunakan. Silakan ubah nama produk.'
					},
					{ status: 500 }
				);
			}

			if (
				typeof caughtError === 'object' &&
				caughtError !== null &&
				'status' in caughtError &&
				caughtError.status === 404
			) {
				return message(
					form,
					{
						type: 'error',
						text: 'Produk tidak ditemukan.'
					},
					{ status: 404 }
				);
			}

			console.error(caughtError);

			return message(
				form,
				{
					type: 'error',
					text: 'Gagal memperbarui produk. Silakan coba lagi.'
				},
				{ status: 500 }
			);
		}
	}
} satisfies Actions;
