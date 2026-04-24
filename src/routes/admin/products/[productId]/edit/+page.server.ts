import { error, fail } from '@sveltejs/kit';
import { DrizzleQueryError, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { categories, optionGroups, options, products, variants } from '$lib/server/db/schema';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { productSchema } from '$lib/validation/product/product.schema';
import { generateSlug } from '$lib/utils/string';
import {
	InvalidOptionGroupOwnershipError,
	InvalidOptionOwnershipError,
	InvalidVariantOwnershipError,
	ProductNotFoundError,
	syncOptionGroupsDiff,
	syncVariantsDiff,
	updateProductCore
} from '$lib/server/services/product';
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
		Array<{ id: string; name: string | null; additionalPrice: number | null }>
	>();

	for (const option of optionRows) {
		const groupId = option.optionGroupId;
		if (!groupId) continue;

		const groupOptions = optionsByGroupId.get(groupId) ?? [];
		groupOptions.push({
			id: option.id,
			name: option.name,
			additionalPrice: option.additionalPrice
		});
		optionsByGroupId.set(groupId, groupOptions);
	}

	const optionGroupsWithOptions = optionGroupRows.map((group) => {
		const groupOptions = optionsByGroupId.get(group.id) ?? [];

		return {
			id: group.id,
			name: group.name ?? '',
			options: groupOptions.map((option) => ({
				id: option.id,
				name: option.name ?? '',
				additionalPrice: option.additionalPrice ?? 0
			}))
		};
	});

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
				await updateProductCore(tx, {
					productId,
					name: sanitizedName,
					slug: sanitizedSlug,
					description: sanitizedDescription,
					categoryId: form.data.categoryId
				});

				await syncVariantsDiff(tx, {
					productId,
					variants: form.data.variants
				});

				await syncOptionGroupsDiff(tx, {
					productId,
					optionGroups: form.data.optionGroups
				});
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

			if (caughtError instanceof ProductNotFoundError) {
				return message(
					form,
					{
						type: 'error',
						text: 'Produk tidak ditemukan.'
					},
					{ status: 404 }
				);
			}

			if (
				caughtError instanceof InvalidVariantOwnershipError ||
				caughtError instanceof InvalidOptionGroupOwnershipError ||
				caughtError instanceof InvalidOptionOwnershipError
			) {
				return message(
					form,
					{
						type: 'error',
						text: caughtError.message
					},
					{ status: 400 }
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
