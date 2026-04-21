<script lang="ts">
	import { Image } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { ProductVariant } from './types';

	let {
		variant = $bindable(),
		index,
		canRemove,
		onRemove
	}: {
		variant: ProductVariant;
		index: number;
		canRemove: boolean;
		onRemove: () => void;
	} = $props();
</script>

<div class="rounded-md border p-4">
	<div class="mb-4 flex items-center justify-between gap-3">
		<h3 class="text-sm font-medium">Variant #{index + 1}</h3>
		<Button type="button" variant="ghost" disabled={!canRemove} onclick={onRemove}>Remove</Button>
	</div>
	<div class="grid gap-4 md:grid-cols-2">
		<div class="col-span-2">
			<Empty.Root class="border border-dashed">
				<Empty.Header>
					<Empty.Media variant="icon">
						<Image />
					</Empty.Media>
					<Empty.Title>Image empty</Empty.Title>
					<Empty.Description>Upload variant image.</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button variant="outline" size="sm">Upload</Button>
				</Empty.Content>
			</Empty.Root>
		</div>

		<div class="space-y-4 md:col-span-2">
			<Label for={'variant-name-' + index}>Nama Variant</Label>
			<Input id={'variant-name-' + index} bind:value={variant.name} placeholder="Merah - M" />
		</div>
		<div class="space-y-4">
			<Label for={'variant-price-' + index}>Harga</Label>
			<Input id={'variant-price-' + index} type="number" min={0} bind:value={variant.price} />
		</div>
		<div class="space-y-4">
			<Label for={'variant-stock-' + index}>Stok</Label>
			<Input id={'variant-stock-' + index} type="number" min={0} bind:value={variant.stock} />
		</div>
		<div class="space-y-4 md:col-span-2">
			<Label for={'variant-img-' + index}>Image URL (hasil upload)</Label>
			<Input
				id={'variant-img-' + index}
				type="url"
				bind:value={variant.img_url}
				placeholder="https://storage.yoursite.com/images/flanel-merah.jpg"
			/>
		</div>
	</div>
</div>
