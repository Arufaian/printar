<script lang="ts" generics="TData, TValue">
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
		type RowSelectionState,
		type SortingState,
		type VisibilityState,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';

	import { createSvelteTable } from './data-table.svelte.js';
	import FlexRender from './flex-render.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	type DataTableProps<TData, TValue> = {
		data: TData[];
		columns: ColumnDef<TData, TValue>[];
		initialColumnVisibility?: VisibilityState;
		filterColumnId?: string;
		filterPlaceholder?: string;
		showColumnToggle?: boolean;
		showSelectionSummary?: boolean;
		showPagination?: boolean;
		columnToggleLabel?: string;
		emptyMessage?: string;
		pageSize?: number;
	};

	type ColumnAlignMeta = {
		headClass?: string;
		cellClass?: string;
	};

	let {
		data,
		columns,
		initialColumnVisibility = {},
		filterColumnId = 'email',
		filterPlaceholder = 'Filter...',
		showColumnToggle = true,
		showSelectionSummary = true,
		showPagination = true,
		columnToggleLabel = 'Columns',
		emptyMessage = 'No results.',
		pageSize = 10
	}: DataTableProps<TData, TValue> = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>(initialColumnVisibility);
	let rowSelection = $state<RowSelectionState>({});

	$effect(() => {
		if (pagination.pageSize !== pageSize) {
			pagination = { ...pagination, pageSize };
		}
	});

	const table = createSvelteTable({
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get rowSelection() {
				return rowSelection;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		}
	});

	const getFilterColumn = () => table.getColumn(filterColumnId);

	// NOTE: Default alignment is centered for all columns unless overridden via column meta.
	const getColumnAlignMeta = (columnDef: ColumnDef<TData, TValue>) =>
		(columnDef.meta as ColumnAlignMeta | undefined) ?? {};
	const getHeadAlignClass = (columnDef: ColumnDef<TData, TValue>) =>
		getColumnAlignMeta(columnDef).headClass ?? 'text-center';
	const getCellAlignClass = (columnDef: ColumnDef<TData, TValue>) =>
		getColumnAlignMeta(columnDef).cellClass ?? 'text-center';
</script>

<div class="w-full overflow-hidden">
	<div class="flex items-center py-4">
		{#if filterColumnId}
			<Input
				placeholder={filterPlaceholder}
				value={(getFilterColumn()?.getFilterValue() as string) ?? ''}
				onchange={(e) => getFilterColumn()?.setFilterValue(e.currentTarget.value)}
				oninput={(e) => getFilterColumn()?.setFilterValue(e.currentTarget.value)}
				class="max-w-sm"
			/>
		{/if}

		{#if showColumnToggle}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" class="ms-auto">{columnToggleLabel}</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-56">
					{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column.id)}
						<DropdownMenu.CheckboxItem
							class="capitalize"
							bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
						>
							{column.id}
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								colspan={header.colSpan}
								class={getHeadAlignClass(header.column.columnDef)}
							>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row data-state={row.getIsSelected() && 'selected'}>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell class={getCellAlignClass(cell.column.columnDef)}>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center">{emptyMessage}</Table.Cell
						>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	{#if showPagination || showSelectionSummary}
		<div class="flex items-center justify-end space-x-2 py-4">
			{#if showSelectionSummary}
				<div class="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
			{/if}

			{#if showPagination}
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					Next
				</Button>
			{/if}
		</div>
	{/if}
</div>
