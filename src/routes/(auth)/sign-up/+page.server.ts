import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { signupSchema } from '$lib/validation/auth/sign-up.schema';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(signupSchema))
	};
};
