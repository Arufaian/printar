<script lang="ts">
	import { PUBLIC_BUCKET_NAME } from '$env/static/public';

	import { Image } from '@lucide/svelte';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import type { ProductSuperForm, ProductVariant } from '$lib/types/product-form';

	const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

	let {
		form,
		variant,
		index,
		canRemove,
		onVariantChange,
		onRemove
	}: {
		form: ProductSuperForm;
		variant: ProductVariant;
		index: number;
		canRemove: boolean;
		onVariantChange: (nextVariant: ProductVariant) => void;
		onRemove: () => void;
	} = $props();

	let imageFileInput = $state<HTMLInputElement | null>(null);
	let selectedFileName = $state('');
	let localPreviewUrl = $state('');
	let isUploading = $state(false);

	const openFilePicker = () => {
		imageFileInput?.click();
	};

	const updateVariant = (patch: Partial<ProductVariant>) => {
		// Reassign object agar parent menangkap perubahan secara reaktif.
		onVariantChange({ ...variant, ...patch });
	};

	const createVariantFilePath = (fileName: string) => {
		// Simpan file di folder variant agar struktur bucket tetap rapih.
		const extension = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
		return `product-variant/${crypto.randomUUID()}.${extension}`;
	};

	const getBucketObjectPathFromPublicUrl = (publicUrl?: string) => {
		if (!publicUrl) return null;

		try {
			const parsedUrl = new URL(publicUrl);
			const prefix = `/storage/v1/object/public/${PUBLIC_BUCKET_NAME}/`;
			if (!parsedUrl.pathname.startsWith(prefix)) return null;

			return decodeURIComponent(parsedUrl.pathname.slice(prefix.length));
		} catch {
			return null;
		}
	};

	const handleVariantNameInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		updateVariant({ name: target.value });
	};

	const handleVariantPriceInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		const parsedValue = Number.parseInt(target.value, 10);
		updateVariant({ price: Number.isNaN(parsedValue) ? 0 : parsedValue });
	};

	const handleVariantStockInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		const parsedValue = Number.parseInt(target.value, 10);
		updateVariant({ stock: Number.isNaN(parsedValue) ? 0 : parsedValue });
	};

	const handleFileChange = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		const previousImageUrl = variant.img_url;
		selectedFileName = file?.name ?? '';

		if (localPreviewUrl) {
			URL.revokeObjectURL(localPreviewUrl);
			localPreviewUrl = '';
		}

		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('File harus berupa gambar.');
			input.value = '';
			return;
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			toast.error('Ukuran gambar maksimal 2MB.');
			input.value = '';
			return;
		}

		// Preview lokal ditampilkan lebih dulu agar user dapat feedback cepat.
		localPreviewUrl = URL.createObjectURL(file);

		const supabase = page.data.supabase;
		if (!supabase) {
			toast.error('Supabase client tidak tersedia.');
			input.value = '';
			return;
		}

		isUploading = true;

		try {
			const filePath = createVariantFilePath(file.name);

			const { error: uploadError } = await supabase.storage
				.from(PUBLIC_BUCKET_NAME)
				.upload(filePath, file, {
					upsert: false,
					contentType: file.type
				});

			if (uploadError) {
				throw uploadError;
			}

			// URL ini yang nanti disimpan ke form dan akan ikut ke server saat submit.
			const { data } = supabase.storage.from(PUBLIC_BUCKET_NAME).getPublicUrl(filePath);
			updateVariant({ img_url: data.publicUrl });

			// Jika sebelumnya ada gambar dari bucket yang sama, hapus file lama agar tidak menumpuk.
			const previousObjectPath = getBucketObjectPathFromPublicUrl(previousImageUrl);
			if (previousObjectPath && previousObjectPath !== filePath) {
				const { error: deleteError } = await supabase.storage
					.from(PUBLIC_BUCKET_NAME)
					.remove([previousObjectPath]);

				if (deleteError) {
					toast.warning('Gambar baru tersimpan, tetapi gambar lama gagal dihapus.');
				}
			}

			toast.success('Gambar berhasil diupload.');
		} catch (error) {
			toast.error('Gagal upload gambar. Coba lagi.');
			console.error(error);
		} finally {
			isUploading = false;
			input.value = '';
		}
	};

	onDestroy(() => {
		if (localPreviewUrl) {
			URL.revokeObjectURL(localPreviewUrl);
		}
	});
</script>

<div class="rounded-md border p-4">
	<div class="mb-4 flex items-center justify-between gap-3">
		<h3 class="text-sm font-medium">Variant #{index + 1}</h3>
		<Button type="button" variant="ghost" disabled={!canRemove} onclick={onRemove}>Remove</Button>
	</div>
	<div class="grid gap-4 md:grid-cols-2">
		<div class="col-span-2">
			<input
				id={`variant-image-file-${index}`}
				class="hidden"
				type="file"
				accept="image/*"
				bind:this={imageFileInput}
				onchange={handleFileChange}
			/>
			<Empty.Root class="border border-dashed">
				<Empty.Header>
					{#if localPreviewUrl || variant.img_url}
						<div class="mx-auto h-24 w-24 overflow-hidden rounded-md border">
							<img
								src={localPreviewUrl || variant.img_url}
								alt="Preview gambar variant"
								class="h-full w-full object-cover"
							/>
						</div>
					{:else}
						<Empty.Media variant="icon">
							<Image />
						</Empty.Media>
						<Empty.Title>Image empty</Empty.Title>
					{/if}
					<Empty.Description>
						{#if isUploading}
							Uploading image...
						{:else}
							{selectedFileName || 'Upload variant image.'}
						{/if}
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={openFilePicker}
						disabled={isUploading}
					>
						{isUploading ? 'Uploading...' : 'Select file'}
					</Button>
				</Empty.Content>
			</Empty.Root>
		</div>

		<Form.Field {form} name={`variants[${index}].name`} class="md:col-span-2">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Nama Variant</Form.Label>
					<Input
						{...props}
						value={variant.name}
						oninput={handleVariantNameInput}
						placeholder="Merah - M"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name={`variants[${index}].price`}>
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Harga</Form.Label>
					<Input
						{...props}
						type="number"
						min={0}
						value={variant.price}
						oninput={handleVariantPriceInput}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name={`variants[${index}].stock`}>
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Stok</Form.Label>
					<Input
						{...props}
						type="number"
						min={0}
						value={variant.stock}
						oninput={handleVariantStockInput}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name={`variants[${index}].img_url`} hidden class="md:col-span-2">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Image URL (hasil upload)</Form.Label>
					<Input
						{...props}
						type="url"
						readonly
						value={variant.img_url ?? ''}
						placeholder="https://image.jpg"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>
</div>
