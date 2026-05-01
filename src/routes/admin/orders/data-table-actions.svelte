<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import EyeIcon from '@lucide/svelte/icons/eye';

	let {
		id,
		onView
	}: {
		id: string;
		onView: (order: { id: string }) => void;
	} = $props();

	const handleView = () => onView({ id });
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
				<span class="sr-only">Buka menu</span>
				<EllipsisIcon />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="mr-4 w-28">
		<DropdownMenu.Group>
			<DropdownMenu.Label>Aksi</DropdownMenu.Label>
			<DropdownMenu.Item onclick={handleView}>
				<EyeIcon />
				Detail
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
