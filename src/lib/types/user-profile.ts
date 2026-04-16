export type UserProfileData = {
	name: string;
	role: 'admin' | 'customer';
	email: string;
};

// Tipe yang bisa null (untuk load function)
export type UserProfile = UserProfileData | null;
