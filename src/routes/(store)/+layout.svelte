<script lang="ts">
	import Footer from '$lib/components/footer/footer.svelte';
	import Navbar from '$lib/components/navbar/navbar.svelte';
	import Device from 'svelte-device-info';
	import DockMenu from '$lib/components/dock/dock-menu.svelte';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import { onMount } from 'svelte';
	let { children, data } = $props();

	let userProfile = $derived(data.profile);

	let isPhone = $state(false);

	onMount(() => {
		isPhone = Device.isPhone;
	});
</script>

<div>
	<!-- <Navbar /> -->
	<Navbar {userProfile} />

	{@render children()}

	<div class:hidden={!isPhone} class="contents">
		<DockMenu activePath={page.url.pathname as Pathname} />
	</div>

	{#if !isPhone}
		<Footer />
	{/if}
</div>
