<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { formatIDR } from '$lib/utils/currency';

	let {
		variantCount,
		lowestPrice,
		totalStock,
		submitting
	}: {
		variantCount: number;
		lowestPrice: number | null;
		totalStock: number;
		submitting: boolean;
	} = $props();
</script>

<aside class="space-y-4 lg:col-span-1">
	<div class="flex flex-col gap-3 rounded-lg border bg-card p-3">
		<Button type="button" class="w-full" variant="outline">Save Draft</Button>
		<Button type="submit" class="w-full" disabled={submitting}>Publish</Button>
	</div>
	<div class="rounded-lg border bg-card p-4">
		<h2 class="mb-3 text-sm font-semibold">Ringkasan Produk</h2>
		<div class="space-y-4 text-sm">
			<div class="flex items-center justify-between">
				<span class="text-muted-foreground">Jumlah variant</span>
				<span class="font-medium">{variantCount}</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-muted-foreground">Lowest price</span>
				<span class="font-medium">{lowestPrice === null ? '-' : formatIDR(lowestPrice)}</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-muted-foreground">Total stok</span>
				<span class="font-medium">{totalStock}</span>
			</div>
		</div>
	</div>
</aside>
