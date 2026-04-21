import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { productSchema } from '$lib/validation/product/product.schema';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(productSchema));

	return {
		form
	};
};
