<script lang="ts">
	import DataTable from './data-table.svelte';
	import { columns } from './columns.js';

	let { data } = $props();
</script>

<section>
	<DataTable data={data.payments} {columns} />
</section>
