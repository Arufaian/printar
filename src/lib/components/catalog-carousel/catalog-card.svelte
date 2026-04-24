<script lang="ts">
	import { Card, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { Product } from '$lib/types/product.js';

	/** Props */
	let { product }: Props = $props();

	/** Format price to currency */
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(price);
	};

	/** Props type */
	type Props = {
		product: Product;
	};
</script>

<Card
	class="relative flex h-full w-full flex-col overflow-hidden rounded-xl border-b-2 p-0 shadow-md"
>
	<Badge class="absolute top-3 left-3 z-20">New</Badge>

	<img
		src={product.image}
		alt={product.title || 'Product image'}
		class="relative aspect-square w-full object-cover"
	/>

	<CardHeader class="space-y-2 px-4 pt-4 pb-2">
		<CardTitle role="heading" aria-level={3} class="text-base leading-snug sm:text-lg"
			>{product.title}</CardTitle
		>

		<div class="flex items-center justify-between">
			<span class="text-lg font-bold text-primary sm:text-xl lg:text-2xl"
				>{formatPrice(product.price)}</span
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
