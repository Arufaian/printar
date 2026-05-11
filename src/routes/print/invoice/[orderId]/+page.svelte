<script lang="ts">
	import { onMount } from 'svelte';
	import { formatCurrency, formatDateTime } from '$lib/utils/string';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const invoice = $derived(data.invoice);

	onMount(() => {
		const handleAfterPrint = () => {
			history.back();
		};

		window.addEventListener('afterprint', handleAfterPrint);
		setTimeout(() => {
			window.print();
		}, 50);

		return () => {
			window.removeEventListener('afterprint', handleAfterPrint);
		};
	});
</script>

<svelte:head>
	<title>Invoice {invoice.invoiceNumber}</title>
</svelte:head>

<main class="paper" aria-label="Invoice">
	<header class="header">
		<div>
			<h1>Invoice</h1>
			<p class="muted">{invoice.invoiceNumber}</p>
		</div>
		<div class="meta-right">
			<p><strong>Tanggal:</strong> {formatDateTime(invoice.issueDate)}</p>
			<p><strong>Status:</strong> {invoice.status}</p>
		</div>
	</header>

	<section class="section">
		<p><strong>Order ID:</strong> {invoice.orderId}</p>
		<p><strong>Pelanggan:</strong> {invoice.customerName}</p>
		<p><strong>Metode Pembayaran:</strong> {invoice.paymentMethod}</p>
	</section>

	<section class="section">
		<table>
			<thead>
				<tr>
					<th>Item</th>
					<th class="center">Qty</th>
					<th class="right">Harga</th>
					<th class="right">Subtotal</th>
				</tr>
			</thead>
			<tbody>
				{#each invoice.items as item (item.id)}
					<tr>
						<td>{item.name}</td>
						<td class="center">{item.quantity}</td>
						<td class="right">{formatCurrency(item.unitPrice)}</td>
						<td class="right">{formatCurrency(item.quantity * item.unitPrice)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="summary">
		<div><span>Subtotal</span><strong>{formatCurrency(invoice.subtotal)}</strong></div>
		<div><span>Ongkir</span><strong>{formatCurrency(invoice.shippingCost)}</strong></div>
		<div class="grand-total">
			<span>Total</span><strong>{formatCurrency(invoice.grandTotal)}</strong>
		</div>
	</section>

	<section class="section note">
		<p><strong>Catatan:</strong> {invoice.notes}</p>
	</section>
</main>

<style>
	.paper {
		width: min(210mm, calc(100% - 2rem));
		margin: 1rem auto 2rem;
		padding: 14mm;
		background: #fff;
		box-sizing: border-box;
		box-shadow: 0 10px 24px rgba(17, 24, 39, 0.12);
		font-size: 14px;
		line-height: 1.55;
	}
	@page {
		size: A4 landscape;
		margin: 0;
	}

	@media print {
		:global(html),
		:global(body) {
			margin: 0;
			padding: 0;
			color: #111827;
			font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		}

		.paper {
			width: 100vw;
			min-height: 100vh;
			margin: 0;
			padding: 12mm;
			background: #fff;
			box-sizing: border-box;
			box-shadow: none;
			font-size: 14px;
			line-height: 1.55;
		}

		.header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			gap: 1rem;
			padding-bottom: 0.8rem;
			border-bottom: 1px solid #e5e7eb;
		}

		h1 {
			margin: 0;
			font-size: 1.55rem;
		}

		.muted {
			margin-top: 0.2rem;
			color: #6b7280;
		}

		.section {
			margin-top: 1rem;
		}

		.meta-right p,
		.section p {
			margin: 0.25rem 0;
		}

		table {
			width: 100%;
			border-collapse: collapse;
		}

		th,
		td {
			border: 1px solid #d1d5db;
			padding: 8px;
			vertical-align: top;
		}

		th {
			background: #f9fafb;
			text-align: left;
		}

		.center {
			text-align: center;
		}

		.right {
			text-align: right;
		}

		.summary {
			margin-top: 1rem;
			display: grid;
			gap: 0.35rem;
		}

		.summary div {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.grand-total {
			margin-top: 0.35rem;
			padding-top: 0.35rem;
			border-top: 1px solid #e5e7eb;
			font-size: 1rem;
		}

		.note {
			padding-top: 0.5rem;
			border-top: 1px dashed #d1d5db;
		}
	}
</style>
