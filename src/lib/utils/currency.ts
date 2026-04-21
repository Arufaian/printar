type FormatCurrencyOptions = {
	locale?: string;
	currency?: string;
	fallback?: string;
};

export function formatCurrency(
	value: number,
	{ locale = 'id-ID', currency = 'IDR', fallback = '-' }: FormatCurrencyOptions = {}
): string {
	if (!Number.isFinite(value)) return fallback;

	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);
}

export function formatIDR(value: number, fallback = '-'): string {
	return formatCurrency(value, { locale: 'id-ID', currency: 'IDR', fallback });
}
