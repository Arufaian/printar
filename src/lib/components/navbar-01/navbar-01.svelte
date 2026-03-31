<script lang="ts">
	import { resolve } from '$app/paths';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import { LayoutDashboard } from '@lucide/svelte/icons';

	import ThemeSwitch from '$lib/components/navbar/theme-switch.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let {
		cartCount = 3
	}: {
		cartCount?: number;
	} = $props();

	const sectionLinks: Array<{ href: `/#${string}`; label: string; description: string }> = [
		{
			href: '/#home',
			label: 'Home',
			description: 'Jump to our featured intro and latest highlights.'
		},
		{
			href: '/#categories',
			label: 'Categories',
			description: 'Browse grouped product types by campaign or intent.'
		},
		{
			href: '/#catalog-carousel',
			label: 'Catalog Carousel',
			description: 'Preview quick picks and current product recommendations.'
		}
	];
</script>

<nav class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
	<div
		class="mx-auto grid h-16 w-full max-w-11/12 grid-cols-3 items-center gap-4 px-3 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-8"
	>
		<a href={resolve('/#home')} class="flex items-center gap-2">
			<div
				class="flex size-9 items-center justify-center rounded-md bg-linear-to-br from-primary to-primary/60 text-sm font-semibold text-primary-foreground"
			>
				DP
			</div>
			<span class="hidden text-base font-semibold sm:inline">DigitalPrint</span>
		</a>

		<div class="flex items-center justify-center gap-2.5 sm:gap-3">
			<div class="flex-1">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium"
					>
						<div class="flex items-center justify-center gap-1.5">
							<LayoutDashboard class="size-4" /> <span>category</span>
						</div>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-md">
						<div class="grid grid-cols-2 gap-4">
							{#each sectionLinks as item (item)}
								<DropdownMenu.Item>
									<a href={resolve('/')}>
										<span class="text-base font-semibold">{item.label}</span>
										<p class="text-sm">{item.description}</p></a
									>
								</DropdownMenu.Item>
							{/each}
						</div>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<div class="flex-12">
				<Dialog.Root>
					<Dialog.Trigger
						type="button"
						class={`${buttonVariants({ variant: 'outline' })} h-11 w-full  justify-start rounded-full px-4 text-sm font-normal text-muted-foreground`}
					>
						Search....
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
							<Dialog.Description>
								This action cannot be undone. This will permanently delete your account and remove
								your data from our servers.
							</Dialog.Description>
						</Dialog.Header>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</div>

		<div class="flex items-center justify-end gap-2">
			<Button variant="outline">
				<ShoppingCartIcon class="size-5" />
			</Button>

			<ThemeSwitch />
			<Button class="h-9 px-4" variant="outline">register</Button>
			<Button class="h-9 px-4">Login</Button>
		</div>
	</div>
</nav>
