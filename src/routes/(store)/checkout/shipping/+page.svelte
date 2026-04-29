<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Alamat Pengiriman</CardTitle>
		<CardDescription>Pilih alamat tujuan pengiriman pesanan Anda.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 pt-6">
		{#if data.addresses.length === 0}
			<div class="space-y-3 rounded-lg border border-dashed p-4">
				<p class="text-sm text-muted-foreground">
					Belum ada alamat tersimpan. Tambahkan alamat terlebih dahulu untuk melanjutkan checkout.
				</p>
				<Button href={data.manageAddressUrl} variant="outline">Kelola alamat</Button>
			</div>
		{:else}
			{#each data.addresses as address (address.id)}
				<form
					method="POST"
					action="?/selectAddress"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								await update();
								await invalidateAll();
								return;
							}

							if (result.type === 'failure') {
								const text =
									typeof result.data?.message === 'string'
										? result.data.message
										: 'Gagal memilih alamat pengiriman.';
								toast.error(text);
								return;
							}

							if (result.type === 'redirect') {
								await invalidateAll();
								return;
							}
						};
					}}
				>
					<input type="hidden" name="intentId" value={data.intentId} />
					<input type="hidden" name="orderId" value={data.orderId} />
					<input type="hidden" name="addressId" value={address.id} />

					<button
						type="submit"
						class={`w-full rounded-lg border p-4 text-left transition-colors ${
							data.selectedAddressId === address.id ? 'border-primary bg-primary/5' : ''
						}`}
					>
						<div class="flex items-center justify-between gap-3">
							<p class="font-medium">{address.label || 'Tanpa label'}</p>
							<div class="flex items-center gap-2">
								{#if address.isDefault}
									<span class="text-xs text-muted-foreground">Utama</span>
								{/if}
								{#if data.selectedAddressId === address.id}
									<span class="text-xs text-primary">Dipilih</span>
								{/if}
							</div>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">
							{address.recipientName || '-'} - {address.phone || '-'}
						</p>
						<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
							{address.addressLine || '-'}, {address.city || '-'}
							{address.postalCode || '-'}
						</p>
					</button>
				</form>
			{/each}

			<div class="flex justify-end">
				<Button href={data.manageAddressUrl} variant="outline">Kelola alamat</Button>
			</div>
		{/if}
	</CardContent>
</Card>

<Card>
	<CardHeader class="space-y-1.5 border-b">
		<CardTitle>Metode Pengiriman</CardTitle>
		<CardDescription>Pilih metode pengiriman untuk pesanan Anda.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 pt-6">
		{#each data.deliveryMethods as method (method.id)}
			<form
				method="POST"
				action="?/selectDeliveryMethod"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							await update();
							await invalidateAll();
							return;
						}

						if (result.type === 'failure') {
							const text =
								typeof result.data?.message === 'string'
									? result.data.message
									: 'Gagal memilih metode pengiriman.';
							toast.error(text);
							return;
						}

						if (result.type === 'redirect') {
							await invalidateAll();
							return;
						}
					};
				}}
			>
				<input type="hidden" name="intentId" value={data.intentId} />
				<input type="hidden" name="orderId" value={data.orderId} />
				<input type="hidden" name="deliveryMethod" value={method.id} />

				<button
					type="submit"
					class={`w-full rounded-lg border p-4 text-left transition-colors ${
						data.selectedDeliveryMethod === method.id ? 'border-primary bg-primary/5' : ''
					}`}
				>
					<div class="flex items-center justify-between gap-3">
						<p class="font-medium">{method.label}</p>
						{#if data.selectedDeliveryMethod === method.id}
							<span class="text-xs text-primary">Dipilih</span>
						{/if}
					</div>
				</button>
			</form>
		{/each}
	</CardContent>
</Card>
