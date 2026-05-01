<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DataTable } from '$lib/components/ui/data-table';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { AdminOrderListItem } from '$lib/types/admin-orders';
	import type { PageData } from './$types';
	import { createColumns } from './columns';

	let { data }: { data: PageData } = $props();

	const columns = createColumns({
		onView: ({ id }) => {
			goto(resolve(`/admin/orders/${id}`));
		}
	});

	const statusOptions = [
		'all',
		'pending_payment',
		'paid',
		'file_review',
		'revision_requested',
		'printing',
		'ready',
		'shipped',
		'completed',
		'canceled'
	] as const;

	const paymentOptions = ['all', 'pending', 'settlement', 'expire', 'cancel', 'none'] as const;

	let selectedStatus = $state(data.filters.status || 'all');
	let selectedPayment = $state(data.filters.payment || 'all');

	const tableData = $derived((data.orders as AdminOrderListItem[]) ?? []);
</script>

<section class="space-y-4">
	<form method="GET" class="flex flex-col gap-3 md:flex-row md:items-center">
		<div class="w-full md:w-56">
			<input type="hidden" name="status" value={selectedStatus} />
			<Select.Root type="single" name="status" bind:value={selectedStatus}>
				<Select.Trigger class="w-full">{selectedStatus}</Select.Trigger>
				<Select.Content>
					{#each statusOptions as option (option)}
						<Select.Item value={option} label={option}>{option}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="w-full md:w-48">
			<input type="hidden" name="payment" value={selectedPayment} />
			<Select.Root type="single" name="payment" bind:value={selectedPayment}>
				<Select.Trigger class="w-full">{selectedPayment}</Select.Trigger>
				<Select.Content>
					{#each paymentOptions as option (option)}
						<Select.Item value={option} label={option}>{option}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="md:ms-auto">
			<button
				type="submit"
				class="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
			>
				Terapkan Filter
			</button>
		</div>
	</form>

	<DataTable
		data={tableData}
		{columns}
		showColumnToggle={true}
		initialColumnVisibility={{ id: false }}
	/>
</section>
