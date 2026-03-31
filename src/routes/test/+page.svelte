<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	import { Button } from '$lib/components/ui/button';

	type Product = {
		id: number;
		name: string;
		description: string;
		price: number;
		originalPrice?: number;
		rating: number;
		stock: number;
		image: string;
		label: 'Best Seller' | 'New' | 'Discount' | 'Limited' | null;
	};

	const products: Product[] = [
		{
			id: 1,
			name: 'Aerolite Running Shoes',
			description: 'Lightweight knit upper with all-day comfort cushioning.',
			price: 129,
			rating: 4.8,
			stock: 24,
			image: 'https://picsum.photos/id/21/1200/760',
			label: 'Best Seller'
		},
		{
			id: 2,
			name: 'TrailGuard Backpack 30L',
			description: 'Water-resistant daypack with modular storage pockets.',
			price: 79,
			originalPrice: 99,
			rating: 4.6,
			stock: 12,
			image: 'https://picsum.photos/id/26/900/900',
			label: 'Discount'
		},
		{
			id: 3,
			name: 'Nova Smart Bottle',
			description: 'Temperature-tracking bottle with 24-hour battery life.',
			price: 49,
			rating: 4.4,
			stock: 8,
			image: 'https://picsum.photos/id/29/900/1200',
			label: 'New'
		},
		{
			id: 4,
			name: 'Comet Wireless Earbuds',
			description: 'Noise isolation and dual-device pairing for commuting.',
			price: 89,
			rating: 4.7,
			stock: 0,
			image: 'https://picsum.photos/id/39/900/700',
			label: 'Limited'
		},
		{
			id: 5,
			name: 'Altitude Windbreaker',
			description: 'Packable shell jacket with breathable weather shield fabric.',
			price: 109,
			originalPrice: 139,
			rating: 4.5,
			stock: 16,
			image: 'https://picsum.photos/id/49/1000/700',
			label: 'Discount'
		}
	];

	const [heroProduct, compactProduct, splitProduct, editorialProduct, bannerProduct] = products;

	const badgeClassByLabel: Record<Exclude<Product['label'], null>, string> = {
		'Best Seller': 'bg-emerald-100 text-emerald-700',
		New: 'bg-sky-100 text-sky-700',
		Discount: 'bg-amber-100 text-amber-700',
		Limited: 'bg-slate-100 text-slate-700'
	};

	const currency = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
</script>

<section class="py-10 sm:py-14 lg:py-16">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
		<div class="mb-6 sm:mb-8 lg:mb-10">
			<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Product card examples</h1>
			<p class="mt-2 text-sm text-muted-foreground sm:text-base">
				Different product card compositions with mixed orientation and content hierarchy.
			</p>
		</div>

		<div class="space-y-6 lg:space-y-8">
			<Card class="overflow-hidden">
				<div class="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
					<img
						src={heroProduct.image}
						alt={heroProduct.name}
						class="h-56 w-full object-cover sm:h-72 lg:h-full"
					/>
					<div class="flex flex-col">
						<CardHeader class="space-y-3 pb-3">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">hero card</p>
									<CardTitle class="mt-2 text-2xl sm:text-3xl">{heroProduct.name}</CardTitle>
								</div>
								{#if heroProduct.label}
									<span
										class={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClassByLabel[heroProduct.label]}`}
									>
										{heroProduct.label}
									</span>
								{/if}
							</div>
							<CardDescription class="text-sm sm:text-base"
								>{heroProduct.description}</CardDescription
							>
						</CardHeader>
						<CardContent class="space-y-2 pt-0 text-sm">
							<p class="text-muted-foreground">Rating {heroProduct.rating} / 5</p>
							<div class="flex items-end gap-2">
								<span class="text-2xl font-semibold">{currency.format(heroProduct.price)}</span>
								<p class="pb-1 text-xs text-muted-foreground">Ships free this week</p>
							</div>
						</CardContent>
						<CardFooter class="mt-auto flex flex-col items-stretch gap-2 sm:flex-row">
							<Button class="sm:flex-1" disabled={heroProduct.stock === 0}>
								{heroProduct.stock === 0 ? 'Unavailable' : 'Add to cart'}
							</Button>
							<Button variant="outline" class="sm:flex-1">View details</Button>
						</CardFooter>
					</div>
				</div>
			</Card>

			<div class="grid gap-6 lg:grid-cols-3">
				<Card class="lg:col-span-1">
					<CardHeader class="pb-3">
						<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">
							compact side card
						</p>
						<CardTitle class="text-lg">{compactProduct.name}</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex items-center gap-3">
							<img
								src={compactProduct.image}
								alt={compactProduct.name}
								class="h-20 w-20 rounded-md object-cover"
							/>
							<div class="min-w-0 space-y-1 text-sm">
								<p class="line-clamp-2 text-muted-foreground">{compactProduct.description}</p>
								<p class="font-semibold">{currency.format(compactProduct.price)}</p>
								{#if compactProduct.originalPrice}
									<p class="text-xs text-muted-foreground line-through">
										{currency.format(compactProduct.originalPrice)}
									</p>
								{/if}
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<Button class="w-full" variant="secondary">Quick add</Button>
					</CardFooter>
				</Card>

				<Card class="overflow-hidden lg:col-span-2">
					<div class="grid h-full md:grid-cols-2">
						<div class="order-2 flex flex-col md:order-1">
							<CardHeader class="pb-3">
								<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">
									split image/content
								</p>
								<CardTitle class="text-xl">{splitProduct.name}</CardTitle>
								<CardDescription>{splitProduct.description}</CardDescription>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								<p>Smart hydration stats and reminders, designed for commutes and gym sessions.</p>
								<p class="font-semibold">{currency.format(splitProduct.price)}</p>
							</CardContent>
							<CardFooter class="mt-auto">
								<Button variant="outline" class="w-full">Compare plans</Button>
							</CardFooter>
						</div>
						<img
							src={splitProduct.image}
							alt={splitProduct.name}
							class="order-1 h-56 w-full object-cover md:order-2 md:h-full"
						/>
					</div>
				</Card>
			</div>

			<div class="grid gap-6 md:grid-cols-2">
				<Card class="overflow-hidden">
					<img
						src={editorialProduct.image}
						alt={editorialProduct.name}
						class="h-52 w-full object-cover"
					/>
					<CardHeader class="pb-3">
						<p class="text-xs tracking-[0.16em] text-muted-foreground uppercase">editorial card</p>
						<CardTitle class="text-xl">{editorialProduct.name}</CardTitle>
						<CardDescription>{editorialProduct.description}</CardDescription>
					</CardHeader>
					<CardContent class="space-y-2 pt-0 text-sm">
						<div class="flex items-center justify-between">
							<p>Rating {editorialProduct.rating} / 5</p>
							<p
								class={editorialProduct.stock > 0
									? 'font-medium text-emerald-700'
									: 'font-medium text-destructive'}
							>
								{editorialProduct.stock > 0
									? `${editorialProduct.stock} units available`
									: 'Out of stock'}
							</p>
						</div>
						<p class="text-muted-foreground">
							Designed with a compact charging case and low-latency audio mode.
						</p>
					</CardContent>
					<CardFooter>
						<Button class="w-full" disabled={editorialProduct.stock === 0}>
							{editorialProduct.stock === 0 ? 'Notify me' : 'Buy now'}
						</Button>
					</CardFooter>
				</Card>

				<Card class="overflow-hidden">
					<div class="relative">
						<img
							src={bannerProduct.image}
							alt={bannerProduct.name}
							class="h-52 w-full object-cover"
						/>
						<div
							class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
							aria-hidden="true"
						></div>
						<div class="absolute right-0 bottom-0 left-0 p-4 text-white">
							<p class="text-xs tracking-[0.16em] text-white/80 uppercase">feature banner</p>
							<h2 class="mt-1 text-xl font-semibold">{bannerProduct.name}</h2>
						</div>
					</div>
					<CardContent class="space-y-3 pt-4 text-sm">
						<p class="text-muted-foreground">{bannerProduct.description}</p>
						<div class="flex items-center gap-2">
							<span class="text-lg font-semibold">{currency.format(bannerProduct.price)}</span>
							{#if bannerProduct.originalPrice}
								<span class="text-muted-foreground line-through">
									{currency.format(bannerProduct.originalPrice)}
								</span>
							{/if}
						</div>
					</CardContent>
					<CardFooter class="flex items-center justify-between gap-3">
						<Button variant="secondary" class="flex-1">Save for later</Button>
						<Button class="flex-1">Checkout</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	</div>
</section>
