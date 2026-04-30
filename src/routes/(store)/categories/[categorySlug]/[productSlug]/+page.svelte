<script lang="ts">
	import { PUBLIC_BUCKET_NAME } from '$env/static/public';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { FileText, Image, Minus, Plus } from '@lucide/svelte/icons';
	import { onDestroy } from 'svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import {
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselNext,
		CarouselPrevious
	} from '$lib/components/ui/carousel';
	import { formatCurrency } from '$lib/utils/string.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardFooter from '$lib/components/ui/card/card-footer.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import type { PageProps } from './$types';
	import { toast } from 'svelte-sonner';

	const MAX_DESIGN_FILE_SIZE_BYTES = 2 * 1024 * 1024;

	let { data }: PageProps = $props();

	let selectedVariantId = $state<string | null>(null);
	let selectedImageIndex = $state(0);
	let quantity = $state(1);
	let selectedOptionIdsByGroup = $state<Record<string, string>>({});
	let hasInitializedSelections = $state(false);
	let actionFeedback = $state('');
	let designFileInput = $state<HTMLInputElement | null>(null);
	let designFileName = $state('');
	let designPreviewUrl = $state('');
	let designFilePath = $state('');
	let isUploadingDesign = $state(false);
	const uploadedDesignPaths = new Set<string>();
	const consumedDesignPaths = new Set<string>();

	$effect(() => {
		if (hasInitializedSelections) return;

		selectedVariantId = data.defaultVariantId;
		selectedOptionIdsByGroup = Object.fromEntries(
			data.optionGroups
				.map((group) => {
					const firstOption = group.options[0];
					if (!firstOption) return null;
					return [group.id, firstOption.id] as const;
				})
				.filter((entry): entry is readonly [string, string] => Boolean(entry))
		);

		hasInitializedSelections = true;
	});

	const selectedVariant = $derived(
		data.variants.find((variant) => variant.id === selectedVariantId) ?? data.variants[0] ?? null
	);

	const activeImage = $derived(data.gallery[selectedImageIndex] ?? data.gallery[0] ?? null);

	const selectedOptionsAdditionalPrice = $derived(
		data.optionGroups.reduce((total, group) => {
			const selectedOptionId = selectedOptionIdsByGroup[group.id];
			if (!selectedOptionId) return total;

			const selectedOption = group.options.find((option) => option.id === selectedOptionId);
			if (!selectedOption) return total;

			return total + selectedOption.additionalPrice;
		}, 0)
	);

	const unitPrice = $derived((selectedVariant?.price ?? 0) + selectedOptionsAdditionalPrice);
	const subtotal = $derived(unitPrice * quantity);
	const availableStock = $derived(selectedVariant?.stock ?? 0);
	const selectedOptionIds = $derived(
		Object.values(selectedOptionIdsByGroup).filter((value): value is string => value.length > 0)
	);

	const selectVariant = (variantId: string) => {
		const targetVariant = data.variants.find((variant) => variant.id === variantId);
		if (!targetVariant || targetVariant.stock <= 0) {
			return;
		}

		selectedVariantId = variantId;

		const imageIndex = data.gallery.findIndex((image) => image.variantId === variantId);
		if (imageIndex >= 0) {
			selectedImageIndex = imageIndex;
		}

		if (quantity > availableStock && availableStock > 0) {
			quantity = availableStock;
		}
	};

	const selectThumbnail = (index: number) => {
		selectedImageIndex = index;
		const relatedVariantId = data.gallery[index]?.variantId;
		if (relatedVariantId) {
			selectedVariantId = relatedVariantId;
		}
	};

	const selectOption = (groupId: string, optionId: string) => {
		selectedOptionIdsByGroup = {
			...selectedOptionIdsByGroup,
			[groupId]: optionId
		};
	};

	const decreaseQuantity = () => {
		quantity = Math.max(1, quantity - 1);
	};

	const increaseQuantity = () => {
		if (availableStock <= 0) {
			return;
		}

		quantity = Math.min(availableStock, quantity + 1);
	};

	const clearDesignPreview = () => {
		if (!designPreviewUrl) return;
		URL.revokeObjectURL(designPreviewUrl);
		designPreviewUrl = '';
	};

	const openDesignFilePicker = () => {
		designFileInput?.click();
	};

	const createDesignFilePath = (userId: string, fileName: string) => {
		const extension = fileName.split('.').pop()?.toLowerCase() ?? 'bin';
		return `customer-design/${userId}/${crypto.randomUUID()}.${extension}`;
	};

	const removeDesignPathsFromStorage = async (paths: Iterable<string>) => {
		const targetPaths = Array.from(
			new Set(
				Array.from(paths)
					.map((value) => value.trim())
					.filter(Boolean)
			)
		);

		if (targetPaths.length === 0) {
			return;
		}

		const supabase = page.data.supabase;
		if (!supabase) return;

		try {
			const { error } = await supabase.storage.from(PUBLIC_BUCKET_NAME).remove(targetPaths);
			if (error) {
				console.error('[pdp:design] cleanup failed', error);
			}
		} catch (error) {
			console.error('[pdp:design] cleanup failed', error);
		}
	};

	const handleDesignFileChange = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		designFileName = file?.name ?? '';

		if (!file) return;

		const isSupportedFile = file.type === 'application/pdf' || file.type.startsWith('image/');
		if (!isSupportedFile) {
			toast.error('Format file harus gambar atau PDF.');
			input.value = '';
			return;
		}

		if (file.size > MAX_DESIGN_FILE_SIZE_BYTES) {
			toast.error('Ukuran file maksimal 2MB.');
			input.value = '';
			return;
		}

		const supabase = page.data.supabase;
		const userId = page.data.session?.user?.id;

		if (!supabase || !userId) {
			toast.error('Silakan login terlebih dahulu sebelum upload file desain.');
			input.value = '';
			return;
		}

		isUploadingDesign = true;

		try {
			const nextPath = createDesignFilePath(userId, file.name);
			const previousPath = designFilePath.trim();

			const { error } = await supabase.storage.from(PUBLIC_BUCKET_NAME).upload(nextPath, file, {
				upsert: false,
				contentType: file.type
			});

			if (error) {
				throw error;
			}

			if (previousPath && !consumedDesignPaths.has(previousPath)) {
				await removeDesignPathsFromStorage([previousPath]);
				uploadedDesignPaths.delete(previousPath);
			}

			designFilePath = nextPath;
			uploadedDesignPaths.add(nextPath);
			clearDesignPreview();

			if (file.type.startsWith('image/')) {
				designPreviewUrl = URL.createObjectURL(file);
			}

			toast.success('File desain berhasil diupload.');
		} catch (error) {
			toast.error('Gagal upload file desain. Silakan coba lagi.');
			console.error(error);
		} finally {
			isUploadingDesign = false;
			input.value = '';
		}
	};

	const enhanceAddToCart = () => {
		return async ({
			result,
			update
		}: {
			result: { type: string; data?: unknown };
			update: () => Promise<void>;
		}) => {
			if (result.type === 'success') {
				const message =
					typeof (result.data as { text?: unknown } | undefined)?.text === 'string'
						? (result.data as { text: string }).text
						: 'Item added to cart.';

				actionFeedback = message;
				if (designFilePath.trim()) {
					consumedDesignPaths.add(designFilePath.trim());
				}
				toast.success(message);
				await update();
				return;
			}

			if (result.type === 'failure') {
				const message =
					typeof (result.data as { message?: unknown } | undefined)?.message === 'string'
						? (result.data as { message: string }).message
						: 'Failed to add item to cart.';

				actionFeedback = message;
				toast.error(message);
				return;
			}

			actionFeedback = 'Unexpected error while adding item to cart.';
			toast.error(actionFeedback);
		};
	};

	onDestroy(() => {
		const orphanPaths = Array.from(uploadedDesignPaths).filter(
			(path) => !consumedDesignPaths.has(path)
		);
		void removeDesignPathsFromStorage(orphanPaths);
		clearDesignPreview();
	});
</script>

<main class="container mx-auto px-4 py-8 lg:px-8">
	<div class="mb-6">
		<Breadcrumb.Root aria-label="Breadcrumb">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href={resolve('/')}>Home</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href={resolve('/categories')}>Categories</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link
						href={resolve('/(store)/categories/[categorySlug]', {
							categorySlug: data.category.slug
						})}
					>
						{data.category.name}
					</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>{data.product.name}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<section class="lg:col-span-4">
			<figure class="aspect-square w-full overflow-hidden rounded-md border bg-muted/20">
				<img
					class="h-full w-full object-cover"
					src={activeImage?.src}
					alt={activeImage?.alt ?? data.product.name}
				/>
			</figure>

			<div class="mt-4">
				{#if data.gallery.length > 4}
					<div class="relative">
						<Carousel
							opts={{ align: 'start', loop: false }}
							class="w-full"
							aria-label="Galeri produk"
						>
							<CarouselContent class="-ml-2">
								{#each data.gallery as image, index (`${image.src}-${index}`)}
									<CarouselItem class="basis-1/4 pl-2">
										<button
											type="button"
											onclick={() => selectThumbnail(index)}
											class={`aspect-square w-full overflow-hidden rounded-md border transition ${
												selectedImageIndex === index
													? 'border-primary ring-2 ring-primary/30'
													: 'border-border hover:border-primary/60'
											}`}
										>
											<img src={image.src} alt={image.alt} class="h-full w-full object-cover" />
										</button>
									</CarouselItem>
								{/each}
							</CarouselContent>
							<CarouselPrevious class="-left-4" />
							<CarouselNext class="-right-4" />
						</Carousel>
					</div>
				{:else}
					<div class="grid grid-cols-4 gap-3">
						{#each data.gallery as image, index (`${image.src}-${index}`)}
							<button
								type="button"
								onclick={() => selectThumbnail(index)}
								class={`aspect-square overflow-hidden rounded-md border transition ${
									selectedImageIndex === index
										? 'border-primary ring-2 ring-primary/30'
										: 'border-border hover:border-primary/60'
								}`}
							>
								<img src={image.src} alt={image.alt} class="h-full w-full object-cover" />
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<section class="lg:col-span-5">
			<div class="space-y-6">
				<div>
					<p class="text-sm text-muted-foreground">{data.category.name}</p>
					<h1 class="mt-1 text-2xl leading-tight font-semibold lg:text-3xl">
						{data.product.name} - {selectedVariant.name}
					</h1>
					<p class="mt-3 text-3xl font-bold tracking-tight">{formatCurrency(unitPrice)}</p>
				</div>

				<Separator />

				<section aria-labelledby="description-heading">
					<h2 id="description-heading" class="mb-3 text-sm font-medium">Deskripsi produk</h2>
					<p class="text-sm leading-6 text-foreground">
						{data.product.description || 'Belum ada deskripsi untuk produk ini.'}
					</p>
				</section>

				{#if data.variants.length > 0}
					<section aria-labelledby="variant-heading">
						<h2 id="variant-heading" class="mb-3 text-sm font-medium">Pilih varian</h2>
						<div class="flex flex-wrap gap-2">
							{#each data.variants as variant (variant.id)}
								<button
									type="button"
									onclick={() => selectVariant(variant.id)}
									disabled={variant.stock <= 0}
									class={`rounded-md border px-3 py-2 text-sm transition ${
										selectedVariant?.id === variant.id
											? 'border-primary bg-primary/10 text-primary'
											: variant.stock <= 0
												? 'cursor-not-allowed border-border bg-muted/40 text-muted-foreground opacity-70'
												: 'border-border hover:border-primary/50'
									}`}
								>
									{variant.name}
									{#if variant.stock <= 0}
										<span class="ml-2 text-xs text-muted-foreground">Habis</span>
									{/if}
								</button>
							{/each}
						</div>
					</section>
				{/if}

				{#if data.optionGroups.length > 0}
					{#each data.optionGroups as group (group.id)}
						<section aria-labelledby={`option-group-${group.id}`}>
							<h2 id={`option-group-${group.id}`} class="mb-3 text-sm font-medium">{group.name}</h2>
							<div class="flex flex-wrap gap-2">
								{#each group.options as option (option.id)}
									<button
										type="button"
										onclick={() => selectOption(group.id, option.id)}
										class={`rounded-md border px-3 py-2 text-sm transition ${
											selectedOptionIdsByGroup[group.id] === option.id
												? 'border-primary bg-primary/10 text-primary'
												: 'border-border hover:border-primary/50'
										}`}
									>
										<span>{option.name}</span>
										{#if option.additionalPrice > 0}
											<span class="ml-2 text-xs text-muted-foreground"
												>+ {formatCurrency(option.additionalPrice)}</span
											>
										{/if}
									</button>
								{/each}
							</div>
						</section>
					{/each}
				{/if}

				<section aria-labelledby="design-file-heading" class="space-y-3">
					<h2 id="design-file-heading" class="text-sm font-medium">Upload file desain</h2>
					<input
						id="design-file-upload"
						type="file"
						accept="image/*,application/pdf"
						class="hidden"
						bind:this={designFileInput}
						onchange={handleDesignFileChange}
					/>
					<Empty.Root class="border border-dashed">
						<Empty.Header>
							{#if designPreviewUrl}
								<div class="mx-auto h-20 w-20 overflow-hidden rounded-md border">
									<img
										src={designPreviewUrl}
										alt="Preview file desain"
										class="h-full w-full object-cover"
									/>
								</div>
							{:else}
								<Empty.Media variant="icon">
									{#if designFilePath && designFileName.toLowerCase().endsWith('.pdf')}
										<FileText />
									{:else}
										<Image />
									{/if}
								</Empty.Media>
							{/if}
							<Empty.Description>
								{#if isUploadingDesign}
									Mengunggah file desain...
								{:else if designFilePath}
									{designFileName || 'File desain sudah terlampir.'}
								{:else}
									Unggah gambar atau PDF desain Anda.
								{/if}
							</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={openDesignFilePicker}
								disabled={isUploadingDesign}
							>
								{isUploadingDesign ? 'Mengunggah...' : 'Pilih File'}
							</Button>
						</Empty.Content>
					</Empty.Root>
				</section>
			</div>
		</section>

		<aside class="lg:col-span-3" aria-label="Ringkasan pembelian">
			<form method="POST" action="?/addToCart" use:enhance={enhanceAddToCart}>
				<input type="hidden" name="variantId" value={selectedVariant?.id ?? ''} />
				<input type="hidden" name="quantity" value={quantity} />
				<input type="hidden" name="designFilePath" value={designFilePath} />
				{#each selectedOptionIds as optionId (optionId)}
					<input type="hidden" name="optionIds" value={optionId} />
				{/each}

				<Card>
					<CardHeader>
						<CardTitle>{data.product.name}</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						{#if selectedVariant}
							<div class="flex gap-3">
								<div class="max-w-12 overflow-hidden rounded-md border">
									<img
										src={selectedVariant.imgUrl}
										alt={selectedVariant.name}
										class="h-12 w-12 object-cover"
									/>
								</div>
								<div class="flex flex-col justify-center">
									<span class="text-sm font-medium">{selectedVariant.name}</span>
									<span class="text-xs text-muted-foreground"
										>{formatCurrency(selectedVariant.price)}</span
									>
								</div>
							</div>
						{/if}

						<Separator />

						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-2">
								<Button variant="outline" size="icon" type="button" onclick={decreaseQuantity}>
									<Minus />
								</Button>
								<span class="w-10 text-center text-sm font-medium">{quantity}</span>
								<Button variant="outline" size="icon" type="button" onclick={increaseQuantity}>
									<Plus />
								</Button>
							</div>
							<div class="text-right">
								<p class="text-xs text-muted-foreground">Stok</p>
								<p class="text-sm font-medium">{availableStock}</p>
							</div>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Subtotal</span>
							<span class="text-base font-semibold text-foreground">{formatCurrency(subtotal)}</span
							>
						</div>

						<p class="text-xs text-muted-foreground">
							{actionFeedback || 'Ready to add item to cart.'}
						</p>
					</CardContent>
					<CardFooter>
						<div class="flex w-full flex-col gap-2">
							<Button
								class="w-full"
								type="submit"
								disabled={!selectedVariant || availableStock <= 0}>Add to cart</Button
							>
							<Button type="button" variant="outline" class="w-full" disabled>Checkout</Button>
						</div>
					</CardFooter>
				</Card>
			</form>
		</aside>
	</div>
</main>
