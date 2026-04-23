import { error, fail } from '@sveltejs/kit';
import { DrizzleQueryError, and, eq, inArray } from 'drizzle-orm';
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

				// Stage 1 migration: variants now use diff/upsert to preserve IDs and reduce FK risk.
				const existingVariants = await tx
					.select({
						id: variants.id
					})
					.from(variants)
					.where(eq(variants.productId, productId));

				const existingVariantIds = new Set(existingVariants.map((variant) => variant.id));
				const incomingVariantIds = new Set(
					form.data.variants
						.map((variant) => variant.id)
						.filter((variantId): variantId is string => Boolean(variantId))
				);

				for (const incomingVariantId of incomingVariantIds) {
					// Security/consistency guard: reject variant IDs that do not belong to current product.
					if (!existingVariantIds.has(incomingVariantId)) {
						throw error(400, 'Data varian tidak valid. Silakan refresh halaman lalu coba lagi.');
					}
				}

				const variantsToUpdate = form.data.variants.filter(
					(variant) => typeof variant.id === 'string' && existingVariantIds.has(variant.id)
				);
				const variantsToCreate = form.data.variants.filter((variant) => !variant.id);
				const variantsToDelete = existingVariants
					.map((variant) => variant.id)
					.filter((existingVariantId) => !incomingVariantIds.has(existingVariantId));

				for (const variant of variantsToUpdate) {
					const variantId = variant.id;
					if (!variantId) continue;

					await tx
						.update(variants)
						.set({
							name: variant.name.trim(),
							price: variant.price,
							stock: variant.stock,
							imgUrl: variant.img_url
						})
						.where(and(eq(variants.id, variantId), eq(variants.productId, productId)));
				}

				if (variantsToCreate.length > 0) {
					await tx.insert(variants).values(
						variantsToCreate.map((variant) => ({
							productId,
							name: variant.name.trim(),
							price: variant.price,
							stock: variant.stock,
							imgUrl: variant.img_url
						}))
					);
				}

				if (variantsToDelete.length > 0) {
					await tx
						.delete(variants)
						.where(and(eq(variants.productId, productId), inArray(variants.id, variantsToDelete)));
				}

				// TODO(stage 2): migrate optionGroups/options from full-replace to diff/upsert by id.
				await tx.delete(optionGroups).where(eq(optionGroups.productId, productId));

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
				(caughtError.status === 404 || caughtError.status === 400)
			) {
				const notFound = caughtError.status === 404;
				return message(
					form,
					{
						type: 'error',
						text: notFound
							? 'Produk tidak ditemukan.'
							: 'Data varian tidak valid. Silakan refresh halaman lalu coba lagi.'
					},
					{ status: caughtError.status }
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
