<script lang="ts">
	import { checkoutDraft } from '$lib/features/checkout/state/checkout-draft.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { formatCurrency } from '$lib/utils/string';

	const selectedAddress = $derived(
		checkoutDraft.addresses.find((address) => address.id === checkoutDraft.selectedAddressId) ??
			null
	);
</script>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Alamat Terpilih</CardTitle>
		<CardDescription>Pastikan alamat pengiriman sudah benar sebelum melanjutkan.</CardDescription>
	</CardHeader>
	<CardContent class="pt-6">
		{#if selectedAddress}
			<div class="rounded-lg border p-4 text-sm text-muted-foreground">
				<p class="font-medium text-foreground">{selectedAddress.label}</p>
				<p class="mt-1">{selectedAddress.recipient} - {selectedAddress.phone}</p>
				<p class="mt-2 leading-relaxed">
					{selectedAddress.addressLine}, {selectedAddress.city}
					{selectedAddress.postalCode}
				</p>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">Belum ada alamat yang dipilih.</p>
		{/if}
	</CardContent>
</Card>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Rincian Pembelian</CardTitle>
		<CardDescription
			>Periksa daftar produk, variasi, jumlah, dan harga pesanan Anda.</CardDescription
		>
	</CardHeader>
	<CardContent class="space-y-4 pt-6">
		{#each checkoutDraft.items as item (item.id)}
			<div class="flex gap-4 rounded-lg border p-4">
				<div
					class="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground"
				>
					Preview
				</div>
				<div class="min-w-0 flex-1 space-y-1.5">
					<p class="truncate text-sm font-medium md:text-base">{item.name}</p>
					<p class="text-xs text-muted-foreground md:text-sm">{item.variant}</p>
					<div class="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
						<span>Jumlah: {item.quantity}</span>
						<span aria-hidden="true">-</span>
						<span>Harga satuan: {formatCurrency(item.unitPrice)}</span>
					</div>
				</div>
				<p class="text-sm font-semibold whitespace-nowrap md:text-base">
					{formatCurrency(item.quantity * item.unitPrice)}
				</p>
			</div>
		{/each}
	</CardContent>
</Card>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Catatan Pesanan</CardTitle>
		<CardDescription>
			Tambahkan catatan khusus untuk tim produksi atau pengiriman (opsional).
		</CardDescription>
	</CardHeader>
	<CardContent class="pt-6">
		<Textarea
			bind:value={checkoutDraft.customerNote}
			rows={5}
			placeholder="Contoh: mohon dikirim sebelum jam 15.00, atau gunakan kemasan terpisah"
		/>
	</CardContent>
</Card>
