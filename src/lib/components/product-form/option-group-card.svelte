<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { ProductOptionGroup } from './types';
	import OptionItemRow from './option-item-row.svelte';

	let {
		group = $bindable(),
		groupIndex,
		canRemoveGroup,
		onRemoveGroup,
		onAddOption,
		onRemoveOption
	}: {
		group: ProductOptionGroup;
		groupIndex: number;
		canRemoveGroup: boolean;
		onRemoveGroup: () => void;
		onAddOption: (groupIndex: number) => void;
		onRemoveOption: (groupIndex: number, optionIndex: number) => void;
	} = $props();
</script>

<div class="rounded-md border p-4">
	<div class="mb-4 flex items-center justify-between gap-3">
		<h3 class="text-sm font-medium">Group #{groupIndex + 1}</h3>
		<Button type="button" variant="ghost" disabled={!canRemoveGroup} onclick={onRemoveGroup}>
			Remove Group
		</Button>
	</div>
	<div class="space-y-4">
		<div class="space-y-4">
			<Label for={'group-name-' + groupIndex}>Nama Group</Label>
			<Input id={'group-name-' + groupIndex} bind:value={group.name} placeholder="Bungkus Kado" />
		</div>
		<div class="space-y-4">
			{#each group.options as _option, optionIndex (_option)}
				<OptionItemRow
					bind:option={group.options[optionIndex]}
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
