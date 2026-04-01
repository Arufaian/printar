<script lang="ts">
	import { MoveRight } from '@lucide/svelte/icons';

	const categories = [
		{
			name: 'Banner & Spanduk',
			total_products: '2.3k+',
			image: 'https://picsum.photos/500/200?random=1'
		},
		{
			name: 'Sticker & Label',
			total_products: '1.8k+',
			image: 'https://picsum.photos/500/200?random=2'
		},
		{
			name: 'Kartu Nama',
			total_products: '950+',
			image: 'https://picsum.photos/500/200?random=3'
		},
		{
			name: 'Brosur & Flyer',
			total_products: '1.5k+',
			image: 'https://picsum.photos/500/200?random=4'
		},
		{
			name: 'Poster & A3+',
			total_products: '870+',
			image: 'https://picsum.photos/500/200?random=5'
		},
		{
			name: 'Undangan & Kartu Ucapan',
			total_products: '1.1k+',
			image: 'https://picsum.photos/500/200?random=6'
		},
		{
			name: 'Merchandise Custom',
			total_products: '2.1k+',
			image: 'https://picsum.photos/500/200?random=7'
		},
		{
			name: 'Cutting Sticker',
			total_products: '760+',
			image: 'https://picsum.photos/500/200?random=8'
		},
		{
			name: 'Print Kanvas & Art Paper',
			total_products: '640+',
			image: 'https://picsum.photos/500/200?random=9'
		},
		{
			name: 'Backdrop & Booth Display',
			total_products: '520+',
			image: 'https://picsum.photos/500/200?random=10'
		}
	];
</script>

<svelte:head>
	<title>Categories</title>
</svelte:head>

<section class="mx-auto w-full">
	<div class="container mx-auto px-4 py-8 lg:px-8">
		<!-- Category Header -->
		<div class="mb-8 flex flex-col items-end justify-between gap-4 md:flex-row lg:mb-10">
			<div class="flex flex-col gap-1">
				<h2 class="text-4xl font-bold">List Categories</h2>
				<p class="text-sm font-normal text-muted-foreground lg:text-base">
					Browse our diverse collection of premium products.
				</p>
			</div>
		</div>

		<!-- Category Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each categories as category (category.name)}
				<div
					class="group relative flex h-56 cursor-pointer flex-col justify-end overflow-hidden rounded-xl"
				>
					<div class="absolute inset-0">
						<img
							alt={category.name}
							class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
							src={category.image}
						/>
					</div>
					<div
						class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"
					></div>
					<div class="relative bottom-0 left-0 flex w-full items-end justify-between gap-4 p-6">
						<div class="shrink-0">
							<h3 class="text-2xl font-semibold text-zinc-100">{category.name}</h3>
							<p class="text-sm font-medium text-white/90">{category.total_products} Produk</p>
						</div>
						<div
							class="flex h-8 w-8 translate-y-4 items-center justify-center rounded-full bg-white text-black opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
						>
							<MoveRight class="size-4" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
