<script lang="ts">
	import { resolve } from '$app/paths';
	import { Minus, Plus } from '@lucide/svelte/icons';
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
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let selectedVariantId = $state<string | null>(null);
	let selectedImageIndex = $state(0);
	let quantity = $state(1);
	let selectedOptionIdsByGroup = $state<Record<string, string>>({});
	let hasInitializedSelections = $state(false);

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

	const selectVariant = (variantId: string) => {
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
			quantity += 1;
			return;
		}

		quantity = Math.min(availableStock, quantity + 1);
	};
</script>

<main class="container mx-auto px-4 py-8 lg:px-8">
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

				{#if data.variants.length > 0}
					<section aria-labelledby="variant-heading">
						<h2 id="variant-heading" class="mb-3 text-sm font-medium">Pilih varian</h2>
						<div class="flex flex-wrap gap-2">
							{#each data.variants as variant (variant.id)}
								<button
									type="button"
									onclick={() => selectVariant(variant.id)}
									class={`rounded-md border px-3 py-2 text-sm transition ${
										selectedVariant?.id === variant.id
											? 'border-primary bg-primary/10 text-primary'
											: 'border-border hover:border-primary/50'
									}`}
								>
									{variant.name}
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

				<section aria-labelledby="description-heading">
					<h2 id="description-heading" class="mb-3 text-sm font-medium">Deskripsi produk</h2>
					<p class="text-sm leading-6 text-foreground">
						{data.product.description || 'Belum ada deskripsi untuk produk ini.'}
					</p>
				</section>
			</div>
		</section>

		<aside class="lg:col-span-3" aria-label="Ringkasan pembelian">
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
						<span class="text-base font-semibold text-foreground">{formatCurrency(subtotal)}</span>
					</div>
				</CardContent>
				<CardFooter>
					<div class="flex w-full flex-col gap-2">
						<Button class="w-full">Checkout</Button>
						<Button variant="outline" class="w-full" href={resolve('/categories')}
							>Kembali belanja</Button
						>
					</div>
				</CardFooter>
			</Card>
		</aside>
	</div>
</main>
