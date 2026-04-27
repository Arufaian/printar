<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
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
		getDesignFileUrl,
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
		getDesignFileUrl: (designFilePath: string | null) => string;
		onToggleSelect: (itemId: string, checked: boolean) => void;
		onAttachDesign: (itemId: string) => void;
		getNextQuantity: (item: CartItemData, delta: number) => number;
		enhanceCartAction: SubmitFunction;
	};

	const hasPdfDesignFile = $derived(Boolean(item.designFilePath?.toLowerCase().endsWith('.pdf')));
	const hasImageDesignFile = $derived(
		Boolean(item.designFilePath?.toLowerCase().match(/\.(png|jpe?g|webp|gif|avif|svg)$/))
	);
	const designFileUrl = $derived(getDesignFileUrl(item.designFilePath));
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

		{#if item.hasDesignFile && item.designFilePath}
			<Accordion.Root type="single" class="mt-2 w-full">
				<Accordion.Item value={`design-preview-${item.id}`} class="border-b-0">
					<Accordion.Trigger class="py-2 text-xs">Preview file desain</Accordion.Trigger>
					<Accordion.Content class="pb-0">
						{#if hasImageDesignFile && designFileUrl}
							<a
								href={designFileUrl}
								target="_blank"
								rel="external noopener noreferrer"
								class="inline-block"
							>
								<img
									src={designFileUrl}
									alt={`Preview file desain untuk ${item.title}`}
									class="h-14 w-14 rounded-xl object-cover"
								/>
							</a>
						{:else if hasPdfDesignFile}
							<div class="flex items-center">
								<Button
									href={designFileUrl}
									target="_blank"
									variant="link"
									rel="external noopener noreferrer"
									class="text-sm"
								>
									Download PDF
								</Button>
							</div>
						{:else}
							<Item.Description class="text-xs"
								>Preview belum tersedia untuk format ini.</Item.Description
							>
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		{/if}
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
