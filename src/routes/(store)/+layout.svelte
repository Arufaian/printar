<script lang="ts">
	import Footer from '$lib/components/footer/footer.svelte';
	// import Navbar from '$lib/components/navbar/navbar.svelte';
	import Navbar01 from '$lib/components/navbar-01/navbar-01.svelte';
	let { children } = $props();
</script>

<div>
	<!-- <Navbar /> -->
	<Navbar01 />

	{@render children()}
	<Footer />
</div>
