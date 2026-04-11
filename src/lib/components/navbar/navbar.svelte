<script lang="ts">
	import { resolve } from '$app/paths';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import { LayoutDashboard, Search } from '@lucide/svelte/icons';

	import ThemeSwitch from '$lib/components/navbar/theme-switch.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { getInitials } from '$lib/utils/string';
	import type { UserProfile } from '$lib/types/user-profile';

	type Props = {
		cartCount?: number;
		userProfile?: UserProfile | null;
	};

	let { cartCount = 3, userProfile = null }: Props = $props();

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
	<div class="container mx-auto flex h-16 items-center gap-2 px-4 sm:gap-3 lg:gap-4 lg:px-8">
		<a href={resolve('/#home')} class="flex shrink-0 items-center gap-2">
			<div
				class="flex size-9 items-center justify-center rounded-md bg-linear-to-br from-primary to-primary/60 text-sm font-semibold text-primary-foreground"
			>
				DP
			</div>
			<span class="hidden text-base font-semibold md:inline">DigitalPrint</span>
		</a>

		<div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
			<div class="shrink-0">
				<!-- todo: later on i'll use hooks if mobile device -->
				<div class="hidden md:inline-flex">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="inline-flex h-16 items-center gap-1.5 rounded-md  px-2 text-sm font-medium ring-0 sm:px-3"
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
			</div>

			<div class="min-w-0 flex-1">
				<Dialog.Root>
					<Dialog.Trigger
						type="button"
						class={`${buttonVariants({ variant: 'outline' })}  h-11 w-full max-w-lg justify-start rounded-full px-4 text-sm font-normal text-muted-foreground `}
					>
						<Search class="mr-2 size-4" />
						<span class=" inline-flex">Cari produk...</span>
					</Dialog.Trigger>
					<Dialog.Content showCloseButton={false}>
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

		<div class="flex shrink-0 items-center justify-end gap-2">
			<Button variant="outline" class="relative ">
				{#if cartCount > 0}
					<Badge
						class="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
						variant="destructive"
					>
						{cartCount}
					</Badge>
				{/if}
				<ShoppingCartIcon class="size-5 stroke-2" />
			</Button>

			<ThemeSwitch />

			{#if userProfile}
				<Avatar.Root size="lg">
					<div class="flex w-full items-center justify-center">
						<Avatar.Fallback class="bg-primary text-primary-foreground"
							>{getInitials(userProfile.name)}</Avatar.Fallback
						>
					</div>
				</Avatar.Root>
			{:else}
				<div class="">
					<a href={resolve('/sign-up')}>
						<Button class="hidden h-9 px-4 sm:inline-flex" variant="outline">sign up</Button>
					</a>
					<Button class="hidden h-9 px-4 sm:inline-flex">Login</Button>
				</div>
			{/if}
		</div>
	</div>
</nav>
