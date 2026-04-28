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
		<CardTitle>Metode Pembayaran</CardTitle>
		<CardDescription>Pilih salah satu metode pembayaran yang tersedia.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 pt-6">
		{#each checkoutDraft.paymentMethods as method (method.id)}
			<button
				type="button"
				onclick={() => (checkoutDraft.selectedPaymentMethodId = method.id)}
				class={`w-full rounded-lg border p-4 text-left transition-colors ${
					checkoutDraft.selectedPaymentMethodId === method.id ? 'border-primary bg-primary/5' : ''
				}`}
			>
				<p class="font-medium">{method.label}</p>
				<p class="mt-1 text-sm text-muted-foreground">{method.description}</p>
			</button>
		{/each}
	</CardContent>
</Card>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Ringkasan Konfirmasi</CardTitle>
		<CardDescription>Tinjau kembali data sebelum menekan tombol konfirmasi.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-2 pt-6 text-sm text-muted-foreground">
		<p>
			Alamat:
			{checkoutDraft.addresses.find((address) => address.id === checkoutDraft.selectedAddressId)
				?.label ?? '-'}
		</p>
		<p>
			Metode pembayaran:
			{checkoutDraft.paymentMethods.find(
				(method) => method.id === checkoutDraft.selectedPaymentMethodId
			)?.label ?? '-'}
		</p>
		<p>Catatan: {checkoutDraft.customerNote || '-'}</p>
	</CardContent>
</Card>
