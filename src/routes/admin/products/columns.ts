import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableActions from './data-table-actions.svelte';
import DataTableCheckbox from './data-table-checkbox.svelte';
import DataTableSorting from './data-table-sorting.svelte';

export type Product = {
	id: string;
	name: string | null;
	description: string | null;
	categoryId: string | null;
	createdAt: Date | null;
	deletedAt: Date | null;
	categoryName: string | null;
	variantsCount: number;
	lowestPrice: number | null;
	totalStock: number | null;
};

type CreateColumnsOptions = {
	onEdit: (product: Product) => void;
	onDelete: (product: Product) => void;
};

export const createColumns = ({ onEdit, onDelete }: CreateColumnsOptions): ColumnDef<Product>[] => [
	{
		id: 'select',
		header: ({ table }) =>
			renderComponent(DataTableCheckbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value: boolean | 'indeterminate') =>
					table.toggleAllPageRowsSelected(!!value),
				'aria-label': 'Select all'
			}),
		cell: ({ row }) =>
			renderComponent(DataTableCheckbox, {
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
				'aria-label': 'Select row'
			}),
		enableSorting: false,
		enableHiding: false
	},
	{
		accessorKey: 'id',
		// NOTE: ID is intentionally kept left-aligned for easier scanning.
		meta: {
			headClass: 'text-left',
			cellClass: 'text-left'
		},
		header: 'ID'
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Name'
			})
	},
	{
		accessorKey: 'categoryName',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Category'
			})
	},
	{
		accessorKey: 'variantsCount',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Variants'
			})
	},
	{
		accessorKey: 'lowestPrice',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Price',
				class: 'w-full flex justify-center'
			}),
		cell: ({ row }) => {
			const price = row.original.lowestPrice;
			if (price === null) return '-';
			return new Intl.NumberFormat('id-ID', {
				style: 'currency',
				currency: 'IDR'
			}).format(price);
		}
	},
	{
		accessorKey: 'totalStock',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Stock'
			})
	},
	{
		accessorKey: 'deletedAt',
		header: 'Status',
		cell: ({ row }) => {
			const isActive = row.original.deletedAt === null;
			return isActive ? 'Active' : 'Archived';
		}
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSorting, {
				onclick: column.getToggleSortingHandler(),
				label: 'Created At'
			}),
		cell: ({ row }) => {
			const date = row.original.createdAt;
			if (!date) return '-';
			return new Intl.DateTimeFormat('id-ID', {
				dateStyle: 'medium'
			}).format(date);
		}
	},
	{
		id: 'actions',
		header: 'Actions',
		enableHiding: false,
		cell: ({ row }) =>
			renderComponent(DataTableActions, {
				id: row.original.id,
				name: row.original.name,
				onEdit: (p: { id: string; name: string | null }) => onEdit(p as Product),
				onDelete: (p: { id: string; name: string | null }) => onDelete(p as Product)
			})
	}
];
