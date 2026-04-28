<script lang="ts">
	import * as Stepper from '$lib/components/ui/stepper';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	type CheckoutItem = {
		id: string;
		name: string;
		variant: string;
		quantity: number;
		unitPrice: number;
	};

	const checkoutSteps = [
		{
			title: 'Data Pengiriman',
			description: 'Lengkapi alamat dan kontak penerima'
		},
		{
			title: 'Review Pesanan',
			description: 'Periksa item, jumlah, dan ringkasan biaya'
		},
		{
			title: 'Pembayaran',
			description: 'Pilih metode lalu konfirmasi transaksi'
		}
	] as const;

	const checkoutItems: CheckoutItem[] = [
		{
			id: 'item-1',
			name: 'Kartu Nama Premium',
			variant: 'Matte Laminating - 100 pcs',
			quantity: 2,
			unitPrice: 45000
		},
		{
			id: 'item-2',
			name: 'Flyer Promosi A5',
			variant: 'Art Paper 120gsm - 500 pcs',
			quantity: 1,
			unitPrice: 120000
		},
		{
			id: 'item-3',
			name: 'Stiker Vinyl Custom',
			variant: 'Ukuran 7x7 cm - 50 pcs',
			quantity: 3,
			unitPrice: 30000
		}
	];

	let step = $state(1);
	const maxStep = checkoutSteps.length;

	const subtotal = $derived(
		checkoutItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
	);
	const shippingCost = $derived(18000);
	const grandTotal = $derived(subtotal + shippingCost);

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(value);
</script>

<div class="container mx-auto px-4 py-8 lg:px-8">
	<div class="mx-auto max-w-6xl space-y-6">
		<header class="space-y-2">
			<p class="text-sm font-medium text-muted-foreground">Checkout</p>
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Selesaikan Pesanan Anda</h1>
			<p class="text-sm text-muted-foreground md:text-base">
				Ikuti langkah berikut untuk meninjau detail pembelian dan melanjutkan ke pembayaran.
			</p>
		</header>

		<Stepper.Root bind:step>
			<Stepper.Nav class="w-full" orientation="horizontal">
				{#each checkoutSteps as checkoutStep, index (checkoutStep.title)}
					<Stepper.Item>
						<Stepper.Trigger class="flex flex-col items-center ">
							<Stepper.Indicator>
								{index + 1}
							</Stepper.Indicator>
							<div class="my-2 hidden flex-col lg:flex">
								<Stepper.Title class=" text-sm leading-tight md:text-base">
									{checkoutStep.title}
								</Stepper.Title>
							</div>
						</Stepper.Trigger>
						<Stepper.Separator class="lg:left-[calc(60px)]" />
					</Stepper.Item>
				{/each}
			</Stepper.Nav>

			<div class="flex items-center justify-between gap-3">
				<Stepper.Previous disabled={step <= 1}>Sebelumnya</Stepper.Previous>
				<p class="text-sm text-muted-foreground">
					Langkah {step} dari {maxStep}: {checkoutSteps[step - 1].title}
				</p>
				<Stepper.Next disabled={step >= maxStep}>Lanjut</Stepper.Next>
			</div>
		</Stepper.Root>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
			<div class="space-y-6 lg:col-span-8">
				<Card>
					<CardHeader class="space-y-1.5 border-b">
						<CardTitle>Alamat pengiriman</CardTitle>
						<CardDescription>Alamat pengiriman yang tersedia.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4 pt-6"></CardContent>
				</Card>

				<Card>
					<CardHeader class="space-y-1.5 border-b">
						<CardTitle>Rincian Pembelian</CardTitle>
						<CardDescription>
							Periksa daftar produk, variasi, jumlah, dan harga sebelum melanjutkan.
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4 pt-6">
						{#each checkoutItems as item (item.id)}
							<div class="flex gap-4 rounded-lg border p-4">
								<div
									class="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground"
								>
									Preview
								</div>
								<div class="min-w-0 flex-1 space-y-1.5">
									<p class="truncate text-sm font-medium md:text-base">{item.name}</p>
									<p class="text-xs text-muted-foreground md:text-sm">{item.variant}</p>
									<div class="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
										<span>Jumlah: {item.quantity}</span>
										<span aria-hidden="true">-</span>
										<span>Harga satuan: {formatCurrency(item.unitPrice)}</span>
									</div>
								</div>
								<p class="text-sm font-semibold whitespace-nowrap md:text-base">
									{formatCurrency(item.quantity * item.unitPrice)}
								</p>
							</div>
						{/each}
					</CardContent>
				</Card>
			</div>

			<div class="lg:col-span-4">
				<Card class="lg:sticky lg:top-24">
					<CardHeader class="space-y-1.5 border-b">
						<CardTitle>Ringkasan Pesanan</CardTitle>
						<CardDescription>Total biaya belanja Anda saat ini.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4 pt-6">
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<span>Subtotal</span>
							<span>{formatCurrency(subtotal)}</span>
						</div>
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<span>Ongkos Kirim</span>
							<span>{formatCurrency(shippingCost)}</span>
						</div>
						<Separator />
						<div class="flex items-center justify-between text-base font-semibold">
							<span>Total</span>
							<span>{formatCurrency(grandTotal)}</span>
						</div>
					</CardContent>
					<CardFooter>
						<Button class="w-full" size="lg">Lanjut ke Pembayaran</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	</div>
</div>
