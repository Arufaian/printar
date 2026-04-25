<script lang="ts">
	import FeatureCard from './feature-card.svelte';
	import type { Feature } from '$lib/types/feature';

	import { ZapIcon, ShieldIcon, RocketIcon } from '@lucide/svelte/icons';

	const features: Feature[] = [
		{
			icon: ZapIcon,
			title: 'Proses Cepat, Tetap Presisi',
			description:
				'Order diproses efisien tanpa mengorbankan detail, jadi campaign kamu bisa jalan tepat waktu.'
		},
		{
			icon: ShieldIcon,
			title: 'Kualitas Cetak Premium',
			description:
				'Warna akurat, hasil tajam, dan finishing rapi untuk tampilan brand yang lebih profesional.'
		},
		{
			icon: RocketIcon,
			title: 'Mudah Dipesan, Nyaman Dipantau',
			description:
				'Dari pilih produk sampai finalisasi, alurnya simpel dan tim kami siap bantu kapan pun dibutuhkan.'
		}
	];

	/** Props */
	let { title, description }: Props = $props();

	const headingId = $derived(
		title
			? `feature-section-${title
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/(^-|-$)/g, '')}-heading`
			: undefined
	);

	/** Component props type */
	type Props = {
		/** Array of features to display */
		/** Optional section title */
		title?: string;
		/** Optional section description */
		description?: string;
	};
</script>

<section id="categories" class="w-full" aria-labelledby={title ? headingId : undefined}>
	<div class="container mx-auto px-4 py-16 lg:px-8">
		<!-- Section Header (optional) -->
		{#if title || description}
			<div class="mb-12 text-center">
				{#if title}
					<h2 id={headingId} class="mb-4 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
						{title}
					</h2>
				{/if}
				{#if description}
					<p class="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
				{/if}
			</div>
		{/if}

		<!-- Features Grid -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			{#each features as feature (feature.title)}
				<FeatureCard {feature} />
			{/each}
		</div>
	</div>
</section>
