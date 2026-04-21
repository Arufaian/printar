<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { X, Image } from '@lucide/svelte';

	type ProductVariant = {
		name: string;
		price: number;
		stock: number;
		img_url: string;
	};

	type ProductOption = {
		name: string;
		additionalPrice: number;
	};

	type ProductOptionGroup = {
		name: string;
		options: ProductOption[];
	};

	type ProductPayload = {
		name: string;
		description: string;
		categoryId: string;
		variants: ProductVariant[];
		optionGroups: ProductOptionGroup[];
	};

	const formatIdr = (value: number) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;

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
		<section class="rounded-lg border bg-card p-4 sm:p-6">
			<h2 class="text-lg font-semibold">Basic Information</h2>
			<p class="mt-1 text-sm text-muted-foreground">Data utama produk yang tampil di katalog.</p>
			<div class="mt-5 space-y-4">
				<div class="space-y-4">
					<Label for="product-name">Nama Produk</Label>
					<Input id="product-name" bind:value={form.name} placeholder="Kemeja Flanel Kotak" />
				</div>

				<div class="space-y-4">
					<Label for="product-category-id">Category</Label>
					<Select.Root type="single">
						<Select.Trigger class="w-full"></Select.Trigger>
						<Select.Content>
							<Select.Item value="light">Light</Select.Item>
							<Select.Item value="dark">Dark</Select.Item>
							<Select.Item value="system">System</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-4">
					<Label for="product-description">Deskripsi</Label>
					<Textarea
						class="h-48"
						id="product-description"
						rows={7}
						bind:value={form.description}
						placeholder="Kemeja flanel bahan premium, nyaman dipakai seharian."
					/>
				</div>
			</div>
		</section>

		<section class="rounded-lg border bg-card p-4 sm:p-6">
			<div class="flex items-center justify-between gap-3">
				<div>
					<h2 class="text-lg font-semibold">Variants</h2>
					<p class="mt-1 text-sm text-muted-foreground">Field img_url diisi URL hasil upload.</p>
				</div>
				<Button type="button" variant="outline" onclick={addVariant}>Add Variant</Button>
			</div>

			<div class="mt-5 space-y-4">
				{#each form.variants as variant, index (variant)}
					<div class="rounded-md border p-4">
						<div class="mb-4 flex items-center justify-between gap-3">
							<h3 class="text-sm font-medium">Variant #{index + 1}</h3>
							<Button
								type="button"
								variant="ghost"
								disabled={form.variants.length === 1}
								onclick={() => removeVariant(index)}
							>
								Remove
							</Button>
						</div>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="col-span-2">
								<Empty.Root class="border border-dashed">
									<Empty.Header>
										<Empty.Media variant="icon">
											<Image />
										</Empty.Media>
										<Empty.Title>Image empty</Empty.Title>
										<Empty.Description>Upload variant image.</Empty.Description>
									</Empty.Header>
									<Empty.Content>
										<Button variant="outline" size="sm">Upload</Button>
									</Empty.Content>
								</Empty.Root>
							</div>

							<div class="space-y-4 md:col-span-2">
								<Label for={'variant-name-' + index}>Nama Variant</Label>
								<Input
									id={'variant-name-' + index}
									bind:value={variant.name}
									placeholder="Merah - M"
								/>
							</div>
							<div class="space-y-4">
								<Label for={'variant-price-' + index}>Harga</Label>
								<Input
									id={'variant-price-' + index}
									type="number"
									min={0}
									bind:value={variant.price}
								/>
							</div>
							<div class="space-y-4">
								<Label for={'variant-stock-' + index}>Stok</Label>
								<Input
									id={'variant-stock-' + index}
									type="number"
									min={0}
									bind:value={variant.stock}
								/>
							</div>
							<div class="space-y-4 md:col-span-2">
								<Label for={'variant-img-' + index}>Image URL (hasil upload)</Label>
								<Input
									id={'variant-img-' + index}
									type="url"
									bind:value={variant.img_url}
									placeholder="https://storage.yoursite.com/images/flanel-merah.jpg"
								/>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-lg border bg-card p-4 sm:p-6">
			<div class="flex items-center justify-between gap-3">
				<div>
					<h2 class="text-lg font-semibold">Option Groups</h2>
					<p class="mt-1 text-sm text-muted-foreground">Pilihan tambahan per grup (opsional).</p>
				</div>
				<Button type="button" variant="outline" onclick={addOptionGroup}>Add Group</Button>
			</div>

			<div class="mt-5 space-y-4">
				{#each form.optionGroups as group, groupIndex (group)}
					<div class="rounded-md border p-4">
						<div class="mb-4 flex items-center justify-between gap-3">
							<h3 class="text-sm font-medium">Group #{groupIndex + 1}</h3>
							<Button
								type="button"
								variant="ghost"
								disabled={form.optionGroups.length === 1}
								onclick={() => removeOptionGroup(groupIndex)}
							>
								Remove Group
							</Button>
						</div>
						<div class="space-y-4">
							<div class="space-y-4">
								<Label for={'group-name-' + groupIndex}>Nama Group</Label>
								<Input
									id={'group-name-' + groupIndex}
									bind:value={group.name}
									placeholder="Bungkus Kado"
								/>
							</div>
							<div class="space-y-4">
								{#each group.options as option, optionIndex (option)}
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
											<Label for={'option-price-' + groupIndex + '-' + optionIndex}
												>Additional Price</Label
											>
											<Input
												id={'option-price-' + groupIndex + '-' + optionIndex}
												type="number"
												min={0}
												bind:value={option.additionalPrice}
											/>
										</div>
										<div class="flex items-end md:col-span-1">
											<Button
												type="button"
												class="w-full"
												variant="outline"
												disabled={group.options.length === 1}
												onclick={() => removeOption(groupIndex, optionIndex)}
											>
												<X />
											</Button>
										</div>
									</div>
								{/each}
								<Button type="button" variant="outline" onclick={() => addOption(groupIndex)}>
									Add Option
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	</div>

	<aside class="space-y-4 lg:col-span-1">
		<div class="flex flex-col gap-3 rounded-lg border bg-card p-3">
			<Button type="button" class="w-full" variant="outline">Save Draft</Button>
			<Button type="button" class="w-full">Publish</Button>
		</div>
		<div class="rounded-lg border bg-card p-4">
			<h2 class="mb-3 text-sm font-semibold">Ringkasan Produk</h2>
			<div class="space-y-4 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Jumlah variant</span>
					<span class="font-medium">{variantCount}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Lowest price</span>
					<span class="font-medium">{lowestPrice === null ? '-' : formatIdr(lowestPrice)}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Total stok</span>
					<span class="font-medium">{totalStock}</span>
				</div>
			</div>
		</div>
	</aside>
</div>
