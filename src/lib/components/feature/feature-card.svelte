<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import type { Feature } from '$lib/types/feature';

	/** Props */
	let { feature }: { feature: Feature } = $props();
</script>

<Card
	class="group hover:shadow-lg-lg relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-2 hover:border-primary/50"
>
	<CardContent class="flex flex-col items-center justify-center gap-4 p-6 text-center">
		<!-- Icon -->
		<div
			class="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20"
		>
			<feature.icon class="size-6" />
		</div>

		<!-- Title -->
		<h3 class="text-base leading-tight font-semibold sm:text-lg">{feature.title}</h3>

		<!-- Description -->
		<p class="text-sm leading-relaxed text-muted-foreground sm:text-base">{feature.description}</p>
	</CardContent>
</Card>
