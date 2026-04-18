<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table/index.js';
	import { columns } from './columns.js';

	let { data } = $props();
</script>

<section>
	<DataTable
		data={data.categories}
		{columns}
		filterColumnId="email"
		filterPlaceholder="Filter emails..."
	/>
</section>
