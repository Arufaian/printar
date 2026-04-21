import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { productSchema } from '$lib/validation/product/product.schema';
import { zod4 } from 'sveltekit-superforms/adapters';
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
