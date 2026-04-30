import { toast } from 'svelte-sonner';
import { resolve } from '$app/paths';
import { goto, invalidateAll } from '$app/navigation';
import {
	getCreatePaymentErrorMessage,
	getCreatePaymentInfoMessage,
	shouldShowOrdersRedirectCta
} from './payment-response';

type SnapCallbacks = {
	onSuccess?: (result: unknown) => void;
	onPending?: (result: unknown) => void;
	onError?: (result: unknown) => void;
	onClose?: () => void;
};

type SnapWindow = Window & {
	snap?: {
		pay: (token: string, callbacks?: SnapCallbacks) => void;
	};
};

type CreatePaymentPayload = {
	snapToken?: string;
	redirectUrl?: string | null;
	reused?: boolean;
	message?: string;
	code?: string;
};

const state = $state({
	isScriptReady: false,
	isCreatingTransaction: false,
	showOrdersRedirectCta: false,
	midtransScriptUrl: '',
	midtransClientKey: ''
});

const openSnapPopup = (snapToken: string) => {
	if (typeof window === 'undefined') return;

	const snapWindow = window as SnapWindow;
	if (!snapWindow.snap?.pay) {
		toast.error('SDK pembayaran belum siap. Silakan coba lagi.');
		return;
	}

	snapWindow.snap.pay(snapToken, {
		onSuccess: async () => {
			toast.success('Pembayaran berhasil. Menunggu sinkronisasi status pesanan.');
			await invalidateAll();
			await goto(resolve('/'));
		},
		onPending: () => {
			toast.info(
				'Pembayaran Anda masih pending. Silakan selesaikan sesuai instruksi metode pembayaran.'
			);
		},
		onError: () => {
			toast.error('Terjadi kendala pada proses pembayaran.');
		},
		onClose: () => {
			toast.info('Popup pembayaran ditutup sebelum transaksi selesai.');
		}
	});
};

const loadSnapScript = () => {
	if (typeof window === 'undefined') return;
	const snapWindow = window as SnapWindow;
	if (snapWindow.snap) {
		state.isScriptReady = true;
		return;
	}

	if (!state.midtransScriptUrl || !state.midtransClientKey) {
		state.isScriptReady = false;
		return;
	}

	const existingScript = document.querySelector<HTMLScriptElement>(
		'script[data-midtrans-snap="true"]'
	);
	if (existingScript) {
		existingScript.addEventListener('load', () => {
			state.isScriptReady = true;
		});
		return;
	}

	const script = document.createElement('script');
	script.src = state.midtransScriptUrl;
	script.setAttribute('data-client-key', state.midtransClientKey);
	script.setAttribute('data-midtrans-snap', 'true');
	script.onload = () => {
		state.isScriptReady = true;
	};
	script.onerror = () => {
		toast.error('Gagal memuat SDK pembayaran Midtrans.');
	};
	document.head.appendChild(script);
};

export const paymentController = {
	configure(config: { midtransScriptUrl: string; midtransClientKey: string }) {
		state.midtransScriptUrl = config.midtransScriptUrl;
		state.midtransClientKey = config.midtransClientKey;
	},
	get isScriptReady() {
		return state.isScriptReady;
	},
	get isCreatingTransaction() {
		return state.isCreatingTransaction;
	},
	get showOrdersRedirectCta() {
		return state.showOrdersRedirectCta;
	},
	loadSnapScript,
	async createPaymentTransaction(intentId: string) {
		if (state.isCreatingTransaction) return;
		if (!intentId) {
			toast.error('ID checkout tidak valid.');
			return;
		}

		state.showOrdersRedirectCta = false;
		state.isCreatingTransaction = true;
		try {
			const response = await fetch('/api/payments/midtrans/create', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ intentId })
			});

			const payload = (await response.json()) as CreatePaymentPayload;

			if (!response.ok) {
				if (shouldShowOrdersRedirectCta(response.status, payload)) {
					state.showOrdersRedirectCta = true;
				}
				toast.error(getCreatePaymentErrorMessage(response.status, payload));
				return;
			}

			if (!payload.snapToken) {
				toast.error('Token pembayaran tidak tersedia. Silakan coba lagi.');
				return;
			}

			toast.info(getCreatePaymentInfoMessage(payload));
			openSnapPopup(payload.snapToken);
		} catch (error) {
			console.error('[checkout:payment] create transaction failed', error);
			toast.error('Terjadi kesalahan saat menyiapkan pembayaran.');
		} finally {
			state.isCreatingTransaction = false;
		}
	}
};
