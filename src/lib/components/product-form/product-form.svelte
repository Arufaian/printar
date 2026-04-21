<script lang="ts">
	import BasicInformationSection from './basic-information-section.svelte';
	import OptionGroupsSection from './option-groups-section.svelte';
	import ProductFormSidebar from './product-form-sidebar.svelte';
	import type { ProductPayload } from './types';
	import VariantsSection from './variants-section.svelte';

	let form = $state<ProductPayload>({
		name: '',
		description: '',
		categoryId: '',
		variants: [
			{
				name: '',
				price: 0,
				stock: 0,
				img_url: ''
			}
		],
		optionGroups: [
			{
				name: '',
				options: [
					{
						name: '',
						additionalPrice: 0
					}
				]
			}
		]
	});

	const variantCount = $derived(form.variants.length);
	const lowestPrice = $derived(
		form.variants.reduce(
			(lowest, variant) => {
				if (variant.price <= 0) return lowest;
				if (lowest === null) return variant.price;
				return Math.min(lowest, variant.price);
			},
			null as number | null
		)
	);
	const totalStock = $derived(
		form.variants.reduce(
			(total, variant) => total + (Number.isFinite(variant.stock) ? variant.stock : 0),
			0
		)
	);

	const addVariant = () => {
		form.variants.push({
			name: '',
			price: 0,
			stock: 0,
			img_url: ''
		});
	};

	const removeVariant = (index: number) => {
		if (form.variants.length === 1) return;
		form.variants.splice(index, 1);
	};

	const addOptionGroup = () => {
		form.optionGroups.push({
			name: '',
			options: [{ name: '', additionalPrice: 0 }]
		});
	};

	const removeOptionGroup = (groupIndex: number) => {
		if (form.optionGroups.length === 1) return;
		form.optionGroups.splice(groupIndex, 1);
	};

	const addOption = (groupIndex: number) => {
		form.optionGroups[groupIndex]?.options.push({ name: '', additionalPrice: 0 });
	};

	const removeOption = (groupIndex: number, optionIndex: number) => {
		if ((form.optionGroups[groupIndex]?.options.length ?? 0) === 1) return;
		form.optionGroups[groupIndex]?.options.splice(optionIndex, 1);
	};
</script>

<div class="grid gap-4 lg:grid-cols-4">
	<div class="space-y-4 lg:col-span-3">
		<BasicInformationSection bind:form />
		<VariantsSection
			bind:variants={form.variants}
			onAddVariant={addVariant}
			onRemoveVariant={removeVariant}
		/>
		<OptionGroupsSection
			bind:optionGroups={form.optionGroups}
			onAddOptionGroup={addOptionGroup}
			onRemoveOptionGroup={removeOptionGroup}
			onAddOption={addOption}
			onRemoveOption={removeOption}
		/>
	</div>
	<ProductFormSidebar {variantCount} {lowestPrice} {totalStock} />
</div>
