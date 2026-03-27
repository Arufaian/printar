<script lang="ts">
	import { MenuIcon, ShoppingCartIcon, UserIcon } from '@lucide/svelte';
	import MobileMenu from '$lib/components/navbar/mobile-menu.svelte';
	import CartDropdown from '$lib/components/navbar/cart-dropdown.svelte';
	import SearchBar from '$lib/components/navbar/search-bar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { resolve } from '$app/paths';
	import ThemeSwitch from './theme-switch.svelte';
	import AnnouncementBar from './announcement-bar.svelte';

	// VARIABLES
	let isMobileMenuOpen = $state(false);
	let isCartOpen = $state(false);
	let cartItemCount = $state(3);

	const navLinks = [
		{ label: 'Business Cards', href: '#business-cards' },
		{ label: 'Flyers & Posters', href: '#flyers' },
		{ label: 'Banners', href: '#banners' },
		{ label: 'Custom Prints', href: '#custom' },
		{ label: 'Design Services', href: '#design' }
	];
</script>

<AnnouncementBar />

<nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
	<div class="mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:max-w-11/12 lg:px-8">
		<!-- Logo -->
		<a href="#home" class="flex shrink-0 items-center gap-2">
			<div
				class="shadow-lg-lg flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground"
			>
				DP
			</div>
			<span class="hidden text-lg font-bold sm:inline-block">DigitalPrint</span>
		</a>

		<!-- Desktop Navigation Links -->
		<div class="hidden items-center gap-1 lg:flex">
			{#each navLinks as link (link)}
				<a
					href={resolve('/')}
					class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<div class="items-center gap-1 md:hidden">
			<SearchBar />
		</div>

		<!-- Right Section -->
		<div class="flex items-center gap-2">
			<!-- Search Bar (hidden on mobile) -->
			<div class="hidden md:block">
				<SearchBar />
			</div>

			<!-- Placeholder icon only: dark mode behavior intentionally disabled for now -->
			<!-- <div class="flex items-center gap-1 text-muted-foreground" aria-hidden="true">
				<SunIcon class="size-4" />
				<MoonIcon class="size-4" />
			</div> -->

			<ThemeSwitch />

			<!-- Cart Button -->
			<div class="relative">
				<Button
					size="icon"
					variant="ghost"
					class="size-9 shrink-0"
					onclick={() => (isCartOpen = !isCartOpen)}
				>
					<ShoppingCartIcon class="size-5" />
					{#if cartItemCount > 0}
						<Badge
							variant="destructive"
							class="absolute -top-1 -right-1 flex size-5 items-center justify-center p-0 text-xs"
						>
							{cartItemCount}
						</Badge>
					{/if}
				</Button>
				<CartDropdown bind:isOpen={isCartOpen} bind:itemCount={cartItemCount} />
			</div>

			<!-- User Account -->
			<Button size="icon" variant="ghost" class="hidden size-9 shrink-0 sm:flex">
				<UserIcon class="size-5" />
			</Button>

			<!-- Mobile Menu Button -->
			<Button
				size="icon"
				variant="ghost"
				class="size-9 shrink-0 lg:hidden"
				onclick={() => (isMobileMenuOpen = true)}
			>
				<MenuIcon class="size-5" />
			</Button>
		</div>
	</div>
</nav>

<MobileMenu bind:isOpen={isMobileMenuOpen} {navLinks} />
