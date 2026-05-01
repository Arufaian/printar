import { describe, expect, it } from 'vitest';
import {
	DUPLICATE_NO_REUSABLE_TOKEN_CODE,
	getCreatePaymentErrorMessage,
	getCreatePaymentInfoMessage,
	shouldShowOrdersRedirectCta
} from './payment-response';

describe('payment response helpers', () => {
	it('shows orders CTA only for duplicate-no-reusable code', () => {
		expect(shouldShowOrdersRedirectCta(409, { code: DUPLICATE_NO_REUSABLE_TOKEN_CODE })).toBe(true);
		expect(shouldShowOrdersRedirectCta(409, { code: 'OTHER' })).toBe(false);
		expect(shouldShowOrdersRedirectCta(500, { code: DUPLICATE_NO_REUSABLE_TOKEN_CODE })).toBe(
			false
		);
	});

	it('returns specific duplicate-no-reusable error message', () => {
		expect(
			getCreatePaymentErrorMessage(409, {
				code: DUPLICATE_NO_REUSABLE_TOKEN_CODE,
				message: 'ignored'
			})
		).toBe('Sesi pembayaran ini tidak bisa dibuka ulang. Lanjutkan dari Pesanan Saya.');
	});

	it('falls back to payload message then default message', () => {
		expect(getCreatePaymentErrorMessage(502, { message: 'Custom error' })).toBe('Custom error');
		expect(getCreatePaymentErrorMessage(502, {})).toBe(
			'Gagal menyiapkan pembayaran. Silakan coba lagi.'
		);
	});

	it('returns info message based on reused flag', () => {
		expect(getCreatePaymentInfoMessage({ reused: true })).toBe(
			'Membuka ulang sesi pembayaran Anda...'
		);
		expect(getCreatePaymentInfoMessage({ reused: false })).toBe('Menyiapkan pembayaran Anda...');
		expect(getCreatePaymentInfoMessage({})).toBe('Menyiapkan pembayaran Anda...');
	});
});
