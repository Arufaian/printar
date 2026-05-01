<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '$lib/components/ui/button/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { formatCurrency } from '$lib/utils/string.js';

	let {
		selectedCount,
		selectedSubtotal,
		shippingCost,
		grandTotal,
		selectedItemIds,
		enhanceCheckoutAction,
		categoriesHref
	}: Props = $props();

	type Props = {
		selectedCount: number;
		selectedSubtotal: number;
		shippingCost: number;
		grandTotal: number;
		selectedItemIds: string[];
		enhanceCheckoutAction: SubmitFunction;
		categoriesHref: string;
	};
</script>

<aside class="rounded-xl bg-card p-4 shadow lg:sticky lg:top-24 lg:col-span-4 lg:h-fit lg:p-6">
	<h2 class="text-lg font-semibold">Ringkasan Belanja</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		{selectedCount} item{selectedCount > 1 ? 's' : ''} selected
	</p>

	<div class="mt-5 space-y-3 text-sm">
		<div class="flex items-center justify-between">
			<span class="text-muted-foreground">Subtotal</span>
			<span>{formatCurrency(selectedSubtotal)}</span>
		</div>
		<div class="flex items-center justify-between">
			<span class="text-muted-foreground">Ongkir</span>
			<span>{selectedCount > 0 ? formatCurrency(shippingCost) : formatCurrency(0)}</span>
		</div>
	</div>

	<Separator class="my-4" />

	<div class="flex items-center justify-between">
		<span class="font-medium">Total</span>
		<span class="text-lg font-semibold">{formatCurrency(grandTotal)}</span>
	</div>

	<form method="POST" action="?/checkout" use:enhance={enhanceCheckoutAction}>
		{#each selectedItemIds as selectedId (selectedId)}
			<input type="hidden" name="selectedItemIds" value={selectedId} />
		{/each}
		<Button class="mt-5 w-full" type="submit" disabled={selectedCount === 0}
			>Lanjut ke Checkout</Button
		>
	</form>
	<Button variant="outline" class="mt-2 w-full" href={categoriesHref}>Lanjut Belanja</Button>
</aside>
