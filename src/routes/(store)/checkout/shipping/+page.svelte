<script lang="ts">
	import { checkoutDraft } from '$lib/features/checkout/state/checkout-draft.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
</script>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Alamat Pengiriman</CardTitle>
		<CardDescription>Pilih alamat tujuan pengiriman pesanan Anda.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 pt-6">
		{#each checkoutDraft.addresses as address (address.id)}
			<button
				type="button"
				onclick={() => (checkoutDraft.selectedAddressId = address.id)}
				class={`w-full rounded-lg border p-4 text-left transition-colors ${
					checkoutDraft.selectedAddressId === address.id ? 'border-primary bg-primary/5' : ''
				}`}
			>
				<div class="flex items-center justify-between gap-3">
					<p class="font-medium">{address.label}</p>
					{#if address.isDefault}
						<span class="text-xs text-muted-foreground">Utama</span>
					{/if}
				</div>
				<p class="mt-1 text-sm text-muted-foreground">{address.recipient} - {address.phone}</p>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					{address.addressLine}, {address.city}
					{address.postalCode}
				</p>
			</button>
		{/each}
	</CardContent>
</Card>
