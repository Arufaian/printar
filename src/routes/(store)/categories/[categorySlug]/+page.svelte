<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronDown, Funnel, ArrowUpDown, Star, ShoppingCart } from '@lucide/svelte/icons';

	import * as Card from '$lib/components/ui/card/index.js';

	let items = Array.from({ length: 10 });
</script>

<div class="container mx-auto px-4 py-8 lg:px-8">
	<div class="flex flex-col justify-between">
		<div class="mb-8">
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/components">Components</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>

		<div class="mb-8">
			<img class="w-full rounded-md object-cover" src="https://picsum.photos/1344/420" alt="" />
		</div>

		<div class="mb-10">
			<p class="text-sm leading-relaxed text-muted-foreground md:text-base">
				Lorem, ipsum dolor sit amet consectetur adipisicing elit. Laborum adipisci quos fuga maxime!
				Consequuntur autem, quos nulla sapiente necessitatibus perferendis tempora error eligendi
				eius ratione ducimus accusantium placeat, iusto neque.
			</p>
		</div>

		<div class="mb-8 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-baseline gap-2">
				<span class="text-sm font-semibold md:text-base">Merch</span>
				<span class="text-xs text-muted-foreground md:text-sm">(120 produk)</span>
			</div>

			<div class="flex gap-4">
				<Button variant="outline" class="px-3 py-4 text-sm sm:px-4 sm:py-5 md:py-6 md:text-base">
					<ArrowUpDown class="size-5 stroke-1" />
					<span>Urutkan</span>
					<ChevronDown class="size-5 stroke-1" /></Button
				>
				<Button variant="outline" class="px-3 py-4 text-sm sm:px-4 sm:py-5 md:py-6 md:text-base">
					<Funnel class="size-5 stroke-1" />
					<span>Filter</span>
					<ChevronDown class="size-5 stroke-1" /></Button
				>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5 lg:gap-6">
			{#each items as _, i (i)}
				<Card.Root>
					<img
						src="https://picsum.photos/265/265"
						alt="product"
						class="aspect-square w-full object-cover"
					/>

					<Card.Header class="m-0 flex flex-col items-center gap-0 p-0 py-4">
						<Card.Title
							role="heading"
							aria-level={3}
							class="text-xs leading-tight font-semibold sm:text-sm md:text-base"
							>Product Title</Card.Title
						>
					</Card.Header>

					<Card.Content class="pb-4">
						<div class="mb-2 flex justify-start">
							<span class="text-sm font-bold text-primary sm:text-base md:text-lg"
								>RP. 1{_}0.000</span
							>
						</div>
						<div class="flex justify-between">
							<div class="flex items-center gap-1">
								<Star class="size-4 fill-primary text-primary" />
								<span class="text-xs font-medium sm:text-sm md:text-base">4.5</span>
							</div>
							<span class="text-xs text-muted-foreground sm:text-sm">(120 terjual)</span>
						</div>
					</Card.Content>

					<Card.Footer>
						<Button class="w-full">
							<ShoppingCart />
							<span>Checkout</span>
						</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	</div>
</div>
