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
		{ value: 'all', label: 'Semua Status' },
		{ value: 'pending_payment', label: 'Pending Payment' },
		{ value: 'paid', label: 'Paid' },
		{ value: 'file_review', label: 'File Review' },
		{ value: 'revision_requested', label: 'Revision Requested' },
		{ value: 'printing', label: 'Printing' },
		{ value: 'ready', label: 'Ready' },
		{ value: 'shipped', label: 'Shipped' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'canceled', label: 'Canceled' }
	] as const;

	const paymentOptions = [
		{ value: 'all', label: 'Semua Payment' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'settlement', label: 'Settlement' },
		{ value: 'expire', label: 'Expire' },
		{ value: 'cancel', label: 'Cancel' },
		{ value: 'none', label: 'None' }
	] as const;

	let selectedStatus = $state(data.filters.status || 'all');
	let selectedPayment = $state(data.filters.payment || 'all');

	const selectedStatusLabel = $derived(
		statusOptions.find((option) => option.value === selectedStatus)?.label ?? 'Filter Status'
	);
	const selectedPaymentLabel = $derived(
		paymentOptions.find((option) => option.value === selectedPayment)?.label ?? 'Filter Payment'
	);

	const tableData = $derived((data.orders as AdminOrderListItem[]) ?? []);
</script>

<section class="space-y-4">
	<form method="GET" class="flex flex-col gap-3 md:flex-row md:items-center">
		<div class="w-full md:w-56">
			<input type="hidden" name="status" value={selectedStatus} />
			<Select.Root type="single" name="status" bind:value={selectedStatus}>
				<Select.Trigger class="w-full">{selectedStatusLabel}</Select.Trigger>
				<Select.Content>
					{#each statusOptions as option (option.value)}
						<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="w-full md:w-48">
			<input type="hidden" name="payment" value={selectedPayment} />
			<Select.Root type="single" name="payment" bind:value={selectedPayment}>
				<Select.Trigger class="w-full">{selectedPaymentLabel}</Select.Trigger>
				<Select.Content>
					{#each paymentOptions as option (option.value)}
						<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
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
