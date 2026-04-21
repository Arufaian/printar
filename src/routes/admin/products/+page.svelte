<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table/index.js';
	import { createColumns, type Product } from './columns.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const getTableData = (): Product[] =>
		data.response.map((item) => ({
			id: item.id,
			name: item.name,
			description: item.description,
			categoryId: item.categoryId,
			createdAt: item.createdAt,
			deletedAt: item.deletedAt,
			categoryName: item.categoryName,
			variantsCount: item.variantsCount,
			lowestPrice: item.lowestPrice,
			totalStock: item.totalStock
		}));

	const columns = createColumns({
		onEdit: () => {},
		onDelete: () => {}
	});
</script>

<section>
	<DataTable
		data={getTableData()}
		{columns}
		filterColumnId="name"
		filterPlaceholder="Filter products..."
	/>
</section>
