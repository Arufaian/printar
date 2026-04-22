<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { ProductOptionGroup, ProductSuperForm } from '$lib/types/product-form';
	import OptionGroupCard from './option-group-card.svelte';

	let {
		form,
		optionGroups = $bindable(),
		onAddOptionGroup,
		onRemoveOptionGroup,
		onAddOption,
		onRemoveOption
	}: {
		form: ProductSuperForm;
		optionGroups: ProductOptionGroup[];
		onAddOptionGroup: () => void;
		onRemoveOptionGroup: (groupIndex: number) => void;
		onAddOption: (groupIndex: number) => void;
		onRemoveOption: (groupIndex: number, optionIndex: number) => void;
	} = $props();

	const updateGroup = (groupIndex: number, nextGroup: ProductOptionGroup) => {
		// Hindari bind ke indexed property agar tidak kena warning non-reactive binding.
		optionGroups = optionGroups.map((group, index) => (index === groupIndex ? nextGroup : group));
	};
</script>

<section class="rounded-lg border bg-card p-4 sm:p-6">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h2 class="text-lg font-semibold">Opsi Tambahan</h2>
			<p class="mt-1 text-sm text-muted-foreground">Pilihan tambahan per grup (opsional).</p>
		</div>
		<Button type="button" variant="outline" onclick={onAddOptionGroup}>Tambah Grup</Button>
	</div>

	<div class="mt-5 space-y-4">
		{#each optionGroups as group, groupIndex (groupIndex)}
			<OptionGroupCard
				{form}
				{group}
				onGroupChange={(nextGroup) => updateGroup(groupIndex, nextGroup)}
				{groupIndex}
				canRemoveGroup={optionGroups.length > 1}
				onRemoveGroup={() => onRemoveOptionGroup(groupIndex)}
				{onAddOption}
				{onRemoveOption}
			/>
		{/each}
	</div>
</section>
