<script lang="ts">
	import ProductForm from '$lib/components/product-form/product-form.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div>
	<ProductForm {data} />
</div>
