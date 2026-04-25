<script lang="ts">
	import { resolve } from '$app/paths';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import { LayoutDashboard, Search } from '@lucide/svelte/icons';

	import ThemeSwitch from '$lib/components/navbar/theme-switch.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import logo from '$lib/assets/logo.png';

	import type { UserProfile } from '$lib/types/user-profile';

	import UserDropdown from './user-dropdown.svelte';

	type Props = {
		cartCount?: number;
		userProfile?: UserProfile | null;
	};

	let { cartCount = 3, userProfile = null }: Props = $props();
</script>

<nav class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
	<div class="container mx-auto flex h-16 items-center gap-2 px-4 sm:gap-3 lg:gap-4 lg:px-8">
		<a href={resolve('/')} class="flex shrink-0 items-center" aria-label="home">
			<figure class="flex w-full items-center">
				<enhanced:img
					src={logo}
					alt="logo"
					class=" h-16 w-48 object-cover transition duration-300 hover:grayscale"
				/>
			</figure>
		</a>

		<div class="ml-2 flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
			<div class="shrink-0">
				<!-- todo: later on i'll use hooks if mobile device -->
				<div class="hidden md:inline-flex">
					<div class="flex items-center justify-center">
						<a href={resolve('/categories')}>
							<Button variant="link">
								<LayoutDashboard class="size-4" />
								Kategori</Button
							>
						</a>
					</div>
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
				<UserDropdown {userProfile} />
			{:else}
				<div class="">
					<a href={resolve('/sign-up')}>
						<Button class="hidden h-9 px-4 sm:inline-flex" variant="outline">Sign up</Button>
					</a>

					<a href={resolve('/sign-in')}>
						<Button class="hidden h-9 px-4 sm:inline-flex">Sign in</Button>
					</a>
				</div>
			{/if}
		</div>
	</div>
</nav>
