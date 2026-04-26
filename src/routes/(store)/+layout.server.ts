import type { LayoutServerLoad } from './$types';
import { profiles } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { UserProfileData } from '$lib/types/user-profile';
import { getDraftCartCount } from '$lib/server/services/cart';

type LayoutData = {
	profile: UserProfileData | null;
	cartCount: number;
};

export const load: LayoutServerLoad<LayoutData> = async (event) => {
	const { data } = await event.locals.supabase.auth.getUser();
	const user = data.user;

	if (!user || !user.email) {
		return { profile: null, cartCount: 0 };
	}

	const [profileRows, cartCount] = await Promise.all([
		db
			.select({
				name: profiles.name,
				role: profiles.role
			})
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1),
		getDraftCartCount(user.id)
	]);

	const dbProfile = profileRows[0];

	if (!dbProfile) {
		return { profile: null, cartCount };
	}

	const profile: UserProfileData = {
		name: dbProfile.name,
		role: dbProfile.role,
		email: user.email
	};

	return {
		profile,
		cartCount
	};
};
