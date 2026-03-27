<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ShoppingCartIcon, StarIcon } from '@lucide/svelte/icons';
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

<Card class="relative mx-auto w-full max-w-xs p-0 pb-4">
	<Badge class="absolute top-2 left-2 z-20">New</Badge>

	<img
		src={product.image}
		alt={product.title || 'Product image'}
		class="relative aspect-square object-cover"
	/>

	<CardHeader>
		<CardTitle role="heading" aria-level={3} class="text-base sm:text-lg">{product.title}</CardTitle
		>
		<CardDescription>
			<span class="text-sm sm:text-base">{product.description}</span>
		</CardDescription>
	</CardHeader>

	<CardContent>
		<div class="flex items-center justify-between">
			<span class="text-lg font-bold text-primary sm:text-xl lg:text-2xl"
				>{formatPrice(product.price)}</span
			>
			{#if product.rating}
				<div class="flex items-center gap-1">
					<StarIcon class="size-4 fill-primary text-primary" />
					<span class="text-sm font-medium sm:text-base">{product.rating.toFixed(1)}</span>
				</div>
			{/if}
		</div>
	</CardContent>

	<CardFooter>
		<div class="flex w-full gap-2">
			<Button class="flex-1">
				<ShoppingCartIcon />
				<span>Checkout</span>
			</Button>

			<Button class="flex-1 " variant="outline">detail</Button>
		</div>
	</CardFooter>
</Card>
