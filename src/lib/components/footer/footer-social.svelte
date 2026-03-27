<script lang="ts">
	import Icon from '@iconify/svelte';
	const social = [
		{ name: 'Facebook', href: 'https://facebook.com', icon: 'facebook-with-circle' },
		{ name: 'Instagram', href: 'https://instagram.com', icon: 'instagram-with-circle' }
	];
</script>

<div class="flex items-center gap-3">
	{#each social as item (item)}
		<a
			href={item.href}
			target="_blank"
			rel="noopener noreferrer"
			class="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all duration-200 hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
			aria-label={item.name}
		>
			<Icon icon="entypo-social:{item.icon}" class="size-5" />
		</a>
	{/each}
</div>
