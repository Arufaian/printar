<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { productSchema } from '$lib/validation/product/product.schema';
	import BasicInformationSection from './basic-information-section.svelte';
	import OptionGroupsSection from './option-groups-section.svelte';
	import ProductFormSidebar from './product-form-sidebar.svelte';
	import VariantsSection from './variants-section.svelte';

	const BUCKET_NAME = 'ikumer';

	type ProductFormData = Infer<typeof productSchema>;

	let {
		data
	}: {
		data: {
			form: SuperValidated<ProductFormData>;
			categoryOptions: Array<{ id: string; name: string }>;
		};
	} = $props();

	const getInitialForm = () => data.form;

	const form = superForm(getInitialForm(), {
		validators: zod4Client(productSchema),
		dataType: 'json',
		multipleSubmits: 'prevent',
		resetForm: false
	});

	const { form: formData, enhance, submitting } = form;

	const variantCount = $derived(($formData.variants ?? []).length);
	const lowestPrice = $derived(
		($formData.variants ?? []).reduce(
			(lowest, variant) => {
				if (variant.price <= 0) return lowest;
				if (lowest === null) return variant.price;
				return Math.min(lowest, variant.price);
			},
			null as number | null
		)
	);
	const totalStock = $derived(
		($formData.variants ?? []).reduce(
			(total, variant) => total + (Number.isFinite(variant.stock) ? variant.stock : 0),
			0
		)
	);

	const addVariant = () => {
		$formData.variants = [
			...($formData.variants ?? []),
			{
				name: '',
				price: 0,
				stock: 0,
				img_url: ''
			}
		];
	};

	const getBucketObjectPathFromPublicUrl = (publicUrl?: string) => {
		if (!publicUrl) return null;

		try {
			const parsedUrl = new URL(publicUrl);
			const prefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
			if (!parsedUrl.pathname.startsWith(prefix)) return null;

			return decodeURIComponent(parsedUrl.pathname.slice(prefix.length));
		} catch {
			return null;
		}
	};

	const removeVariant = async (index: number) => {
		const currentVariants = $formData.variants ?? [];
		if (currentVariants.length === 1) return;

		const variantToRemove = currentVariants[index];
		const objectPath = getBucketObjectPathFromPublicUrl(variantToRemove?.img_url);

		if (objectPath && page.data.supabase) {
			try {
				const { error } = await page.data.supabase.storage.from(BUCKET_NAME).remove([objectPath]);

				if (error) {
					toast.warning('Variant dihapus, tetapi gambar lama gagal dihapus dari storage.');
				}
			} catch {
				toast.warning('Variant dihapus, tetapi terjadi kendala saat menghapus gambar lama.');
			}
		}

		$formData.variants = currentVariants.filter((_, idx) => idx !== index);
	};

	const addOptionGroup = () => {
		$formData.optionGroups = [
			...($formData.optionGroups ?? []),
			{ name: '', options: [{ name: '', additionalPrice: 0 }] }
		];
	};

	const removeOptionGroup = (groupIndex: number) => {
		if (($formData.optionGroups ?? []).length === 1) return;
		$formData.optionGroups = ($formData.optionGroups ?? []).filter((_, idx) => idx !== groupIndex);
	};

	const addOption = (groupIndex: number) => {
		const groups = [...($formData.optionGroups ?? [])];
		const targetGroup = groups[groupIndex];
		if (!targetGroup) return;
		targetGroup.options = [...(targetGroup.options ?? []), { name: '', additionalPrice: 0 }];
		$formData.optionGroups = groups;
	};

	const removeOption = (groupIndex: number, optionIndex: number) => {
		const groups = [...($formData.optionGroups ?? [])];
		const targetGroup = groups[groupIndex];
		if (!targetGroup || (targetGroup.options ?? []).length === 1) return;
		targetGroup.options = (targetGroup.options ?? []).filter((_, idx) => idx !== optionIndex);
		$formData.optionGroups = groups;
	};
</script>

<form method="POST" use:enhance>
	<div class="grid gap-4 lg:grid-cols-4">
		<div class="space-y-4 lg:col-span-3">
			<BasicInformationSection {form} {formData} categoryOptions={data.categoryOptions} />
			<VariantsSection
				{form}
				bind:variants={$formData.variants}
				onAddVariant={addVariant}
				onRemoveVariant={removeVariant}
			/>
			<OptionGroupsSection
				{form}
				bind:optionGroups={$formData.optionGroups}
				onAddOptionGroup={addOptionGroup}
				onRemoveOptionGroup={removeOptionGroup}
				onAddOption={addOption}
				onRemoveOption={removeOption}
			/>
		</div>
		<ProductFormSidebar {variantCount} {lowestPrice} {totalStock} submitting={$submitting} />
	</div>
</form>
