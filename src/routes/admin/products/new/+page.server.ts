import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad, Actions } from './$types';
import { productSchema } from '$lib/validation/product/product.schema';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(productSchema));
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

		return { form };
	}
} satisfies Actions;
