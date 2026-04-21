<script lang="ts">
	import { X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import type { ProductOption } from './types';

	let {
		form,
		option = $bindable(),
		groupIndex,
		optionIndex,
		canRemove,
		onRemove
	}: {
		form: any;
		option: ProductOption;
		groupIndex: number;
		optionIndex: number;
		canRemove: boolean;
		onRemove: () => void;
	} = $props();
</script>

<div class="grid gap-3 rounded-md border p-3 md:grid-cols-12">
	<Form.Field
		{form}
		name={`optionGroups[${groupIndex}].options[${optionIndex}].name`}
		class="md:col-span-7"
	>
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Nama Opsi</Form.Label>
				<Input {...props} bind:value={option.name} placeholder="Pakai Box Premium" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field
		{form}
		name={`optionGroups[${groupIndex}].options[${optionIndex}].additionalPrice`}
		class="md:col-span-4"
	>
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Additional Price</Form.Label>
				<Input {...props} type="number" min={0} bind:value={option.additionalPrice} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex items-end md:col-span-1">
		<Button type="button" class="w-full" variant="outline" disabled={!canRemove} onclick={onRemove}>
			<X />
		</Button>
	</div>
</div>
