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

export function generateSlug(text: string): string {
	if (!text) return '';

	return text
		.toString()
		.normalize('NFD') // pisahkan aksen
		.replace(/[\u0300-\u036f]/g, '') // hapus aksen
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]+/g, '')
		.replace(/--+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '');
}
