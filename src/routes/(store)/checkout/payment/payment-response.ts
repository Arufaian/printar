export const DUPLICATE_NO_REUSABLE_TOKEN_CODE = 'MIDTRANS_DUPLICATE_NO_REUSABLE_TOKEN';

type CreatePaymentPayload = {
	reused?: boolean;
	message?: string;
	code?: string;
};

export const shouldShowOrdersRedirectCta = (status: number, payload: CreatePaymentPayload) =>
	status === 409 && payload.code === DUPLICATE_NO_REUSABLE_TOKEN_CODE;

export const getCreatePaymentErrorMessage = (status: number, payload: CreatePaymentPayload) => {
	if (shouldShowOrdersRedirectCta(status, payload)) {
		return 'Sesi pembayaran ini tidak bisa dibuka ulang. Lanjutkan dari Pesanan Saya.';
	}

	return payload.message || 'Gagal menyiapkan pembayaran. Silakan coba lagi.';
};

export const getCreatePaymentInfoMessage = (payload: CreatePaymentPayload) =>
	payload.reused ? 'Membuka ulang sesi pembayaran Anda...' : 'Menyiapkan pembayaran Anda...';
