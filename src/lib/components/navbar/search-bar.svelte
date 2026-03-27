<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { SearchIcon } from '@lucide/svelte/icons';

	// VARIABLES
	let searchQuery = $state('');

	const handleSearch = (e: Event) => {
		e.preventDefault();
		console.log('Searching for:', searchQuery);
		// Implement search logic here
	};
</script>

<form onsubmit={handleSearch} class="relative w-full max-w-sm">
	<SearchIcon class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
	<Input type="search" placeholder="Search products..." bind:value={searchQuery} class="h-9 pl-9" />
</form>
