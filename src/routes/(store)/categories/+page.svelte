<script lang="ts">
	import { MoveRight } from '@lucide/svelte/icons';
	import { resolve } from '$app/paths';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const formatProductCount = (totalProducts: number) => {
		return `${new Intl.NumberFormat('id-ID').format(totalProducts)} Produk`;
	};
</script>

<svelte:head>
	<title>Categories</title>
</svelte:head>

<section class="mx-auto w-full">
	<div class="container mx-auto px-4 py-8 lg:px-8">
		<div class="mb-6">
			<Breadcrumb.Root aria-label="Breadcrumb">
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href={resolve('/')}>Home</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Page>Categories</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>

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
		{#if data.categories.length === 0}
			<div class="rounded-xl border border-dashed p-10 text-center">
				<h3 class="text-xl font-semibold">Belum ada kategori tersedia</h3>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.categories as category (category.slug)}
					<a
						href={resolve(`/categories/${category.slug}`)}
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
								<p class="text-sm font-medium text-white/90">
									{formatProductCount(category.totalProducts)}
								</p>
							</div>
							<div
								class="flex h-8 w-8 translate-y-4 items-center justify-center rounded-full bg-white text-black opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
							>
								<MoveRight class="size-4" />
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>
