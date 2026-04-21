<script lang="ts">
	import { Image } from '@lucide/svelte';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import type { ProductVariant } from './types';

	let {
		form,
		variant = $bindable(),
		index,
		canRemove,
		onRemove
	}: {
		form: any;
		variant: ProductVariant;
		index: number;
		canRemove: boolean;
		onRemove: () => void;
	} = $props();

	let imageFileInput = $state<HTMLInputElement | null>(null);
	let selectedFileName = $state('');
	let localPreviewUrl = $state('');

	const openFilePicker = () => {
		imageFileInput?.click();
	};

	const handleFileChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		selectedFileName = file?.name ?? '';

		if (localPreviewUrl) {
			URL.revokeObjectURL(localPreviewUrl);
			localPreviewUrl = '';
		}

		if (!file || !file.type.startsWith('image/')) return;

		localPreviewUrl = URL.createObjectURL(file);
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
					{#if localPreviewUrl}
						<div class="mx-auto h-24 w-24 overflow-hidden rounded-md border">
							<img
								src={localPreviewUrl}
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
						{selectedFileName || 'Upload variant image.'}
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button type="button" variant="outline" size="sm" onclick={openFilePicker}
						>Select file</Button
					>
				</Empty.Content>
			</Empty.Root>
		</div>

		<Form.Field {form} name={`variants[${index}].name`} class="md:col-span-2">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Nama Variant</Form.Label>
					<Input {...props} bind:value={variant.name} placeholder="Merah - M" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name={`variants[${index}].price`}>
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Harga</Form.Label>
					<Input {...props} type="number" min={0} bind:value={variant.price} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name={`variants[${index}].stock`}>
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Stok</Form.Label>
					<Input {...props} type="number" min={0} bind:value={variant.stock} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name={`variants[${index}].img_url`} class="md:col-span-2">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Image URL (hasil upload)</Form.Label>
					<Input
						{...props}
						type="url"
						bind:value={variant.img_url}
						placeholder="https://storage.yoursite.com/images/flanel-merah.jpg"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>
</div>
