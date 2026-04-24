<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { ProductSuperForm, ProductVariant } from '$lib/types/product-form';
	import VariantItemCard from './variant-item-card.svelte';

	let {
		form,
		variants = $bindable(),
		onAddVariant,
		onRemoveVariant,
		onVariantImageUploaded
	}: {
		form: ProductSuperForm;
		variants: ProductVariant[];
		onAddVariant: () => void;
		onRemoveVariant: (index: number) => void | Promise<void>;
		onVariantImageUploaded: (payload: {
			previousUrl?: string;
			nextUrl: string;
		}) => void | Promise<void>;
	} = $props();

	const updateVariant = (index: number, nextVariant: ProductVariant) => {
		// Reassign array item immutably so Svelte tracks the change reliably.
		variants = variants.map((variant, variantIndex) =>
			variantIndex === index ? nextVariant : variant
		);
	};
</script>

<section class="rounded-lg border bg-card p-4 sm:p-6">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h2 class="text-lg font-semibold">Varian</h2>
			<p class="mt-1 text-sm text-muted-foreground">Gambar varian diisi dari URL hasil upload.</p>
		</div>
		<Button type="button" variant="outline" onclick={onAddVariant}>Tambah Varian</Button>
	</div>

	<div class="mt-5 space-y-4">
		{#each variants as variant, index (`${variant.img_url ?? 'no-image'}-${index}`)}
			<VariantItemCard
				{form}
				{variant}
				onVariantChange={(nextVariant) => updateVariant(index, nextVariant)}
				onImageUploaded={onVariantImageUploaded}
				{index}
				canRemove={variants.length > 1}
				onRemove={() => onRemoveVariant(index)}
			/>
		{/each}
	</div>
</section>
