import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableActions from './data-table-actions.svelte';
import DataTableCheckbox from './data-table-checkbox.svelte';
import DataTableEmailButton from './data-table-email-button.svelte';

export type Category = {
	id: string;
	name: string | null;
	slug: string | null;
};

type CreateColumnsOptions = {
	onEdit: (category: Category) => void;
	onDelete: (category: Category) => void;
};

export const createColumns = ({
	onEdit,
	onDelete
}: CreateColumnsOptions): ColumnDef<Category>[] => [
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
		header: 'id'
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			renderComponent(DataTableEmailButton, {
				onclick: column.getToggleSortingHandler(),
				label: 'Name'
			})
	},
	{
		accessorKey: 'slug',
		header: ({ column }) =>
			renderComponent(DataTableEmailButton, {
				onclick: column.getToggleSortingHandler(),
				label: 'Slug'
			})
	},
	{
		id: 'actions',
		header: 'Actions',
		enableHiding: false,
		cell: ({ row }) =>
			renderComponent(DataTableActions, {
				id: row.original.id,
				name: row.original.name,
				slug: row.original.slug,
				onEdit,
				onDelete
			})
	}
];
