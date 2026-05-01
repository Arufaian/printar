import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table';
import DataTableActions from './data-table-actions.svelte';
import DataTableSorting from '../products/data-table-sorting.svelte';
import { formatCurrency } from '$lib/utils/string';
import type { AdminOrderListItem } from '$lib/types/admin-orders';

type CreateColumnsOptions = {
	onView: (order: { id: string }) => void;
};

export const createColumns = ({
	onView
}: CreateColumnsOptions): ColumnDef<AdminOrderListItem>[] => [
	{
		accessorKey: 'id',
		header: 'ID',
		meta: {
			headClass: 'text-left',
			cellClass: 'text-left font-mono text-xs'
		}
	},
	{
		accessorKey: 'customerName',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Customer'
			})
	},
	{
		accessorKey: 'status',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Status'
			})
	},
	{
		accessorKey: 'latestPaymentStatus',
		header: 'Payment',
		cell: ({ row }) => row.original.latestPaymentStatus ?? '-'
	},
	{
		accessorKey: 'totalPrice',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Total'
			}),
		cell: ({ row }) => formatCurrency(row.original.totalPrice)
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Dibuat'
			}),
		cell: ({ row }) => {
			const date = row.original.createdAt;
			if (!date) return '-';
			return new Intl.DateTimeFormat('id-ID', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(date));
		}
	},
	{
		id: 'actions',
		header: 'Aksi',
		enableHiding: false,
		cell: ({ row }) =>
			renderComponent(DataTableActions, {
				id: row.original.id,
				onView
			})
	}
];
