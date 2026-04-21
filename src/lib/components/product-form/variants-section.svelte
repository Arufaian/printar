<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { ProductVariant } from './types';
	import VariantItemCard from './variant-item-card.svelte';

	let {
		variants = $bindable(),
		onAddVariant,
		onRemoveVariant
	}: {
		variants: ProductVariant[];
		onAddVariant: () => void;
		onRemoveVariant: (index: number) => void;
	} = $props();
</script>

<section class="rounded-lg border bg-card p-4 sm:p-6">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h2 class="text-lg font-semibold">Variants</h2>
			<p class="mt-1 text-sm text-muted-foreground">Field img_url diisi URL hasil upload.</p>
		</div>
		<Button type="button" variant="outline" onclick={onAddVariant}>Add Variant</Button>
	</div>

	<div class="mt-5 space-y-4">
		{#each variants as _variant, index (_variant)}
			<VariantItemCard
				bind:variant={variants[index]}
				{index}
				canRemove={variants.length > 1}
				onRemove={() => onRemoveVariant(index)}
			/>
		{/each}
	</div>
</section>
