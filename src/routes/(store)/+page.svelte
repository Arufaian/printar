<script lang="ts">
	import CatalogCarouselSection from '$lib/components/catalog-carousel/catalog-carousel-section.svelte';
	import FeatureSection from '$lib/components/feature/feature-section.svelte';
	import Hero from '$lib/components/hero.svelte';
	import { products } from '$lib/mockup-data/product';
</script>

<main class="mx-auto lg:max-w-11/12">
	<Hero />
	<FeatureSection title="Kenapa memilih kami" />

	<CatalogCarouselSection title="Featured Products" route="test" {products} />
</main>
