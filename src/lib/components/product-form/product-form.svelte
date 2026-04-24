<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { LoadingOverlay } from '$lib/components/ui/loading-overlay/index.js';
	import { productSchema } from '$lib/validation/product/product.schema';
	import { generateSlug } from '$lib/utils/string.js';
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

	const normalizeImageUrl = (publicUrl?: string | null) => {
		const normalizedUrl = publicUrl?.trim();
		return normalizedUrl ? normalizedUrl : null;
	};

	const collectVariantImageUrls = (variants: Array<{ img_url?: string | null }> = []) => {
		const imageUrls = new Set<string>();

		for (const variant of variants) {
			const normalizedUrl = normalizeImageUrl(variant.img_url);
			if (!normalizedUrl) continue;
			imageUrls.add(normalizedUrl);
		}

		return imageUrls;
	};

	const initialImageUrls = collectVariantImageUrls(getInitialForm().data.variants ?? []);
	const uploadedDuringSession = new Set<string>();
	const replacedOldUrls = new Set<string>();
	const removedFromFormUrls = new Set<string>();

	const form = superForm(getInitialForm(), {
		validators: zod4Client(productSchema),
		dataType: 'json',
		multipleSubmits: 'prevent',
		resetForm: false,

		onUpdated: async ({ form: updatedForm }) => {
			if (!updatedForm.message) return;

			if (updatedForm.message.type === 'success') {
				const cleanupResult = await cleanupImagesAfterSuccessfulSubmit();
				if (cleanupResult.failedCount > 0) {
					toast.warning(
						'Produk berhasil diperbarui, tetapi ada gambar lama yang gagal dibersihkan dari storage.'
					);
				}

				toast.success(updatedForm.message.text);
				setTimeout(() => {
					goto(resolve('/admin/products'));
				}, 500);
				return;
			}

			if (updatedForm.message.type === 'error') {
				toast.error(updatedForm.message.text);
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
	let showSubmittingOverlay = $state(false);
	let isBackProcessing = $state(false);
	let submittingOverlayTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const isSubmitting = $submitting;

		if (isSubmitting) {
			submittingOverlayTimer = setTimeout(() => {
				showSubmittingOverlay = true;
				submittingOverlayTimer = null;
			}, 180);
		} else {
			if (submittingOverlayTimer) {
				clearTimeout(submittingOverlayTimer);
				submittingOverlayTimer = null;
			}
			showSubmittingOverlay = false;
		}

		return () => {
			if (submittingOverlayTimer) {
				clearTimeout(submittingOverlayTimer);
				submittingOverlayTimer = null;
			}
		};
	});

	$effect(() => {
		const generatedSlug = generateSlug(($formData.name ?? '').toString());
		if ($formData.slug !== generatedSlug) {
			$formData.slug = generatedSlug;
		}
	});

	const variantCount = $derived(($formData.variants ?? []).length);
	const lowestPrice = $derived(
		($formData.variants ?? []).reduce(
			(lowest, variant) => {
				const price = Number(variant.price);
				if (!Number.isFinite(price) || price <= 0) return lowest;
				if (lowest === null) return price;
				return Math.min(lowest, price);
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
				price: Number.NaN,
				stock: Number.NaN,
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

	const deleteImageUrlsFromStorage = async (imageUrls: Iterable<string>) => {
		const objectPaths = Array.from(
			new Set(
				Array.from(imageUrls)
					.map((imageUrl) => getBucketObjectPathFromPublicUrl(imageUrl))
					.filter((objectPath): objectPath is string => Boolean(objectPath))
			)
		);

		if (objectPaths.length === 0) {
			return { deletedCount: 0, failedCount: 0 };
		}

		const supabase = page.data.supabase;
		if (!supabase) {
			return { deletedCount: 0, failedCount: objectPaths.length };
		}

		try {
			const { error } = await supabase.storage.from(BUCKET_NAME).remove(objectPaths);

			if (error) {
				return { deletedCount: 0, failedCount: objectPaths.length };
			}

			return { deletedCount: objectPaths.length, failedCount: 0 };
		} catch {
			return { deletedCount: 0, failedCount: objectPaths.length };
		}
	};

	const handleVariantImageUploaded = (payload: { previousUrl?: string; nextUrl: string }) => {
		const previousUrl = normalizeImageUrl(payload.previousUrl);
		const nextUrl = normalizeImageUrl(payload.nextUrl);

		if (!nextUrl) return;
		uploadedDuringSession.add(nextUrl);

		if (previousUrl && previousUrl !== nextUrl) {
			replacedOldUrls.add(previousUrl);
		}
	};

	const cleanupImagesAfterSuccessfulSubmit = async () => {
		const finalImageUrls = collectVariantImageUrls($formData.variants ?? []);
		const candidateUrls = new Set<string>();

		for (const imageUrl of replacedOldUrls) {
			if (!finalImageUrls.has(imageUrl)) {
				candidateUrls.add(imageUrl);
			}
		}

		for (const imageUrl of removedFromFormUrls) {
			if (!finalImageUrls.has(imageUrl)) {
				candidateUrls.add(imageUrl);
			}
		}

		for (const imageUrl of uploadedDuringSession) {
			if (!finalImageUrls.has(imageUrl)) {
				candidateUrls.add(imageUrl);
			}
		}

		return deleteImageUrlsFromStorage(candidateUrls);
	};

	const handleBack = async () => {
		if (isBackProcessing || $submitting) return;
		isBackProcessing = true;

		const draftOnlyUploads = Array.from(uploadedDuringSession).filter(
			(imageUrl) => !initialImageUrls.has(imageUrl)
		);

		const cleanupResult = await deleteImageUrlsFromStorage(draftOnlyUploads);
		if (cleanupResult.failedCount > 0) {
			toast.warning('Sebagian gambar draft gagal dibersihkan dari storage.');
		}

		await goto(resolve('/admin/products'));
	};

	const removeVariant = (index: number) => {
		const currentVariants = $formData.variants ?? [];
		if (currentVariants.length === 1) return;

		const variantToRemove = currentVariants[index];
		const imageUrl = normalizeImageUrl(variantToRemove?.img_url);
		if (imageUrl) {
			removedFromFormUrls.add(imageUrl);
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

{#if showSubmittingOverlay}
	<LoadingOverlay message="Menyimpan perubahan..." />
{/if}

<form method="POST" use:enhance novalidate>
	<div class="grid gap-4 lg:grid-cols-4">
		<div class="space-y-4 lg:col-span-3">
			<BasicInformationSection {form} {formData} categoryOptions={data.categoryOptions} />
			<VariantsSection
				{form}
				bind:variants={$formData.variants}
				onAddVariant={addVariant}
				onRemoveVariant={removeVariant}
				onVariantImageUploaded={handleVariantImageUploaded}
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
		<ProductFormSidebar
			{variantCount}
			{lowestPrice}
			{totalStock}
			submitting={$submitting}
			onBack={handleBack}
			{isBackProcessing}
		/>
	</div>
</form>
