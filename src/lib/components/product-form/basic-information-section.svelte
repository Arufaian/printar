<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { ProductFormStore, ProductSuperForm } from '$lib/types/product-form';

	let {
		form,
		formData,
		categoryOptions
	}: {
		form: ProductSuperForm;
		formData: ProductFormStore;
		categoryOptions: Array<{ id: string; name: string }>;
	} = $props();

	const selectedCategoryLabel = $derived.by(() => {
		const selectedCategory = categoryOptions.find(
			(category) => category.id === $formData.categoryId
		);
		return selectedCategory?.name ?? 'Pilih kategori';
	});
</script>

<section class="rounded-lg border bg-card p-4 sm:p-6">
	<h2 class="text-lg font-semibold">Basic Information</h2>
	<p class="mt-1 text-sm text-muted-foreground">Data utama produk yang tampil di katalog.</p>
	<div class="mt-5 space-y-4">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Nama Produk</Form.Label>
					<Input {...props} bind:value={$formData.name} placeholder="Kemeja Flanel Kotak" />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="categoryId">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Category</Form.Label>
					<Select.Root type="single" name={props.name} bind:value={$formData.categoryId}>
						<Select.Trigger {...props} class="w-full">{selectedCategoryLabel}</Select.Trigger>
						<Select.Content>
							{#each categoryOptions as category (category.id)}
								<Select.Item value={category.id} label={category.name}>{category.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Deskripsi</Form.Label>
					<Textarea
						{...props}
						class="h-48"
						rows={7}
						bind:value={$formData.description}
						placeholder="Kemeja flanel bahan premium, nyaman dipakai seharian."
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>
</section>
