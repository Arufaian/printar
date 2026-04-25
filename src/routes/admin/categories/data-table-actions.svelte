<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let {
		id,
		name,
		slug,
		onEdit,
		onDelete
	}: {
		id: string;
		name: string | null;
		slug: string | null;
		onEdit: (category: { id: string; name: string | null; slug: string | null }) => void;
		onDelete: (category: { id: string; name: string | null; slug: string | null }) => void;
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
				<span class="sr-only">Open menu</span>
				<EllipsisIcon />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>Actions</DropdownMenu.Label>
			<DropdownMenu.Item onclick={() => onEdit({ id, name, slug })}>Edit category</DropdownMenu.Item
			>
			<DropdownMenu.Item variant="destructive" onclick={() => onDelete({ id, name, slug })}
				>Delete category</DropdownMenu.Item
			>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
