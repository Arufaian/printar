<script lang="ts">
	let { itemCount }: Props = $props();

	type Props = {
		itemCount: number;
	};
</script>

<div class="p-4 md:p-6">
	<h1 class="text-xl font-semibold md:text-2xl">Keranjang Belanja</h1>
	<p class="mt-1 text-sm text-muted-foreground">{itemCount} item di keranjang kamu</p>
</div>
