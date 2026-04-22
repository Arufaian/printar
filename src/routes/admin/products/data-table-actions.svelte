<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let {
		id,
		name,
		onEdit,
		onDelete
	}: {
		id: string;
		name: string | null;
		onEdit: (product: { id: string; name: string | null }) => void;
		onDelete: (product: { id: string; name: string | null }) => void;
	} = $props();

	const handleEdit = () => onEdit({ id, name });
	const handleDelete = () => onDelete({ id, name });
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
	<DropdownMenu.Content class="mr-4">
		<DropdownMenu.Group>
			<DropdownMenu.Label>Aksi</DropdownMenu.Label>
			<DropdownMenu.Item onclick={handleEdit}>Edit produk</DropdownMenu.Item>
			<DropdownMenu.Item variant="destructive" onclick={handleDelete}>
				Hapus produk
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
