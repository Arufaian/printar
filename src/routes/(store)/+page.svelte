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
	<Hero
		headline="Cetak Kebutuhan Brand-mu, Lebih Cepat dan Tetap Elegan"
		description="Mulai dari kartu nama, brosur, sticker, sampai banner ukuran besar-semua diproses dengan kualitas warna tajam, material terpilih, dan hasil akhir yang rapi."
		imageAlt="Layanan percetakan digital premium untuk kebutuhan bisnis"
	/>
	<FeatureSection
		title="Kenapa banyak brand pilih kami?"
		description="Proses praktis, kualitas konsisten, dan support yang responsif-biar urusan cetak terasa simple tapi tetap berkelas."
	/>

	<CatalogCarouselSection
		title="Produk terbaru untuk kebutuhan cetakmu"
		route="/categories"
		products={data.latestProducts}
	/>
</main>
