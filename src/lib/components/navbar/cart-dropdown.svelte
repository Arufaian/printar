<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Badge } from '$lib/components/ui/badge';
	import { TrashIcon, ShoppingBagIcon } from '@lucide/svelte';

	// VARIABLES
	let { isOpen = $bindable(false), itemCount = $bindable(0) }: Props = $props();

	let cartItems = $state([
		{
			id: 1,
			name: 'Business Cards (500pcs)',
			price: 49.99,
			quantity: 1,
			image:
				'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80'
		},
		{
			id: 2,
			name: 'A4 Flyers (100pcs)',
			price: 29.99,
			quantity: 2,
			image:
				'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80'
		},
		{
			id: 3,
			name: 'Banner 3x6ft',
			price: 89.99,
			quantity: 1,
			image:
				'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=300&q=80'
		}
	]);

	const total = $derived(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0));

	const removeItem = (id: number) => {
		cartItems = cartItems.filter((item) => item.id !== id);
		itemCount = cartItems.length;
	};

	const closeDropdown = () => (isOpen = false);

	/** Props type */
	type Props = {
		isOpen: boolean;
		itemCount: number;
	};
</script>

{#if isOpen}
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-40"
		onclick={closeDropdown}
		aria-label="Close cart dropdown"
		transition:fade={{ duration: 150 }}
	></button>

	<!-- Dropdown Panel -->
	<div
		class="shadow-lg-xl absolute top-12 right-0 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-lg border bg-card"
		transition:fly={{ y: -10, duration: 200 }}
	>
		<div class="flex max-h-[80vh] flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between border-b px-4 py-3">
				<h3 class="font-semibold">Shopping Cart</h3>
				<Badge variant="secondary">{itemCount} {itemCount === 1 ? 'item' : 'items'}</Badge>
			</div>

			<!-- Cart Items -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if cartItems.length === 0}
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<ShoppingBagIcon class="mb-2 size-12 text-muted-foreground" />
						<p class="text-sm text-muted-foreground">Your cart is empty</p>
					</div>
				{:else}
					<div class="flex flex-col gap-4">
						{#each cartItems as item (item.id)}
							<div class="flex gap-3">
								<img
									src={item.image}
									alt={item.name}
									class="size-16 rounded-md border object-cover"
								/>
								<div class="min-w-0 flex-1">
									<h4 class="truncate text-sm font-medium">{item.name}</h4>
									<p class="text-sm text-muted-foreground">Qty: {item.quantity}</p>
									<p class="text-sm font-semibold text-primary">${item.price.toFixed(2)}</p>
								</div>
								<Button
									size="icon"
									variant="ghost"
									class="size-8 shrink-0 text-destructive hover:text-destructive"
									onclick={() => removeItem(item.id)}
								>
									<TrashIcon class="size-4" />
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			{#if cartItems.length > 0}
				<!-- Footer -->
				<div class="space-y-3 border-t p-4">
					<div class="flex items-center justify-between">
						<span class="font-semibold">Total:</span>
						<span class="text-lg font-bold text-primary">${total.toFixed(2)}</span>
					</div>
					<Separator />
					<div class="flex gap-2">
						<Button variant="outline" class="flex-1" onclick={closeDropdown}
							>Continue Shopping</Button
						>
						<Button class="flex-1" onclick={closeDropdown}>Checkout</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
