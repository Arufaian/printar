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

<section
	id="catalog-carousel"
	class="px-4 py-12 md:py-16 lg:py-20"
	aria-labelledby={title ? headingId : undefined}
>
	<div class="container mx-auto">
		{#if title || route}
			<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-12">
				{#if title}
					<h2 id={headingId} class="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
						{title}
					</h2>
				{/if}
				{#if route}
					<a
						class="text-sm font-medium underline transition hover:text-primary sm:text-base md:text-lg"
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
