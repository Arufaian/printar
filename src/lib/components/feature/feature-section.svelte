<script lang="ts">
	import FeatureCard from './feature-card.svelte';
	import type { Feature } from '$lib/types/feature';

	import { ZapIcon, ShieldIcon, RocketIcon } from '@lucide/svelte/icons';

	const features: Feature[] = [
		{
			icon: ZapIcon,
			title: 'Lightning Fast',
			description: 'Built with performance in mind.'
		},
		{
			icon: ShieldIcon,
			title: 'Secure by Default',
			description:
				'Enterprise-grade security features to keep your data safe and protected at all times.'
		},
		{
			icon: RocketIcon,
			title: 'Easy to Deploy',
			description:
				'Deploy your application in minutes with our streamlined deployment process and tools.'
		}
	];

	/** Props */
	let { title, description }: Props = $props();

	/** Component props type */
	type Props = {
		/** Array of features to display */
		/** Optional section title */
		title?: string;
		/** Optional section description */
		description?: string;
	};
</script>

<section class="w-full">
	<div class="container mx-auto px-4 py-16 lg:px-8">
		<!-- Section Header (optional) -->
		{#if title || description}
			<div class="mb-12 text-center">
				{#if title}
					<h2 class="mb-4 text-3xl font-bold tracking-tight">{title}</h2>
				{/if}
				{#if description}
					<p class="mx-auto max-w-2xl text-muted-foreground">{description}</p>
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
