import { message, superValidate } from 'sveltekit-superforms';
import type { PageServerLoad, Actions } from './$types';
import { productSchema } from '$lib/validation/product/product.schema';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories, optionGroups, options, products, variants } from '$lib/server/db/schema';
import { DrizzleQueryError } from 'drizzle-orm';
import { generateSlug } from '$lib/utils/string';

export const load: PageServerLoad = async () => {
	const form = await superValidate(
		{
			name: '',
			slug: '',
			description: '',
			categoryId: '',
			variants: [
				{
					name: '',
					price: 0,
					stock: 0,
					img_url: ''
				}
			],
			optionGroups: []
		},
		zod4(productSchema),
		{ errors: false }
	);
	const categoryRows = await db
		.select({
			id: categories.id,
			name: categories.name
		})
		.from(categories);

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
		const form = await superValidate(event, zod4(productSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		console.log('form data:');
		console.log(form.data);

		console.log('form variants:');
		console.log(form.data.variants);

		console.log('form options:');
		console.log(form.data.optionGroups);

		console.log('form error:');
		console.error(form.errors);

		// NOTE: Trim textual values on save so database stays clean while client typing stays natural.
		const { name, slug, description, categoryId } = form.data;
		const sanitizedName = name.trim();
		const sanitizedSlug = generateSlug(slug);
		const sanitizedDescription = description?.trim();

		try {
			await db.transaction(async (tx) => {
				const [createdProduct] = await tx
					.insert(products)
					.values({
						name: sanitizedName,
						slug: sanitizedSlug,
						description: sanitizedDescription,
						categoryId
					})
					.returning({ id: products.id });

				if (!createdProduct?.id) {
					throw new Error('Failed to create product.');
				}

				const productId = createdProduct.id;

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
				text: 'Produk berhasil ditambahkan.'
			});
		} catch (error) {
			if (error instanceof DrizzleQueryError) {
				return message(
					form,
					{
						type: 'error',
						text: 'Slug produk sudah digunakan. Silakan ubah nama produk.'
					},
					{ status: 500 }
				);
			}

			console.error(error);

			return message(
				form,
				{
					type: 'error',
					text: 'Gagal menambahkan produk. Silakan coba lagi.'
				},
				{ status: 500 }
			);
		}
	}
} satisfies Actions;
