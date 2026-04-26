<script lang="ts">
	import './layout.css';
	import { navigating } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	// import { Toaster } from '$lib/components/ui/sonner';
	import { LoadingOverlay } from '$lib/components/ui/loading-overlay/index.js';
	import { Toaster } from '$lib/components/ui/sonner';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<Toaster richColors />

{#if navigating.to}
	<LoadingOverlay />
{/if}

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />

{@render children()}
