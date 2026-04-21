<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { ProductPayload } from './types';

	let { form = $bindable() }: { form: ProductPayload } = $props();
</script>

<section class="rounded-lg border bg-card p-4 sm:p-6">
	<h2 class="text-lg font-semibold">Basic Information</h2>
	<p class="mt-1 text-sm text-muted-foreground">Data utama produk yang tampil di katalog.</p>
	<div class="mt-5 space-y-4">
		<div class="space-y-4">
			<Label for="product-name">Nama Produk</Label>
			<Input id="product-name" bind:value={form.name} placeholder="Kemeja Flanel Kotak" />
		</div>

		<div class="space-y-4">
			<Label for="product-category-id">Category</Label>
			<Select.Root type="single">
				<Select.Trigger class="w-full" />
				<Select.Content>
					<Select.Item value="light">Light</Select.Item>
					<Select.Item value="dark">Dark</Select.Item>
					<Select.Item value="system">System</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<div class="space-y-4">
			<Label for="product-description">Deskripsi</Label>
			<Textarea
				class="h-48"
				id="product-description"
				rows={7}
				bind:value={form.description}
				placeholder="Kemeja flanel bahan premium, nyaman dipakai seharian."
			/>
		</div>
	</div>
</section>
