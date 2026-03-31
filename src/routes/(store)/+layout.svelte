<script lang="ts">
	import Footer from '$lib/components/footer/footer.svelte';
	import Navbar from '$lib/components/navbar/navbar.svelte';
	import Device from 'svelte-device-info';
	import DockMenu from '$lib/components/dock/dock-menu.svelte';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	let { children } = $props();
</script>

<div>
	<!-- <Navbar /> -->
	<Navbar />

	{@render children()}

	{#if Device.isPhone}
		<DockMenu activePath={page.url.pathname as Pathname} />
	{:else}
		<Footer />
	{/if}
</div>
