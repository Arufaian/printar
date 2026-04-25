<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowUpDown, ChevronDown, Funnel } from '@lucide/svelte/icons';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import CatalogCard from '$lib/components/catalog-carousel/catalog-card.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="container mx-auto px-4 py-8 lg:px-8">
	<div class="flex flex-col justify-between">
		<div class="mb-6">
			<Breadcrumb.Root aria-label="Breadcrumb">
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href={resolve('/')}>Home</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Link href={resolve('/categories')}>Categories</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Page>{data.category.name}</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>

		<div class="mb-8">
			<img
				class="w-full rounded-md object-cover"
				src={`https://picsum.photos/seed/category-banner-${encodeURIComponent(data.category.slug)}/1344/420`}
				alt={data.category.name}
			/>
		</div>

		<div class="mb-8 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-baseline gap-2">
				<span class="text-sm font-semibold md:text-base">{data.category.name}</span>
				<span class="text-xs text-muted-foreground md:text-sm">
					({new Intl.NumberFormat('id-ID').format(data.products.length)} produk)
				</span>
			</div>

			<div class="flex gap-4">
				<Button variant="outline" class="px-3 py-4 text-sm sm:px-4 sm:py-5 md:py-6 md:text-base">
					<ArrowUpDown class="size-5 stroke-1" />
					<span>Urutkan</span>
					<ChevronDown class="size-5 stroke-1" />
				</Button>
				<Button variant="outline" class="px-3 py-4 text-sm sm:px-4 sm:py-5 md:py-6 md:text-base">
					<Funnel class="size-5 stroke-1" />
					<span>Filter</span>
					<ChevronDown class="size-5 stroke-1" />
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5 lg:gap-6">
			{#each data.products as product (product.id)}
				<a
					href={resolve('/(store)/categories/[categorySlug]/[productSlug]', {
						categorySlug: data.category.slug,
						productSlug: product.slug
					})}
					class="block h-full"
				>
					<CatalogCard {product} isNew={false} />
				</a>
			{/each}
		</div>
	</div>
</div>
