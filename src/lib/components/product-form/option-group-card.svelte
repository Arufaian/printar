<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import type { ProductOptionGroup, ProductSuperForm } from '$lib/types/product-form';
	import OptionItemRow from './option-item-row.svelte';

	let {
		form,
		group,
		groupIndex,
		canRemoveGroup,
		onRemoveGroup,
		onGroupChange,
		onAddOption,
		onRemoveOption
	}: {
		form: ProductSuperForm;
		group: ProductOptionGroup;
		groupIndex: number;
		canRemoveGroup: boolean;
		onRemoveGroup: () => void;
		onGroupChange: (nextGroup: ProductOptionGroup) => void;
		onAddOption: (groupIndex: number) => void;
		onRemoveOption: (groupIndex: number, optionIndex: number) => void;
	} = $props();

	const updateGroup = (patch: Partial<ProductOptionGroup>) => {
		const nextGroup = { ...group, ...patch };
		onGroupChange(nextGroup);
	};

	const updateOption = (optionIndex: number, nextOption: ProductOptionGroup['options'][number]) => {
		const nextOptions = group.options.map((option, index) =>
			index === optionIndex ? nextOption : option
		);
		updateGroup({ options: nextOptions });
	};

	const handleGroupNameInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		updateGroup({ name: target.value });
	};
</script>

<div class="rounded-md border p-4">
	<div class="mb-4 flex items-center justify-between gap-3">
		<h3 class="text-sm font-medium">Group #{groupIndex + 1}</h3>
		<Button type="button" variant="ghost" disabled={!canRemoveGroup} onclick={onRemoveGroup}>
			Remove Group
		</Button>
	</div>
	<div class="space-y-4">
		<Form.Field {form} name={`optionGroups[${groupIndex}].name`}>
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Nama Group</Form.Label>
					<Input
						{...props}
						value={group.name}
						oninput={handleGroupNameInput}
						placeholder="Bungkus Kado"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<div class="space-y-4">
			{#each group.options as option, optionIndex (optionIndex)}
				<OptionItemRow
					{form}
					{option}
					onOptionChange={(nextOption) => updateOption(optionIndex, nextOption)}
					{groupIndex}
					{optionIndex}
					canRemove={group.options.length > 1}
					onRemove={() => onRemoveOption(groupIndex, optionIndex)}
				/>
			{/each}
			<Button type="button" variant="outline" onclick={() => onAddOption(groupIndex)}
				>Add Option</Button
			>
		</div>
	</div>
</div>
