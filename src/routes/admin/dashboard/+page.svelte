<script lang="ts">
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';
	import WalletIcon from '@lucide/svelte/icons/wallet';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import Clock3Icon from '@lucide/svelte/icons/clock-3';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { formatCurrency } from '$lib/utils/string';
	import type { PageData } from './$types';
	import { scaleBand } from 'd3-scale';
	import { BarChart, PieChart } from 'layerchart';

	let { data }: { data: PageData } = $props();

	type DashboardStat = {
		title: string;
		value: string;
		icon: typeof ShoppingBagIcon;
		iconToneClass: string;
	};

	const stats = $derived<DashboardStat[]>([
		{
			title: 'Orders',
			value: (data.stats?.ordersCount ?? 0).toLocaleString('id-ID'),
			icon: ShoppingBagIcon,
			iconToneClass: 'bg-sky-500/10 text-sky-700'
		},
		{
			title: 'Sales',
			value: formatCurrency(data.stats?.salesTotal ?? 0),
			icon: WalletIcon,
			iconToneClass: 'bg-emerald-500/10 text-emerald-700'
		},
		{
			title: 'Paid Orders',
			value: (data.stats?.paidOrdersCount ?? 0).toLocaleString('id-ID'),
			icon: BadgeCheckIcon,
			iconToneClass: 'bg-teal-500/10 text-teal-700'
		},
		{
			title: 'Pending Payment',
			value: (data.stats?.pendingPaymentCount ?? 0).toLocaleString('id-ID'),
			icon: Clock3Icon,
			iconToneClass: 'bg-amber-500/10 text-amber-700'
		}
	]);

	const salesTrendMock = [
		{ day: 'Mon', sales: 1200000 },
		{ day: 'Tue', sales: 980000 },
		{ day: 'Wed', sales: 1430000 },
		{ day: 'Thu', sales: 1110000 },
		{ day: 'Fri', sales: 1680000 },
		{ day: 'Sat', sales: 1920000 },
		{ day: 'Sun', sales: 1560000 }
	];

	const ordersStatusMock = [
		{ day: 'Mon', paid: 14, pending: 4, canceled: 1 },
		{ day: 'Tue', paid: 11, pending: 5, canceled: 0 },
		{ day: 'Wed', paid: 16, pending: 3, canceled: 1 },
		{ day: 'Thu', paid: 13, pending: 4, canceled: 2 },
		{ day: 'Fri', paid: 19, pending: 6, canceled: 1 },
		{ day: 'Sat', paid: 22, pending: 7, canceled: 1 },
		{ day: 'Sun', paid: 17, pending: 5, canceled: 0 }
	];

	const paymentMethodMock = [
		{ method: 'QRIS', value: 52, color: 'var(--color-qris)' },
		{ method: 'Bank Transfer', value: 33, color: 'var(--color-bank)' },
		{ method: 'E-Wallet', value: 15, color: 'var(--color-ewallet)' }
	];

	const topProductsMock = [
		{ name: 'Poster A3 Glossy', revenue: 5400000 },
		{ name: 'Kartu Nama Premium', revenue: 4300000 },
		{ name: 'Stiker Vinyl', revenue: 3650000 },
		{ name: 'Flyer A5', revenue: 2980000 },
		{ name: 'Banner 60x160', revenue: 2410000 }
	];

	const salesConfig = {
		sales: { label: 'Sales', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	const orderStatusConfig = {
		paid: { label: 'Paid', color: 'var(--chart-1)' },
		pending: { label: 'Pending', color: 'var(--chart-3)' },
		canceled: { label: 'Canceled', color: 'var(--chart-5)' }
	} satisfies Chart.ChartConfig;

	const paymentConfig = {
		qris: { label: 'QRIS', color: 'var(--chart-1)' },
		bank: { label: 'Bank Transfer', color: 'var(--chart-2)' },
		ewallet: { label: 'E-Wallet', color: 'var(--chart-3)' }
	} satisfies Chart.ChartConfig;

	const topProductsConfig = {
		revenue: { label: 'Revenue', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;
</script>

<section class="w-full">
	<Card class="p-0">
		<CardContent class="flex w-full flex-wrap items-stretch px-0 lg:flex-nowrap">
			{#each stats as item, index (item.title)}
				<div
					class="w-full border-border p-7 transition-colors hover:bg-muted/30 md:w-1/2 lg:w-1/4"
					class:border-e={index < stats.length - 1}
					class:border-b={index < 2}
					class:lg:border-b-0={true}
				>
					<div class="flex flex-col gap-3">
						<div class="flex items-start justify-between">
							<h3 class="text-sm font-medium text-muted-foreground">{item.title}</h3>
							<div class={`rounded-full p-3 outline-1 outline-border ${item.iconToneClass}`}>
								<item.icon class="size-4" />
							</div>
						</div>

						<div class="space-y-1">
							<p class="text-2xl font-semibold">{item.value}</p>
							<p class="text-xs text-muted-foreground">Last {data.windowDays ?? 7} days</p>
						</div>
					</div>
				</div>
			{/each}
		</CardContent>
	</Card>
</section>

<section class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
	<Card class="lg:col-span-8">
		<CardHeader>
			<CardTitle>Sales Trend</CardTitle>
			<CardDescription>Mock data • Last 7 days</CardDescription>
		</CardHeader>
		<CardContent>
			<Chart.Container config={salesConfig} class="h-72 w-full">
				<BarChart
					xScale={scaleBand().padding(0.25)}
					data={salesTrendMock}
					x="day"
					axis="x"
					rule={false}
					series={[{ key: 'sales', label: 'Sales', color: 'var(--color-sales)' }]}
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</BarChart>
			</Chart.Container>
		</CardContent>
	</Card>

	<Card class="lg:col-span-4">
		<CardHeader>
			<CardTitle>Payment Methods</CardTitle>
			<CardDescription>Mock distribution</CardDescription>
		</CardHeader>
		<CardContent>
			<Chart.Container config={paymentConfig} class="h-72 w-full">
				<PieChart
					data={paymentMethodMock}
					key="method"
					value="value"
					cRange={paymentMethodMock.map((d) => d.color)}
					c="color"
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</PieChart>
			</Chart.Container>
		</CardContent>
	</Card>

	<Card class="lg:col-span-6">
		<CardHeader>
			<CardTitle>Orders by Status</CardTitle>
			<CardDescription>Mock data • Last 7 days</CardDescription>
		</CardHeader>
		<CardContent>
			<Chart.Container config={orderStatusConfig} class=" w-full ">
				<BarChart
					xScale={scaleBand().padding(0.25)}
					data={ordersStatusMock}
					x="day"
					axis="x"
					rule={false}
					series={[
						{ key: 'paid', label: 'Paid', color: 'var(--color-paid)' },
						{ key: 'pending', label: 'Pending', color: 'var(--color-pending)' },
						{ key: 'canceled', label: 'Canceled', color: 'var(--color-canceled)' }
					]}
					seriesLayout="stack"
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</BarChart>
			</Chart.Container>
		</CardContent>
	</Card>

	<Card class="lg:col-span-6">
		<CardHeader>
			<CardTitle>Top Products</CardTitle>
			<CardDescription>Mock revenue leaderboard</CardDescription>
		</CardHeader>
		<CardContent>
			<Chart.Container config={topProductsConfig} class=" w-full pl-24">
				<BarChart
					data={topProductsMock}
					orientation="horizontal"
					yScale={scaleBand().padding(0.25)}
					y="name"
					padding={{ left: 20 }}
					grid={false}
					axis="y"
					rule={false}
					series={[{ key: 'revenue', label: 'Revenue', color: topProductsConfig.revenue.color }]}
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</BarChart>
			</Chart.Container>
		</CardContent>
	</Card>
</section>
