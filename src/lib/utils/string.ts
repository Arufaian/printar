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

export function formatCurrency(
	value: number | string,
	options?: {
		locale?: string;
		currency?: string;
		minimumFractionDigits?: number;
		maximumFractionDigits?: number;
	}
): string {
	const numericValue = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : value;
	if (!Number.isFinite(numericValue)) return '';
	const {
		locale = 'id-ID',
		currency = 'IDR',
		minimumFractionDigits = 0,
		maximumFractionDigits = 0
	} = options ?? {};
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		minimumFractionDigits,
		maximumFractionDigits
	}).format(numericValue);
}

export function getSubtotal(items: Array<{ quantity: number; unitPrice: number }>): number {
	return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

export function formatOrderCode(id: string): string {
	if (!id) return 'ORD-UNKNOWN';
	return `ORD-${id.slice(0, 8).toUpperCase()}`;
}

export function formatDateTime(value: string | Date | null): string {
	if (!value) return '-';
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return '-';

	return new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(date);
}

export function formatOrderStatusLabel(status: string): string {
	switch (status) {
		case 'pending_payment':
			return 'Menunggu Pembayaran';
		case 'paid':
			return 'Dibayar';
		case 'file_review':
			return 'Review File';
		case 'revision_requested':
			return 'Revisi';
		case 'printing':
			return 'Diproses';
		case 'ready':
			return 'Siap';
		case 'shipped':
			return 'Dikirim';
		case 'completed':
			return 'Selesai';
		case 'canceled':
			return 'Dibatalkan';
		default:
			return status;
	}
}

export function formatDeliveryMethodLabel(value: string | null): string {
	if (!value) return '-';
	if (value === 'courier') return 'Kurir';
	if (value === 'pickup') return 'Pickup';
	return value;
}
