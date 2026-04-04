<script>
	import Breadcrumb from '$lib/components/ui/breadcrumb/breadcrumb.svelte';
	import BreadcrumbList from '$lib/components/ui/breadcrumb/breadcrumb-list.svelte';
	import BreadcrumbItem from '$lib/components/ui/breadcrumb/breadcrumb-item.svelte';
	import BreadcrumbSeparator from '$lib/components/ui/breadcrumb/breadcrumb-separator.svelte';
	import BreadcrumbLink from '$lib/components/ui/breadcrumb/breadcrumb-link.svelte';

	import Separator from '$lib/components/ui/separator/separator.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	import Card from '$lib/components/ui/card/card.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardFooter from '$lib/components/ui/card/card-footer.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';

	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';

	import RadioGroup from '$lib/components/ui/radio-group/radio-group.svelte';
	import RadioGroupItem from '$lib/components/ui/radio-group/radio-group-item.svelte';
	import { Plus, Minus, Star } from '@lucide/svelte/icons';
</script>

<main class="container mx-auto px-4 py-8 lg:px-8">
	<div class="flex flex-col">
		<div class="mb-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">Home</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/components">Components</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<span class="text-sm text-primary md:text-base">Breadcrumb</span>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		</div>

		<div class="mb-6">
			<Separator />
		</div>

		<div class="mb-6">
			<div class="grid grid-cols-12 gap-8">
				<!-- Product Image -->
				<div class="col-span-4 border border-green-500">
					<div class="flex flex-col">
						<figure class="aspect-square w-full">
							<img
								class="w-full rounded-md object-cover"
								src="https://picsum.photos/700/700"
								alt="Product Name - gambar utama"
							/>
						</figure>
						<div class="flex">
							<button type="button" aria-label="Lihat gambar produk 1" class="max-w-24 p-2">
								<img
									class="w-full rounded-md object-cover"
									src="https://picsum.photos/200/200"
									alt=""
								/>
							</button>

							<button type="button" aria-label="Lihat gambar produk 2" class="max-w-24 p-2">
								<img
									class="w-full rounded-md object-cover"
									src="https://picsum.photos/200/200"
									alt=""
								/>
							</button>

							<button type="button" aria-label="Lihat gambar produk 3" class="max-w-24 p-2">
								<img
									class="w-full rounded-md object-cover"
									src="https://picsum.photos/200/200"
									alt=""
								/>
							</button>

							<button type="button" aria-label="Lihat gambar produk 4" class="max-w-24 p-2">
								<img
									class="w-full rounded-md object-cover"
									src="https://picsum.photos/200/200"
									alt=""
								/>
							</button>
						</div>
					</div>
				</div>

				<!-- Product Details -->
				<div class="col-span-5 border border-yellow-500">
					<div class="mb-4">
						<h1 class="text-2xl leading-tight font-semibold lg:text-3xl">
							Product Name - product variant
						</h1>
						<div class="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
							<span>Terjual 50 rb+</span>

							<div class="flex items-center gap-2">
								<Star class="h-4 w-4" fill="yellow" />
								<span class="text-sm font-medium text-foreground"
									>4.5 <span class="text-muted-foreground">(100)</span></span
								>
							</div>
						</div>

						<div class="mt-4 mb-4">
							<span class="text-2xl font-bold tracking-tight">Rp. 19.990</span>
						</div>

						<Separator class="mb-4" />

						<!-- variant -->
						<section class="mb-6" aria-labelledby="product-variant-heading">
							<div class="mb-3">
								<h2 id="product-variant-heading" class="text-base leading-snug font-medium">
									Pilih varian:
								</h2>
							</div>
							<RadioGroup>
								<div class="flex flex-wrap gap-4">
									<div class="flex">
										<RadioGroupItem value="variant1" id="variant1" class="peer hidden" />
										<label
											for="variant1"
											class="flex cursor-pointer items-center rounded-md border bg-popover peer-data-checked:border-primary peer-data-checked:bg-accent hover:bg-accent"
										>
											<div class="flex items-center gap-2 p-2">
												<div class="max-w-10">
													<img
														src="https://picsum.photos/200/200"
														class="w-full rounded-md object-cover"
														alt=""
													/>
												</div>

												<span>varian 1</span>
											</div>
										</label>
									</div>

									<div class="flex">
										<RadioGroupItem value="variant2" id="variant2" class="peer hidden" />
										<label
											for="variant2"
											class="flex cursor-pointer items-center rounded-md border bg-popover peer-data-checked:border-primary peer-data-checked:bg-accent hover:bg-accent"
										>
											<div class="flex items-center gap-2 p-2">
												<div class="max-w-10">
													<img
														src="https://picsum.photos/200/200"
														class="w-full rounded-md object-cover"
														alt=""
													/>
												</div>

												<span>varian 2</span>
											</div>
										</label>
									</div>
								</div>
							</RadioGroup>
						</section>

						<!-- options  -->
						<section class="mb-6" aria-labelledby="product-option-heading">
							<div class="mb-3">
								<h2 id="product-option-heading" class="text-base leading-snug font-medium">
									Pilih opsi
								</h2>
							</div>
							<RadioGroup>
								<div class="flex flex-wrap gap-4">
									<div class="flex">
										<RadioGroupItem value="option1" id="option1" class="peer hidden" />
										<label
											for="option1"
											class="flex cursor-pointer items-center rounded-md border bg-popover peer-data-checked:border-primary peer-data-checked:bg-accent hover:bg-accent"
										>
											<div class="flex items-center gap-2 p-2">
												<div class="max-w-10">
													<img
														src="https://picsum.photos/200/200"
														class="w-full rounded-md object-cover"
														alt=""
													/>
												</div>

												<span>option 1</span>
											</div>
										</label>
									</div>

									<div class="flex">
										<RadioGroupItem value="option2" id="option2" class="peer hidden" />
										<label
											for="option2"
											class="flex cursor-pointer items-center rounded-md border bg-popover peer-data-checked:border-primary peer-data-checked:bg-accent hover:bg-accent"
										>
											<div class="flex items-center gap-2 p-2">
												<div class="max-w-10">
													<img
														src="https://picsum.photos/200/200"
														class="w-full rounded-md object-cover"
														alt=""
													/>
												</div>

												<span>option 2</span>
											</div>
										</label>
									</div>
								</div>
							</RadioGroup>
						</section>

						<!-- details -->
						<section class="mb-6" aria-labelledby="product-detail-heading">
							<div class="mb-3">
								<h2 id="product-detail-heading" class="text-base leading-snug font-medium">
									Detail product
								</h2>
							</div>

							<ul class="space-y-2">
								<li>
									<div class="flex items-center gap-2">
										<span class="text-muted-foreground">Detail 1: </span>
										<span>value</span>
									</div>
								</li>

								<li>
									<div class="flex items-center gap-2">
										<span class="text-muted-foreground">Detail 2: </span>
										<span>value</span>
									</div>
								</li>

								<li>
									<div class="flex items-center gap-2">
										<span class="text-muted-foreground">Detail 3: </span>
										<span>value</span>
									</div>
								</li>
							</ul>
						</section>

						<section class="mb-4" aria-labelledby="product-description-heading">
							<div class="mb-3">
								<h2 id="product-description-heading" class="text-base leading-snug font-medium">
									Deskripsi product
								</h2>
							</div>
							<p class="mb-4 text-sm leading-6 text-foreground">
								Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas ipsum consequatur,
								voluptate quisquam deleniti cumque, dicta voluptatum, doloremque sed magnam.
								Voluptas ipsum consequatur, voluptate quisquam deleniti cumque, dicta voluptatum,
								doloremque sed magnam.
							</p>

							<p class="text-sm leading-6 text-foreground">
								Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eligendi, accusantium
								mollitia dicta voluptatibus exercitationem necessitatibus voluptatum dolore in,
								commodi neque deserunt, impedit vitae atque. Nobis nam ipsum porro magni tempora.
							</p>
						</section>
					</div>
				</div>

				<!-- card action -->
				<aside class="col-span-3" aria-label="Ringkasan pembelian">
					<Card>
						<CardHeader>
							<CardTitle>Product Name</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="mb-4 flex gap-2">
								<div class="max-w-12">
									<img src="https://picsum.photos/200/200" alt="" />
								</div>
								<div class="flex items-center">
									<span class="text-sm font-medium">Mug custom</span>
								</div>
							</div>

							<Separator />

							<div class="mt-4 flex gap-2">
								<div class="flex gap-2">
									<ButtonGroup>
										<Button variant="outline" size="icon">
											<Minus />
										</Button>
										<Button variant="outline">...</Button>
										<Button variant="outline" size="icon">
											<Plus />
										</Button>
									</ButtonGroup>

									<div class="flex items-center gap-2">
										<span class="text-sm text-muted-foreground">Stok:</span>
										<span class="text-sm font-medium text-foreground">10</span>
									</div>
								</div>
							</div>

							<div class="mt-4 flex justify-between">
								<span class="text-sm text-muted-foreground">Subtotal</span>
								<span class="text-base font-semibold text-foreground">$19.99</span>
							</div>
						</CardContent>
						<CardFooter>
							<div class="flex w-full flex-col gap-2">
								<Button class="w-full">Checkout</Button>
								<Button variant="outline" class="w-full">Beli langsung</Button>
							</div>
						</CardFooter>
					</Card>
				</aside>
			</div>
		</div>
	</div>
</main>
