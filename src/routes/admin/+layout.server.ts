import type { LayoutServerLoad } from './$types';
import type { UserProfileData } from '$lib/types/user-profile';
import { profiles } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

type AdminLayoutData = {
	profile: UserProfileData | null;
};

export const load: LayoutServerLoad<AdminLayoutData> = async (event) => {
	const { data } = await event.locals.supabase.auth.getUser();
	const user = data.user;

	if (!user || !user.email) {
		return { profile: null };
	}

	const [dbProfile] = await db
		.select({
			name: profiles.name,
			role: profiles.role
		})
		.from(profiles)
		.where(eq(profiles.id, user.id))
		.limit(1);

	if (!dbProfile) {
		return { profile: null };
	}

	const profile: UserProfileData = {
		name: dbProfile.name,
		role: dbProfile.role,
		email: user.email
	};

	return {
		profile
	};
};
