import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async (event) => {
		const { error } = await event.locals.supabase.auth.signOut();

		if (error) {
			console.error(error);
			return fail(500, { message: 'Gagal logout, silakan coba lagi.' });
		}

		redirect(303, '/');
	}
} satisfies Actions;
