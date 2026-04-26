<script lang="ts">
	import { page } from '$app/state';
	import type { LucideIcon } from '@lucide/svelte/icons';
	import { MapPin, ShoppingBag, User } from '@lucide/svelte/icons';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	let { children, data } = $props();

	type CustomerNavItem = {
		label: string;
		description: string;
		href: string;
		icon: LucideIcon;
	};

	const navItems: CustomerNavItem[] = [
		{
			label: 'Profil',
			description: 'Ubah nama dan data akun',
			href: '/customer/profile',
			icon: User
		},
		{
			label: 'Pesanan',
			description: 'Lihat riwayat dan status',
			href: '/customer/orders',
			icon: ShoppingBag
		},
		{
			label: 'Alamat',
			description: 'Kelola alamat pengiriman',
			href: '/customer/addresses',
			icon: MapPin
		}
	] as const;

	const getInitials = (name: string) =>
		name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('');

	const isActivePath = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

	let profileName = $derived(data.profile?.name?.trim() || 'Pelanggan');
	let profileEmail = $derived(data.profile?.email?.trim() || 'pelanggan@example.com');
	let profileInitials = $derived(getInitials(profileName) || 'PL');
</script>

<div class="mx-auto w-full">
	<div class="container mx-auto px-4 py-8 lg:px-8">
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
			<aside class="lg:col-span-4 xl:col-span-3">
				<div class="space-y-4 lg:sticky lg:top-24">
					<Card.Root class="shadow-sm">
						<Card.Content class="p-5">
							<div class="flex flex-col items-center justify-center gap-4">
								<Avatar.Root class="h-20 w-20 rounded-full border bg-muted/40">
									<Avatar.Fallback>{profileInitials}</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex min-w-0 flex-col items-center justify-center space-y-0.5">
									<p class="truncate text-sm font-semibold">{profileName}</p>
									<p class="truncate text-xs text-muted-foreground">{profileEmail}</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root class="gap-4 shadow-sm">
						<Card.Header>
							<Card.Title class="text-sm">Menu Akun</Card.Title>
						</Card.Header>
						<Card.Content class="px-2">
							{#each navItems as item (item.href)}
								<Item.Root class={isActivePath(item.href) ? 'bg-primary/20' : ''} size="sm">
									{#snippet child({ props })}
										<a href={resolve(item.href as Pathname)} {...props}>
											<Item.Media variant="icon">
												<item.icon class="size-4" />
											</Item.Media>
											<Item.Content>
												<Item.Title>{item.label}</Item.Title>
											</Item.Content>
										</a>
									{/snippet}
								</Item.Root>
							{/each}
						</Card.Content>
					</Card.Root>
				</div>
			</aside>

			<main class="min-w-0 lg:col-span-8 xl:col-span-9">
				<div class="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
</div>
