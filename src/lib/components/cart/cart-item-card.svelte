<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { formatCurrency } from '$lib/utils/string.js';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { CartItemData } from '$lib/types/cart';

	let {
		item,
		selected,
		isUploadingDesign,
		uploadingDesignItemId,
		formatItemMeta,
		onToggleSelect,
		onAttachDesign,
		getNextQuantity,
		enhanceCartAction
	}: Props = $props();

	type Props = {
		item: CartItemData;
		selected: boolean;
		isUploadingDesign: boolean;
		uploadingDesignItemId: string | null;
		formatItemMeta: (item: CartItemData) => string;
		onToggleSelect: (itemId: string, checked: boolean) => void;
		onAttachDesign: (itemId: string) => void;
		getNextQuantity: (item: CartItemData, delta: number) => number;
		enhanceCartAction: SubmitFunction;
	};
</script>

<Item.Root variant="outline">
	<Checkbox
		id={`select-${item.id}`}
		checked={selected}
		onCheckedChange={(checked) => onToggleSelect(item.id, Boolean(checked))}
	/>

	<Item.Media>
		<figure class="w-full">
			<img class="max-w-14 rounded-xl object-cover" src={item.image} alt={item.title} />
		</figure>
	</Item.Media>

	<Item.Content>
		<Item.Title>{item.title}</Item.Title>
		<Item.Description>{formatItemMeta(item)}</Item.Description>
		<Item.Description class={item.hasDesignFile ? 'text-emerald-600' : 'text-amber-600'}>
			{item.hasDesignFile ? 'File desain terlampir' : 'Belum upload file desain'}
		</Item.Description>
		<Item.Description class="mt-1 text-foreground"
			>{formatCurrency(item.unitPrice)} / item</Item.Description
		>
		<Button
			type="button"
			variant="outline"
			size="sm"
			class="mt-2 w-fit"
			onclick={() => onAttachDesign(item.id)}
			disabled={isUploadingDesign}
		>
			<Paperclip class="size-4" />
			{isUploadingDesign && uploadingDesignItemId === item.id
				? 'Mengunggah...'
				: item.hasDesignFile
					? 'Ganti file desain'
					: 'Upload file desain'}
		</Button>
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
			<p class="text-sm font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p>
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
