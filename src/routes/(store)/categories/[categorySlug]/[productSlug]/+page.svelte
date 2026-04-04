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

<div class="container mx-auto px-4 py-8 lg:px-8">
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
						<div class="aspect-square w-full">
							<img
								class="w-full rounded-md object-cover"
								src="https://picsum.photos/700/700"
								alt="product"
							/>
						</div>
						<div class="flex">
							<button class="max-w-24 p-2">
								<img
									class="w-full rounded-md object-cover"
									src="https://picsum.photos/200/200"
									alt=""
								/>
							</button>

							<button class="max-w-24 p-2">
								<img
									class="w-full rounded-md object-cover"
									src="https://picsum.photos/200/200"
									alt=""
								/>
							</button>

							<button class="max-w-24 p-2">
								<img
									class="w-full rounded-md object-cover"
									src="https://picsum.photos/200/200"
									alt=""
								/>
							</button>

							<button class="max-w-24 p-2">
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
						<h3>Product Name - product variant</h3>
						<div class="flex gap-2">
							<span>Terjual 50 rb+</span>

							<div class="flex items-center gap-2">
								<Star class="h-4 w-4 " fill="yellow" />
								<span class="text-sm font-medium">4.5 <span>(100)</span></span>
							</div>
						</div>

						<div class="mb-4">
							<span>Rp. 19.990</span>
						</div>

						<Separator class="mb-4" />

						<!-- variant -->
						<div class="mb-4">
							<div class="mb-4">
								<span class="text-sm text-muted-foreground">Pilih varian:</span>
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

												<span> varian 1 </span>
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

												<span> varian 2 </span>
											</div>
										</label>
									</div>
								</div>
							</RadioGroup>
						</div>

						<!-- options  -->
						<div class="mb-4">
							<div class="mb-4">
								<span class="text-sm text-muted-foreground">Pilih opsi</span>
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

												<span> option 1 </span>
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

												<span> option 2 </span>
											</div>
										</label>
									</div>
								</div>
							</RadioGroup>
						</div>

						<!-- details -->
						<div class="mb-4">
							<span> Detail product </span>

							<ul class="">
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
						</div>

						<div class="mb-4">
							<span> Deskripsi product </span>
							<p class="mb-4">
								Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas ipsum consequatur,
								voluptate quisquam deleniti cumque, dicta voluptatum, doloremque sed magnam.
								Voluptas ipsum consequatur, voluptate quisquam deleniti cumque, dicta voluptatum,
								doloremque sed magnam.
							</p>

							<p>
								Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eligendi, accusantium
								mollitia dicta voluptatibus exercitationem necessitatibus voluptatum dolore in,
								commodi neque deserunt, impedit vitae atque. Nobis nam ipsum porro magni tempora.
							</p>
						</div>
					</div>
				</div>

				<!-- card action -->
				<div class="col-span-3">
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
									<span>Mug custom</span>
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
										<span class="text-sm font-medium">10</span>
									</div>
								</div>
							</div>

							<div class="mt-4 flex justify-between">
								<span>Subtotal</span>
								<span class="font-medium">$19.99</span>
							</div>
						</CardContent>
						<CardFooter>
							<div class="flex w-full flex-col gap-2">
								<Button class="w-full">Checkout</Button>
								<Button variant="outline" class="w-full">Beli langsung</Button>
							</div>
						</CardFooter>
					</Card>
				</div>
			</div>
		</div>
	</div>
</div>
