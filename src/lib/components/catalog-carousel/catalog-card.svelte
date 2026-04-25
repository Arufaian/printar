<script lang="ts">
	import { Card, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { Product } from '$lib/types/product.js';
	import { formatCurrency } from '$lib/utils/string.js';

	/** Props */
	let { product, isNew = true }: Props = $props();

	/** Props type */
	type Props = {
		product: Product;
		isNew?: boolean;
	};
</script>

<Card
	class="group relative flex h-full w-full flex-col overflow-hidden rounded-xl  p-0 shadow-md transition-all duration-300 ease-out hover:ring hover:ring-primary"
>
	{#if isNew}
		<Badge class="absolute top-3 left-3 z-20">New</Badge>
	{/if}

	<img
		src={product.image}
		alt={product.title || 'Product image'}
		class="relative aspect-square w-full object-cover transition duration-500 ease-out group-hover:brightness-105 group-hover:saturate-110"
	/>

	<CardHeader class="space-y-2 px-4 pt-4 pb-2">
		<CardTitle
			role="heading"
			aria-level={3}
			class="text-base leading-snug transition-colors duration-300 group-hover:text-primary sm:text-lg"
		>
			{product.title}</CardTitle
		>

		<div class="flex items-center justify-between">
			<span
				class="text-lg font-bold text-primary transition-transform duration-300 sm:text-xl lg:text-2xl"
				>{formatCurrency(product.price)}</span
			>
		</div>

		<CardDescription class="text-sm leading-relaxed sm:text-base">
			<span
				class="[display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
			>
				{product.description}
			</span>
		</CardDescription>
	</CardHeader>
</Card>
