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

				// Stage 2 migration complete: option groups and options now use diff/upsert by id.
				const existingOptionGroups = await tx
					.select({
						id: optionGroups.id
					})
					.from(optionGroups)
					.where(eq(optionGroups.productId, productId));

				const existingGroupIds = new Set(existingOptionGroups.map((group) => group.id));
				const incomingGroupIds = new Set(
					form.data.optionGroups
						.map((group) => group.id)
						.filter((groupId): groupId is string => Boolean(groupId))
				);

				for (const incomingGroupId of incomingGroupIds) {
					// Security/consistency guard: reject option group IDs that do not belong to current product.
					if (!existingGroupIds.has(incomingGroupId)) {
						throw error(400, 'Data opsi tidak valid. Silakan refresh halaman lalu coba lagi.');
					}
				}

				const groupsToUpdate = form.data.optionGroups.filter(
					(group) => typeof group.id === 'string' && existingGroupIds.has(group.id)
				);
				const groupsToCreate = form.data.optionGroups.filter((group) => !group.id);
				const groupsToDelete = existingOptionGroups
					.map((group) => group.id)
					.filter((existingGroupId) => !incomingGroupIds.has(existingGroupId));

				for (const group of groupsToUpdate) {
					const groupId = group.id;
					if (!groupId) continue;

					await tx
						.update(optionGroups)
						.set({
							name: group.name.trim()
						})
						.where(and(eq(optionGroups.id, groupId), eq(optionGroups.productId, productId)));

					const existingOptions = await tx
						.select({
							id: options.id
						})
						.from(options)
						.where(eq(options.optionGroupId, groupId));

					const existingOptionIds = new Set(existingOptions.map((option) => option.id));
					const incomingOptionIds = new Set(
						group.options
							.map((option) => option.id)
							.filter((optionId): optionId is string => Boolean(optionId))
					);

					for (const incomingOptionId of incomingOptionIds) {
						// Security/consistency guard: reject option IDs that do not belong to current option group.
						if (!existingOptionIds.has(incomingOptionId)) {
							throw error(400, 'Data opsi tidak valid. Silakan refresh halaman lalu coba lagi.');
						}
					}

					const optionsToUpdate = group.options.filter(
						(option) => typeof option.id === 'string' && existingOptionIds.has(option.id)
					);
					const optionsToCreate = group.options.filter((option) => !option.id);
					const optionsToDelete = existingOptions
						.map((option) => option.id)
						.filter((existingOptionId) => !incomingOptionIds.has(existingOptionId));

					for (const option of optionsToUpdate) {
						const optionId = option.id;
						if (!optionId) continue;

						await tx
							.update(options)
							.set({
								name: option.name.trim(),
								additionalPrice: option.additionalPrice
							})
							.where(and(eq(options.id, optionId), eq(options.optionGroupId, groupId)));
					}

					if (optionsToCreate.length > 0) {
						await tx.insert(options).values(
							optionsToCreate.map((option) => ({
								optionGroupId: groupId,
								name: option.name.trim(),
								additionalPrice: option.additionalPrice
							}))
						);
					}

					if (optionsToDelete.length > 0) {
						await tx
							.delete(options)
							.where(and(eq(options.optionGroupId, groupId), inArray(options.id, optionsToDelete)));
					}
				}

				for (const group of groupsToCreate) {
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

					if (group.options.length > 0) {
						await tx.insert(options).values(
							group.options.map((option) => ({
								optionGroupId: createdGroup.id,
								name: option.name.trim(),
								additionalPrice: option.additionalPrice
							}))
						);
					}
				}

				if (groupsToDelete.length > 0) {
					await tx
						.delete(optionGroups)
						.where(
							and(eq(optionGroups.productId, productId), inArray(optionGroups.id, groupsToDelete))
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
				const errorBody = 'body' in caughtError ? caughtError.body : undefined;
				const errorMessage =
					typeof errorBody === 'object' &&
					errorBody !== null &&
					'message' in errorBody &&
					typeof errorBody.message === 'string'
						? errorBody.message
						: undefined;
				const notFound = caughtError.status === 404;
				return message(
					form,
					{
						type: 'error',
						text: notFound
							? 'Produk tidak ditemukan.'
							: (errorMessage ??
								'Data varian/opsi tidak valid. Silakan refresh halaman lalu coba lagi.')
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
