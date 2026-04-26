import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { customerProfileSchema } from '$lib/validation/customer/profile.schema';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async (event) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		redirect(303, '/sign-in?redirect=/customer/profile');
	}

	const [profile] = await db
		.select({
			name: profiles.name
		})
		.from(profiles)
		.where(eq(profiles.id, user.id))
		.limit(1);

	const form = await superValidate(
		{
			name: profile?.name ?? ''
		},
		zod4(customerProfileSchema)
	);

	return {
		form
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { user } = await event.locals.safeGetSession();

		if (!user) {
			return fail(401, {
				message: 'Silakan login terlebih dahulu.'
			});
		}

		const form = await superValidate(event, zod4(customerProfileSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const normalizedName = form.data.name.trim();

		const [updatedProfile] = await db
			.update(profiles)
			.set({
				name: normalizedName,
				updatedAt: new Date().toISOString()
			})
			.where(and(eq(profiles.id, user.id), eq(profiles.role, 'customer')))
			.returning({
				id: profiles.id
			});

		if (!updatedProfile) {
			return message(
				form,
				{
					type: 'error',
					text: 'Profil tidak ditemukan atau tidak dapat diperbarui.'
				},
				{
					status: 404
				}
			);
		}

		return message(form, {
			type: 'success',
			text: 'Nama berhasil diperbarui.'
		});
	}
};
