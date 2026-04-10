import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { signupSchema } from '$lib/validation/auth/sign-up.schema';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(signupSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(signupSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		console.log(form);
		return {
			form
		};
	}
};
