<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { formatCurrency } from '$lib/utils/string';
	import {
		getCreatePaymentErrorMessage,
		getCreatePaymentInfoMessage,
		shouldShowOrdersRedirectCta
	} from './payment-response';
	import type { PageData } from './$types';

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

	let { data }: { data: PageData } = $props();
	let isScriptReady = $state(false);
	let isCreatingTransaction = $state(false);
	let showOrdersRedirectCta = $state(false);

	const loadSnapScript = () => {
		if (typeof window === 'undefined') return;
		const snapWindow = window as SnapWindow;
		if (snapWindow.snap) {
			isScriptReady = true;
			return;
		}

		const existingScript = document.querySelector<HTMLScriptElement>(
			'script[data-midtrans-snap="true"]'
		);
		if (existingScript) {
			existingScript.addEventListener('load', () => {
				isScriptReady = true;
			});
			return;
		}

		const script = document.createElement('script');
		script.src = data.midtransScriptUrl;
		script.setAttribute('data-client-key', data.midtransClientKey);
		script.setAttribute('data-midtrans-snap', 'true');
		script.onload = () => {
			isScriptReady = true;
		};
		script.onerror = () => {
			toast.error('Gagal memuat SDK pembayaran Midtrans.');
		};
		document.head.appendChild(script);
	};

	onMount(() => {
		loadSnapScript();
	});

	const openSnapPopup = (snapToken: string) => {
		const snapWindow = window as SnapWindow;
		if (!snapWindow.snap?.pay) {
			toast.error('SDK pembayaran belum siap. Silakan coba lagi.');
			return;
		}

		snapWindow.snap.pay(snapToken, {
			onSuccess: () => {
				toast.success('Pembayaran berhasil. Menunggu sinkronisasi status pesanan.');
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

	const createPaymentTransaction = async () => {
		if (isCreatingTransaction) return;

		showOrdersRedirectCta = false;
		isCreatingTransaction = true;
		try {
			const response = await fetch('/api/payments/midtrans/create', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ intentId: data.intentId })
			});

			const payload = (await response.json()) as {
				snapToken?: string;
				redirectUrl?: string | null;
				reused?: boolean;
				message?: string;
				code?: string;
			};

			if (!response.ok) {
				if (shouldShowOrdersRedirectCta(response.status, payload)) {
					showOrdersRedirectCta = true;
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
			isCreatingTransaction = false;
		}
	};
</script>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Pembayaran Midtrans</CardTitle>
		<CardDescription>
			Lanjutkan ke popup Midtrans untuk menyelesaikan pembayaran pesanan Anda.
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 pt-6">
		<Button
			size="lg"
			class="w-full"
			disabled={isCreatingTransaction || !isScriptReady}
			onclick={createPaymentTransaction}
		>
			{#if isCreatingTransaction}
				Menyiapkan pembayaran...
			{:else if !isScriptReady}
				Memuat Midtrans...
			{:else}
				Bayar Sekarang
			{/if}
		</Button>
		{#if showOrdersRedirectCta}
			<p class="text-sm text-muted-foreground">
				Sesi pembayaran sebelumnya tidak bisa dilanjutkan dari halaman ini.
			</p>
			<Button
				variant="outline"
				class="w-full"
				onclick={() => (window.location.href = '/customer/orders')}
			>
				Lanjutkan di Pesanan Saya
			</Button>
		{/if}
	</CardContent>
</Card>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Ringkasan Konfirmasi</CardTitle>
		<CardDescription>Tinjau kembali data sebelum membuka pembayaran Midtrans.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-2 pt-6 text-sm text-muted-foreground">
		<p>
			Alamat:
			{data.selectedAddress?.label || '-'}
		</p>
		<p>Metode pengiriman: {data.selectedDeliveryMethodLabel || '-'}</p>
		<p>Catatan: {data.customerNote || '-'}</p>
		<p class="pt-1 text-base font-semibold text-foreground">
			Total: {formatCurrency(data.grandTotal)}
		</p>
	</CardContent>
</Card>
