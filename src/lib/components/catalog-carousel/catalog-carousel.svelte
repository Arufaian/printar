<script lang="ts">
	import {
		Carousel,
		CarouselContent,
		CarouselItem,
		CarouselNext,
		CarouselPrevious
	} from '$lib/components/ui/carousel';
	import CatalogCard from './catalog-card.svelte';
	import type { Product } from '$lib/types/product';
	import type { EmblaOptionsType } from 'embla-carousel';

	/** Props */
	let { products, options = {}, ariaLabel = 'Product catalog carousel' }: Props = $props();

	const defaultOptions = $derived.by(
		(): EmblaOptionsType => ({
			align: 'start',
			loop: false,
			...options
		})
	);

	/** Props type */
	type Props = {
		products: Product[];
		options?: EmblaOptionsType;
		ariaLabel?: string;
	};
</script>

<div class="relative">
	<Carousel opts={defaultOptions} class="w-full" aria-label={ariaLabel}>
		<CarouselContent class="-ml-3 md:-ml-4">
			{#each products as product (product.id)}
				<CarouselItem class="basis-full p-4 pl-3 md:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4">
					<CatalogCard {product} />
				</CarouselItem>
			{/each}
		</CarouselContent>

		<CarouselPrevious size="icon-lg" class="inset-s-2 z-50 hidden cursor-pointer lg:inline-flex" />
		<CarouselNext size="icon-lg" class="inset-e-2 z-50 hidden cursor-pointer lg:inline-flex" />
	</Carousel>
</div>
