<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { formatCurrency } from '$lib/utils/string';
	import { paymentController } from './payment-controller.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	onMount(() => {
		paymentController.configure({
			midtransScriptUrl: data.midtransScriptUrl,
			midtransClientKey: data.midtransClientKey
		});
		paymentController.loadSnapScript();
	});
</script>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Alamat Terpilih</CardTitle>
		<CardDescription>
			Pastikan alamat pengiriman sudah benar sebelum melanjutkan pembayaran.
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-2 pt-6 text-sm text-muted-foreground">
		<p class="font-medium text-foreground">{data.selectedAddress?.recipientName || '-'}</p>
		<p>{data.selectedAddress?.label || '-'}</p>
		<p>{data.selectedAddress?.addressLine || '-'}</p>
		<p>
			{data.selectedAddress?.city || '-'}
			{data.selectedAddress?.postalCode ? `, ${data.selectedAddress.postalCode}` : ''}
		</p>
		<p>{data.selectedAddress?.phone || '-'}</p>
	</CardContent>
</Card>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Metode Pengiriman</CardTitle>
		<CardDescription>Metode pengiriman yang dipilih untuk pesanan ini.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-2 pt-6 text-sm text-muted-foreground">
		<p class="text-base font-medium text-foreground">{data.selectedDeliveryMethodLabel || '-'}</p>
	</CardContent>
</Card>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Rincian Pembelian</CardTitle>
		<CardDescription>Item yang akan dibayarkan pada checkout ini.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 pt-6">
		{#each data.items as item, index (item.id)}
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
				<div class="min-w-0 flex-1 space-y-2">
					<p class="line-clamp-2 text-sm leading-snug font-medium text-foreground">{item.name}</p>
					<p class="text-xs leading-relaxed text-muted-foreground">{item.variant}</p>
					{#if item.options.length > 0}
						<p class="text-xs leading-relaxed text-muted-foreground">{item.options.join(', ')}</p>
					{/if}
					<div
						class="flex items-center justify-between border-t border-border/60 pt-2 text-sm text-muted-foreground"
					>
						<span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
						<span class="font-medium text-foreground">{formatCurrency(item.lineTotal)}</span>
					</div>
				</div>
			</div>
			{#if index < data.items.length - 1}
				<Separator />
			{/if}
		{/each}
	</CardContent>
</Card>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Catatan Pesanan</CardTitle>
		<CardDescription>Catatan tambahan yang kamu kirim saat checkout.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-2 pt-6 text-sm text-muted-foreground">
		<p>{data.customerNote || '-'}</p>
	</CardContent>
</Card>
