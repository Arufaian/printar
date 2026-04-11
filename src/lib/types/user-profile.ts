export type UserRole = 'customer' | 'admin';
export type UserProfile = {
	name: string;
	role: UserRole;
} | null;
