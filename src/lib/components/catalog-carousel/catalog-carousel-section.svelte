<script lang="ts">
	import CatalogCarousel from './catalog-carousel.svelte';
	import type { Product, ProductCardEvents } from '$lib/types/product';
	import type { EmblaOptionsType } from 'embla-carousel';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	/** Props */
	let { title, route, products, onAddToCart, onViewDetails, carouselOptions }: Props = $props();

	/** Props type */
	type Props = {
		title?: string;
		route?: Pathname;
		products: Product[];
		carouselOptions?: EmblaOptionsType;
	} & ProductCardEvents;
</script>

<section class="px-4 py-12 md:py-16 lg:py-20">
	<div class="container mx-auto">
		{#if title || route}
			<div class="mb-8 flex justify-between md:mb-12">
				{#if title}
					<h2 class="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
				{/if}
				{#if route}
					<a
						class="text-3xl underline transition hover:text-primary md:text-4xl"
						href={resolve(route)}>selengkapnya</a
					>
				{/if}
			</div>
		{/if}

		<CatalogCarousel {products} {onAddToCart} {onViewDetails} options={carouselOptions} />
	</div>
</section>
