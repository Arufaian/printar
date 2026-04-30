<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge';
	import { buttonVariants } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import * as Stepper from '$lib/components/ui/stepper';
	import { paymentController } from '$lib/features/payment/payment-controller.svelte';
	import type { OrderDetailData } from '$lib/types/order-detail';
	import { formatCurrency } from '$lib/utils/string';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const order = $derived(data.order as OrderDetailData);
	const activeTimelineStep = $derived(order.timeline.length);
	const canPay = $derived(Boolean(data.canPay));

	onMount(() => {
		paymentController.configure({
			midtransScriptUrl: data.midtransScriptUrl,
			midtransClientKey: data.midtransClientKey,
			onSuccess: async () => {
				await invalidateAll();
			}
		});
		paymentController.loadSnapScript();
	});

	const formatDateTime = (value: string | null) => {
		if (!value) return '-';
		return new Intl.DateTimeFormat('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	};

	const formatDeliveryMethod = (value: string | null) => {
		if (!value) return '-';
		if (value === 'courier') return 'Kurir';
		if (value === 'pickup') return 'Pickup';
		return value;
	};
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-lg font-semibold">Detail Pesanan</h1>
			<p class="text-sm text-muted-foreground">{order.orderCode}</p>
		</div>
		<Badge variant={order.statusBadgeVariant} class={order.statusBadgeClass}
			>{order.statusLabel}</Badge
		>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
		<div class="space-y-6 xl:col-span-8">
			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Rincian Produk</CardTitle>
					<CardDescription>Daftar item pada pesanan ini.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4 pt-6">
					{#if order.items.length === 0}
						<p class="text-sm text-muted-foreground">Item pesanan tidak ditemukan.</p>
					{:else}
						{#each order.items as item, index (item.id)}
							<div class="flex items-start gap-3 rounded-lg border border-border/60 p-3">
								{#if item.image}
									<img
										src={item.image}
										alt={`Thumbnail ${item.name}`}
										class="h-14 w-14 shrink-0 rounded-md object-cover"
										loading="lazy"
									/>
								{:else}
									<div
										class="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground"
									>
										Preview
									</div>
								{/if}
								<div class="min-w-0 flex-1 space-y-1.5">
									<p class="line-clamp-2 text-sm leading-snug font-medium text-foreground">
										{item.name}
									</p>
									<p class="text-xs text-muted-foreground">{item.variant}</p>
									{#if item.options.length > 0}
										<p class="text-xs text-muted-foreground">{item.options.join(', ')}</p>
									{/if}
									<div
										class="flex items-center justify-between border-t border-border/60 pt-2 text-sm"
									>
										<span class="text-muted-foreground"
											>{item.quantity} x {formatCurrency(item.unitPrice)}</span
										>
										<span class="font-medium text-foreground">{formatCurrency(item.lineTotal)}</span
										>
									</div>
								</div>
							</div>
							{#if index < order.items.length - 1}
								<Separator />
							{/if}
						{/each}
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Pengiriman</CardTitle>
					<CardDescription>Alamat dan metode pengiriman yang dipilih.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-2 pt-6 text-sm text-muted-foreground">
					<p class="font-medium text-foreground">{order.address.recipientName}</p>
					<p>{order.address.label}</p>
					<p>{order.address.addressLine}</p>
					<p>{order.address.city}, {order.address.postalCode}</p>
					<p>{order.address.phone}</p>
					<p class="pt-2 text-xs">
						Metode Pengiriman:
						<span class="font-medium text-foreground">
							{formatDeliveryMethod(order.deliveryMethod)}</span
						>
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Catatan Pesanan</CardTitle>
				</CardHeader>
				<CardContent class="pt-6 text-sm text-muted-foreground">
					<p>{order.customerNote || '-'}</p>
				</CardContent>
			</Card>
		</div>

		<div class="space-y-6 xl:col-span-4">
			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Ringkasan Pesanan</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3 pt-6 text-sm">
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Tanggal Pesanan</span>
						<span class="text-right text-foreground">{formatDateTime(order.createdAt)}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Status Pembayaran</span>
						<span class="text-foreground">{order.latestPaymentStatus ?? '-'}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Metode Pembayaran</span>
						<span class="text-foreground">{order.latestPaymentMethod ?? '-'}</span>
					</div>
					<Separator />
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Subtotal</span>
						<span>{formatCurrency(order.subtotal)}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Ongkos Kirim</span>
						<span>{formatCurrency(order.shippingCost)}</span>
					</div>
					<div class="flex items-center justify-between text-base font-semibold text-foreground">
						<span>Total</span>
						<span>{formatCurrency(order.grandTotal)}</span>
					</div>
				</CardContent>
				{#if canPay}
					<div class="px-6 pb-6">
						<button
							type="button"
							class={buttonVariants({ class: 'w-full' })}
							disabled={paymentController.isCreatingTransaction || !paymentController.isScriptReady}
							onclick={() => paymentController.createPaymentTransactionByOrder(order.id)}
						>
							{#if paymentController.isCreatingTransaction}
								Menyiapkan pembayaran...
							{:else if !paymentController.isScriptReady}
								Memuat Midtrans...
							{:else}
								Bayar Sekarang
							{/if}
						</button>
						{#if paymentController.showOrdersRedirectCta}
							<p class="mt-3 text-center text-xs text-muted-foreground">
								Sesi pembayaran sebelumnya tidak bisa dilanjutkan dari halaman ini.
							</p>
						{/if}
					</div>
				{/if}
			</Card>

			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Timeline Status</CardTitle>
					<CardDescription>Riwayat progres pesanan dari waktu ke waktu.</CardDescription>
				</CardHeader>
				<CardContent class="pt-6">
					<Stepper.Root step={activeTimelineStep}>
						<Stepper.Nav orientation="vertical" class="gap-3">
							{#each order.timeline as entry, index (`${entry.status}-${entry.createdAt ?? index}`)}
								<Stepper.Item>
									<Stepper.Trigger disabled class="items-start">
										<Stepper.Indicator>
											<span class="text-xs">{index + 1}</span>
										</Stepper.Indicator>
										<div class="space-y-1 py-0.5">
											<Stepper.Title class="text-sm">{entry.label}</Stepper.Title>
											<Stepper.Description class="text-xs">
												{formatDateTime(entry.createdAt)}
												{#if entry.changedByName}
													• {entry.changedByName}
												{/if}
											</Stepper.Description>
										</div>
									</Stepper.Trigger>
									<Stepper.Separator />
								</Stepper.Item>
							{/each}
						</Stepper.Nav>
					</Stepper.Root>
				</CardContent>
			</Card>
		</div>
	</div>

	<a href={resolve('/customer/orders')} class={buttonVariants({ variant: 'outline' })}
		>Kembali ke Daftar Pesanan</a
	>
</div>
