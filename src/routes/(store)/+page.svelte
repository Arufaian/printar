<script lang="ts">
	import CatalogCarouselSection from '$lib/components/catalog-carousel/catalog-carousel-section.svelte';
	import FeatureSection from '$lib/components/feature/feature-section.svelte';
	import Hero from '$lib/components/hero.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Storefront | DigitalPrint</title>
</svelte:head>

<main id="home" class="w-full">
	<Hero />
	<FeatureSection title="Kenapa memilih kami" />

	<CatalogCarouselSection
		title="Produk terbaru"
		route="/categories"
		products={data.latestProducts}
	/>
</main>
