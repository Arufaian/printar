<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import * as Stepper from '$lib/components/ui/stepper';
	import type { AdminOrderDetailData } from '$lib/types/admin-orders';
	import { formatCurrency, formatDateTime } from '$lib/utils/string';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const order = $derived(data.order as AdminOrderDetailData);
	const activeTimelineStep = $derived(order.timeline.length);

	const getStatusVariant = (status: string) => {
		if (status === 'paid' || status === 'completed') return 'default';
		if (status === 'pending_payment' || status === 'revision_requested') return 'secondary';
		if (status === 'canceled') return 'destructive';
		return 'outline';
	};
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
		<div class="space-y-1">
			<h1 class="text-xl font-semibold">Detail Order</h1>
			<p class="text-sm text-muted-foreground">{order.orderCode}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
		<div class="space-y-6 xl:col-span-8">
			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Informasi Customer</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2 pt-6 text-sm">
					<p><span class="text-muted-foreground">Nama:</span> {order.customerName}</p>
					<p><span class="text-muted-foreground">Email:</span> {order.customerEmail ?? '-'}</p>
					<p><span class="text-muted-foreground">Catatan:</span> {order.customerNote ?? '-'}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Alamat & Pengiriman</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2 pt-6 text-sm">
					<p class="font-medium">{order.address.recipientName}</p>
					<p>{order.address.label}</p>
					<p>{order.address.addressLine}</p>
					<p>{order.address.city}, {order.address.postalCode}</p>
					<p>{order.address.phone}</p>
					<p class="pt-2">
						<span class="text-muted-foreground">Metode:</span>
						{order.deliveryMethodLabel}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Item Order</CardTitle>
					<CardDescription>Daftar item pada pesanan ini.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4 pt-6">
					{#if order.items.length === 0}
						<p class="text-sm text-muted-foreground">Item order tidak ditemukan.</p>
					{:else}
						{#each order.items as item, index (item.id)}
							<div class="space-y-3 rounded-lg border border-border/60 p-3">
								<div class="flex items-start gap-3">
									{#if item.image}
										<img
											src={item.image}
											alt={item.name}
											class="h-14 w-14 rounded-md border border-border/60 object-cover"
										/>
									{:else}
										<div
											class="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border/60 text-[10px] text-muted-foreground"
										>
											Preview
										</div>
									{/if}

									<div class="min-w-0 flex-1 space-y-2">
										<div class="space-y-1">
											<p class="truncate font-medium">{item.name}</p>
											<p class="text-xs text-muted-foreground">{item.variant}</p>
											{#if item.options.length > 0}
												<p class="text-xs text-muted-foreground">{item.options.join(', ')}</p>
											{/if}
										</div>

										<div
											class="flex items-center justify-between border-t border-border/60 pt-2 text-xs"
										>
											<p class="text-muted-foreground">
												{item.quantity} x {formatCurrency(item.unitPrice)}
											</p>
											<p class="font-semibold text-foreground">{formatCurrency(item.lineTotal)}</p>
										</div>
									</div>
								</div>
							</div>
							{#if index < order.items.length - 1}
								<Separator />
							{/if}
						{/each}
					{/if}
				</CardContent>
			</Card>
		</div>

		<div class="space-y-6 xl:col-span-4">
			<Card>
				<CardHeader class="border-b">
					<div class="flex items-center justify-between gap-3">
						<CardTitle>Ringkasan</CardTitle>
						<Badge variant={getStatusVariant(order.status)}>{order.statusLabel}</Badge>
					</div>
				</CardHeader>
				<CardContent class="space-y-3 pt-6 text-sm">
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Dibuat</span>
						<span class="text-right text-foreground">{formatDateTime(order.createdAt)}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Diupdate</span>
						<span class="text-right text-foreground">{formatDateTime(order.updatedAt)}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Payment</span>
						<span class="text-foreground">{order.latestPaymentStatus ?? '-'}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Metode</span>
						<span class="text-foreground">{order.latestPaymentMethod ?? '-'}</span>
					</div>
					<Separator />
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Subtotal</span>
						<span>{formatCurrency(order.subtotal)}</span>
					</div>
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Ongkir</span>
						<span>{formatCurrency(order.shippingCost)}</span>
					</div>
					<div class="flex items-center justify-between text-base font-semibold text-foreground">
						<span>Total</span>
						<span>{formatCurrency(order.grandTotal)}</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="space-y-1.5 border-b">
					<CardTitle>Timeline Status</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3 pt-6">
					{#if order.timeline.length === 0}
						<p class="text-sm text-muted-foreground">Belum ada riwayat status.</p>
					{:else}
						<Stepper.Root step={activeTimelineStep}>
							<Stepper.Nav orientation="vertical" class="gap-3">
								{#each order.timeline as entry, index (`${entry.status}-${entry.createdAt}`)}
									<Stepper.Item>
										<Stepper.Trigger disabled class="items-start">
											<Stepper.Indicator>{index + 1}</Stepper.Indicator>
											<div class="space-y-1 text-left">
												<Stepper.Title>{entry.label}</Stepper.Title>
												<Stepper.Description>
													{formatDateTime(entry.createdAt)}
													{#if entry.changedByName}
														• {entry.changedByName}
													{/if}
												</Stepper.Description>
											</div>
										</Stepper.Trigger>
										<Stepper.Separator />
									</Stepper.Item>
								{/each}
							</Stepper.Nav>
						</Stepper.Root>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
</div>
