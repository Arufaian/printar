<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		label = 'Urutkan',
		variant = 'ghost',
		...restProps
	}: { label?: string } & ComponentProps<typeof Button> = $props();
</script>

<Button {variant} {...restProps}>
	{label}
	<ArrowUpDownIcon class="ms-2" />
</Button>
