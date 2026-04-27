<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { formatCurrency } from '$lib/utils/string.js';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { CartItemData } from '$lib/types/cart';
	import type { PageProps } from './$types';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();

	let cartItems = $state<CartItemData[]>([]);

	let selectedItemIds = $state<string[]>([]);
	let shippingCost = $state(0);

	$effect(() => {
		const nextItems: CartItemData[] = data.cartItems;
		cartItems = [...nextItems];
		shippingCost = data.summary.shippingCost;
		selectedItemIds = nextItems.map((item) => item.id);
	});

	const formatItemMeta = (item: CartItemData) => {
		if (item.options.length === 0) return item.variant;
		return `${item.variant} • ${item.options.join(', ')}`;
	};

	const isAllSelected = $derived(
		cartItems.length > 0 && cartItems.every((item) => selectedItemIds.includes(item.id))
	);

	const selectedItems = $derived(cartItems.filter((item) => selectedItemIds.includes(item.id)));
	const selectedCount = $derived(selectedItems.length);
	const selectedSubtotal = $derived(
		selectedItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
	);
	const grandTotal = $derived(selectedSubtotal + (selectedCount > 0 ? shippingCost : 0));

	const toggleSelectAll = (checked: boolean) => {
		selectedItemIds = checked ? cartItems.map((item) => item.id) : [];
	};

	const toggleSelectItem = (itemId: string, checked: boolean) => {
		if (checked) {
			if (!selectedItemIds.includes(itemId)) {
				selectedItemIds = [...selectedItemIds, itemId];
			}
			return;
		}

		selectedItemIds = selectedItemIds.filter((id) => id !== itemId);
	};

	const getNextQuantity = (item: CartItemData, delta: number) => {
		const rawNext = item.quantity + delta;
		const upperBound = item.stock > 0 ? item.stock : Number.MAX_SAFE_INTEGER;
		return Math.max(1, Math.min(rawNext, upperBound));
	};

	const enhanceCartAction = () => {
		return async ({
			result,
			update
		}: {
			result: { type: string; data?: unknown };
			update: () => Promise<void>;
		}) => {
			if (result.type === 'success') {
				const message =
					typeof (result.data as { text?: unknown } | undefined)?.text === 'string'
						? (result.data as { text: string }).text
						: 'Keranjang berhasil diperbarui.';

				toast.success(message);
				await update();
				return;
			}

			if (result.type === 'failure') {
				const message =
					typeof (result.data as { message?: unknown } | undefined)?.message === 'string'
						? (result.data as { message: string }).message
						: 'Gagal memperbarui keranjang. Silakan coba lagi.';

				toast.error(message);
				return;
			}

			toast.error('Terjadi kendala saat memperbarui keranjang. Silakan coba lagi.');
		};
	};
</script>

<div class="container mx-auto px-4 py-8 lg:px-8">
	{#if cartItems.length === 0}
		<div class="mx-auto max-w-xl rounded-xl border border-dashed bg-card p-10 text-center">
			<h1 class="text-2xl font-semibold">Keranjang kamu masih kosong</h1>
			<p class="mt-3 text-sm text-muted-foreground">
				Belum ada produk di keranjangmu. Yuk pilih produk favoritmu dari kategori yang tersedia.
			</p>
			<Button class="mt-6" href={resolve('/categories')}>Lanjut Belanja</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
			<div class="rounded-xl bg-card shadow lg:col-span-8">
				<div class="p-4 md:p-6">
					<h1 class="text-xl font-semibold md:text-2xl">Keranjang Belanja</h1>
					<p class="mt-1 text-sm text-muted-foreground">
						{cartItems.length} item di keranjang kamu
					</p>
				</div>

				<Separator />

				<div class="flex items-center gap-2 p-4 md:px-6">
					<Checkbox
						id="select-all-cart-items"
						checked={isAllSelected}
						onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
					/>
					<Label for="select-all-cart-items">Pilih Semua</Label>
				</div>

				<Separator />

				<div class="space-y-3 p-4 md:p-6">
					{#each cartItems as item (item.id)}
						<Item.Root variant="outline">
							<Checkbox
								id={`select-${item.id}`}
								checked={selectedItemIds.includes(item.id)}
								onCheckedChange={(checked) => toggleSelectItem(item.id, Boolean(checked))}
							/>

							<Item.Media>
								<figure class="w-full">
									<img class="max-w-14 rounded-xl object-cover" src={item.image} alt={item.title} />
								</figure>
							</Item.Media>

							<Item.Content>
								<Item.Title>{item.title}</Item.Title>
								<Item.Description>{formatItemMeta(item)}</Item.Description>
								<Item.Description
									class={item.hasDesignFile ? 'text-emerald-600' : 'text-amber-600'}
								>
									{item.hasDesignFile ? 'File desain terlampir' : 'Belum upload file desain'}
								</Item.Description>
								<Item.Description class="mt-1 text-foreground">
									{formatCurrency(item.unitPrice)} / item
								</Item.Description>
							</Item.Content>

							<Item.Actions class="items-center gap-2">
								<div class="flex items-center gap-1">
									<form method="POST" action="?/updateQuantity" use:enhance={enhanceCartAction}>
										<input type="hidden" name="itemId" value={item.id} />
										<input type="hidden" name="quantity" value={getNextQuantity(item, -1)} />
										<Button
											type="submit"
											size="icon-sm"
											variant="outline"
											aria-label={`Decrease quantity for ${item.title}`}
											disabled={item.quantity <= 1}
										>
											<Minus />
										</Button>
									</form>
									<span class="w-8 text-center text-sm font-medium">{item.quantity}</span>
									<form method="POST" action="?/updateQuantity" use:enhance={enhanceCartAction}>
										<input type="hidden" name="itemId" value={item.id} />
										<input type="hidden" name="quantity" value={getNextQuantity(item, 1)} />
										<Button
											type="submit"
											size="icon-sm"
											variant="outline"
											aria-label={`Increase quantity for ${item.title}`}
											disabled={item.stock > 0 && item.quantity >= item.stock}
										>
											<Plus />
										</Button>
									</form>
								</div>
								<div class="min-w-28 text-right">
									<p class="text-sm font-semibold">
										{formatCurrency(item.unitPrice * item.quantity)}
									</p>
									<p class="text-xs text-muted-foreground">Stok: {item.stock}</p>
								</div>
								<form method="POST" action="?/removeItem" use:enhance={enhanceCartAction}>
									<input type="hidden" name="itemId" value={item.id} />
									<Button
										type="submit"
										size="icon-sm"
										variant="ghost"
										aria-label={`Remove ${item.title} from cart`}
									>
										<Trash2 />
									</Button>
								</form>
							</Item.Actions>
						</Item.Root>
					{/each}
				</div>
			</div>

			<aside
				class="rounded-xl bg-card p-4 shadow lg:sticky lg:top-24 lg:col-span-4 lg:h-fit lg:p-6"
			>
				<h2 class="text-lg font-semibold">Ringkasan Belanja</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{selectedCount} item{selectedCount > 1 ? 's' : ''} selected
				</p>

				<div class="mt-5 space-y-3 text-sm">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Subtotal</span>
						<span>{formatCurrency(selectedSubtotal)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Ongkir</span>
						<span>{selectedCount > 0 ? formatCurrency(shippingCost) : formatCurrency(0)}</span>
					</div>
				</div>

				<Separator class="my-4" />

				<div class="flex items-center justify-between">
					<span class="font-medium">Total</span>
					<span class="text-lg font-semibold">{formatCurrency(grandTotal)}</span>
				</div>

				<Button class="mt-5 w-full" disabled={selectedCount === 0}>Lanjut ke Checkout</Button>
				<Button variant="outline" class="mt-2 w-full" href={resolve('/categories')}
					>Lanjut Belanja</Button
				>
			</aside>
		</div>
	{/if}
</div>
