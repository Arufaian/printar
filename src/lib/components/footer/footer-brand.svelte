<script lang="ts">
	import { resolve } from '$app/paths';
	import logo from '$lib/assets/logo.png';
</script>

<div class="flex flex-col gap-4">
	<a href={resolve('/')} class="group flex items-center gap-2" aria-label="PrintHub Home">
		<figure class="flex w-full items-center">
			<enhanced:img
				src={logo}
				alt="logo"
				class="  w-32 object-cover transition duration-300 hover:grayscale"
			/>
		</figure>
	</a>
	<p class="text-sm font-medium text-muted-foreground">Professional Digital Printing Solutions</p>
	<p class="max-w-xs text-sm text-muted-foreground">
		Your trusted partner for high-quality printing services since 2020.
	</p>
</div>
