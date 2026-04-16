export function getInitials(fullName: string): string {
	if (!fullName || fullName.trim() === '') {
		return '';
	}

	const nameTokens: string[] = fullName.trim().split(/\s+/);

	if (nameTokens.length === 1) {
		return nameTokens[0].charAt(0).toUpperCase();
	}

	const firstInitial: string = nameTokens[0].charAt(0);
	const lastInitial: string = nameTokens[nameTokens.length - 1].charAt(0);

	return `${firstInitial}${lastInitial}`.toUpperCase();
}
