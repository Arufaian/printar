<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	let { categoriesHref }: Props = $props();

	type Props = {
		categoriesHref: string;
	};
</script>

<div class="mx-auto max-w-xl rounded-xl border border-dashed bg-card p-10 text-center">
	<h1 class="text-2xl font-semibold">Keranjang kamu masih kosong</h1>
	<p class="mt-3 text-sm text-muted-foreground">
		Belum ada produk di keranjangmu. Yuk pilih produk favoritmu dari kategori yang tersedia.
	</p>
	<Button class="mt-6" href={categoriesHref}>Lanjut Belanja</Button>
</div>
