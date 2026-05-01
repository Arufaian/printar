<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge';
	import { buttonVariants } from '$lib/components/ui/button';
	import type { OrderListItem, OrderStatusBadgeVariant } from '$lib/types/order-list';
	import { formatCurrency } from '$lib/utils/string';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const formatOrderDate = (value: string | null) => {
		if (!value) return '-';
		return new Intl.DateTimeFormat('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	};

	const formatDeliveryMethod = (value: string | null) => {
		if (!value) return '-';
		if (value === 'courier') return 'Kurir';
		if (value === 'pickup') return 'Pickup';
		return value;
	};

	const formatOrderCode = (id: string) => `ORD-${id.slice(0, 8).toUpperCase()}`;

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'pending_payment':
				return 'Menunggu Pembayaran';
			case 'paid':
				return 'Dibayar';
			case 'file_review':
				return 'Review File';
			case 'revision_requested':
				return 'Revisi';
			case 'printing':
				return 'Diproses';
			case 'ready':
				return 'Siap';
			case 'shipped':
				return 'Dikirim';
			case 'completed':
				return 'Selesai';
			case 'canceled':
				return 'Dibatalkan';
			default:
				return status;
		}
	};

	const getStatusVariant = (status: string): OrderStatusBadgeVariant => {
		switch (status) {
			case 'paid':
			case 'completed':
				return 'default';
			case 'pending_payment':
				return 'secondary';
			case 'revision_requested':
				return 'secondary';
			case 'canceled':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const getStatusClass = (status: string) => {
		if (status === 'pending_payment') {
			return 'border-amber-300 bg-amber-100 text-amber-800';
		}

		return '';
	};

	const orders = $derived((data.orders as OrderListItem[]) ?? []);
</script>

<div class="space-y-6">
	<div class="space-y-1">
		<h1 class="text-lg font-semibold">Pesanan</h1>
		<p class="text-sm text-muted-foreground">
			Lihat status pesanan dan ringkasan pembelian terbaru Anda.
		</p>
	</div>

	{#if orders.length === 0}
		<div class="rounded-xl border border-dashed p-8 text-center">
			<p class="text-sm text-muted-foreground">Belum ada pesanan aktif yang bisa ditampilkan.</p>
			<a href={resolve('/categories')} class={buttonVariants({ variant: 'outline', class: 'mt-4' })}
				>Mulai Belanja</a
			>
		</div>
	{:else}
		<div class="space-y-4">
			{#each orders as order (order.id)}
				<article class="space-y-4 rounded-xl border p-4 sm:p-5">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="space-y-1">
							<p class="text-xs text-muted-foreground">{formatOrderCode(order.id)}</p>
							<p class="text-sm font-medium text-foreground">{formatOrderDate(order.createdAt)}</p>
						</div>
						<Badge variant={getStatusVariant(order.status)} class={getStatusClass(order.status)}
							>{getStatusLabel(order.status)}</Badge
						>
					</div>

					<div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
						<div class="space-y-1">
							<p class="text-xs text-muted-foreground">Total</p>
							<p class="font-medium text-foreground">{formatCurrency(order.totalPrice)}</p>
						</div>
						<div class="space-y-1">
							<p class="text-xs text-muted-foreground">Pengiriman</p>
							<p class="font-medium text-foreground">
								{formatDeliveryMethod(order.deliveryMethod)}
							</p>
						</div>
						<div class="space-y-1">
							<p class="text-xs text-muted-foreground">Jumlah Item</p>
							<p class="font-medium text-foreground">{order.itemCount}</p>
						</div>
						<div class="space-y-1">
							<p class="text-xs text-muted-foreground">Status Pembayaran</p>
							<p class="font-medium text-foreground">{order.latestPaymentStatus ?? '-'}</p>
						</div>
					</div>

					<div class="space-y-2">
						<p class="text-xs text-muted-foreground">Rincian produk</p>
						<div class="space-y-2">
							{#each order.previewItems as item (item.id)}
								<div class="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
									{#if item.image}
										<img
											src={item.image}
											alt={`Thumbnail ${item.name}`}
											class="h-12 w-12 rounded-md object-cover"
											loading="lazy"
										/>
									{:else}
										<div
											class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground"
										>
											Preview
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-medium text-foreground">{item.name}</p>
										<p class="truncate text-xs text-muted-foreground">{item.variant}</p>
									</div>
									<p class="text-xs font-medium text-muted-foreground">x{item.quantity}</p>
								</div>
							{/each}
						</div>
						{#if order.remainingItemCount > 0}
							<p class="text-xs text-muted-foreground">+{order.remainingItemCount} item lainnya</p>
						{/if}
					</div>

					<div class="flex justify-end">
						<a
							href={resolve('/(store)/customer/orders/[orderId]', { orderId: order.id })}
							class={buttonVariants({ class: 'w-full sm:w-auto' })}
						>
							Lihat Detail
						</a>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
