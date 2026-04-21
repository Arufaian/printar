<script lang="ts">
	import { X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { ProductOption } from './types';

	let {
		option = $bindable(),
		groupIndex,
		optionIndex,
		canRemove,
		onRemove
	}: {
		option: ProductOption;
		groupIndex: number;
		optionIndex: number;
		canRemove: boolean;
		onRemove: () => void;
	} = $props();
</script>

<div class="grid gap-3 rounded-md border p-3 md:grid-cols-12">
	<div class="space-y-4 md:col-span-7">
		<Label for={'option-name-' + groupIndex + '-' + optionIndex}>Nama Opsi</Label>
		<Input
			id={'option-name-' + groupIndex + '-' + optionIndex}
			bind:value={option.name}
			placeholder="Pakai Box Premium"
		/>
	</div>
	<div class="space-y-4 md:col-span-4">
		<Label for={'option-price-' + groupIndex + '-' + optionIndex}>Additional Price</Label>
		<Input
			id={'option-price-' + groupIndex + '-' + optionIndex}
			type="number"
			min={0}
			bind:value={option.additionalPrice}
		/>
	</div>
	<div class="flex items-end md:col-span-1">
		<Button type="button" class="w-full" variant="outline" disabled={!canRemove} onclick={onRemove}>
			<X />
		</Button>
	</div>
</div>
