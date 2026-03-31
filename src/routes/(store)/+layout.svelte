<script lang="ts">
	import Footer from '$lib/components/footer/footer.svelte';
	import Navbar from '$lib/components/navbar/navbar.svelte';
	let { children } = $props();
</script>

<div>
	<!-- <Navbar /> -->
	<Navbar />

	{@render children()}
	<Footer />
</div>
