import type { LayoutServerLoad } from './$types';
import { profiles } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async (event) => {
	const { data } = await event.locals.supabase.auth.getUser();
	const user = data.user;

	const rows = user
		? await db
				.select({ name: profiles.name, role: profiles.role })
				.from(profiles)
				.where(eq(profiles.id, user.id))
				.limit(1)
		: [];
	const profile = rows[0] ?? null;

	return {
		profile
	};
};
