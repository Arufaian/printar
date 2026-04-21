<script lang="ts">
	import { X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import type { ProductOption, ProductSuperForm } from '$lib/types/product-form';

	let {
		form,
		option,
		groupIndex,
		optionIndex,
		canRemove,
		onOptionChange,
		onRemove
	}: {
		form: ProductSuperForm;
		option: ProductOption;
		groupIndex: number;
		optionIndex: number;
		canRemove: boolean;
		onOptionChange: (nextOption: ProductOption) => void;
		onRemove: () => void;
	} = $props();

	const updateOption = (patch: Partial<ProductOption>) => {
		onOptionChange({ ...option, ...patch });
	};

	const handleOptionNameInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		updateOption({ name: target.value });
	};

	const handleAdditionalPriceInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		const parsedValue = Number.parseInt(target.value, 10);
		updateOption({ additionalPrice: Number.isNaN(parsedValue) ? 0 : parsedValue });
	};
</script>

<div class=" relative grid gap-3 rounded-md border p-3 md:grid-cols-12">
	<Form.Field
		{form}
		name={`optionGroups[${groupIndex}].options[${optionIndex}].name`}
		class="md:col-span-7"
	>
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Nama Opsi</Form.Label>
				<Input
					{...props}
					value={option.name}
					oninput={handleOptionNameInput}
					placeholder="Pakai Box Premium"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field
		{form}
		name={`optionGroups[${groupIndex}].options[${optionIndex}].additionalPrice`}
		class=" md:col-span-4"
	>
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Additional Price</Form.Label>
				<Input
					{...props}
					type="number"
					min={0}
					value={option.additionalPrice}
					oninput={handleAdditionalPriceInput}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class="absolute top-0 right-0">
		<Button type="button" variant="outline" disabled={!canRemove} onclick={onRemove}>
			<X class="width-2" />
		</Button>
	</div>
</div>
