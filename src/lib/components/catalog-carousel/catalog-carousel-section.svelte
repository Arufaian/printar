<script lang="ts">
	import CatalogCarousel from './catalog-carousel.svelte';
	import type { Product } from '$lib/types/product';
	import type { EmblaOptionsType } from 'embla-carousel';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	/** Props */
	let { title, route, products, carouselOptions }: Props = $props();

	const headingId = $derived(
		title
			? `catalog-carousel-${title
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/(^-|-$)/g, '')}-heading`
			: undefined
	);

	/** Props type */
	type Props = {
		title?: string;
		route?: Pathname;
		products: Product[];
		carouselOptions?: EmblaOptionsType;
	};
</script>

<section id="catalog-carousel" class="w-full" aria-labelledby={title ? headingId : undefined}>
	<div class="container mx-auto px-4 py-16 lg:px-8">
		{#if title || route}
			<div class="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				{#if title}
					<h2 id={headingId} class="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
						{title}
					</h2>
				{/if}
				{#if route}
					<a
						class="text-sm font-medium underline underline-offset-4 transition hover:text-primary sm:text-base md:text-lg"
						aria-label={title ? `Lihat semua produk untuk ${title}` : 'Lihat semua produk'}
						href={resolve(route)}>selengkapnya</a
					>
				{/if}
			</div>
		{/if}

		<CatalogCarousel
			{products}
			options={carouselOptions}
			ariaLabel={title ? `Carousel produk ${title}` : 'Product catalog carousel'}
		/>
	</div>
</section>
