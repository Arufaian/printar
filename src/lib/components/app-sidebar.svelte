<script lang="ts" module>
	import { Gauge } from '@lucide/svelte';
	import { LayoutGrid } from '@lucide/svelte';
	import { Package } from '@lucide/svelte';
	import { ShoppingBag } from '@lucide/svelte';

	// This is sample data.
	const data = {
		navMain: [
			{
				title: 'Dashboard',
				url: '/admin/dashboard',
				icon: Gauge
			},
			{
				title: 'Category',
				url: '/admin/categories',
				icon: LayoutGrid
			},
			{
				title: 'Products',
				url: '/admin/products',
				icon: Package
			}
		],
		operations: [
			{
				name: 'Orders',
				url: '/admin/orders',
				icon: ShoppingBag
			}
		]
	};
</script>

<script lang="ts">
	import UserStarIcon from '@lucide/svelte/icons/user-star';
	import NavMain from './nav-main.svelte';
	import NavProjects from './nav-projects.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import type { UserProfileData } from '$lib/types/user-profile';

	type AppSidebarProps = ComponentProps<typeof Sidebar.Root> & {
		user: UserProfileData;
	};

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		user,
		...restProps
	}: AppSidebarProps = $props();

	const displayName = $derived(user?.name?.trim() || 'Administrator');
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="pointer-events-none">
					<div
						class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
					>
						<UserStarIcon class="size-4" />
					</div>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-medium">Admin</span>
						<span class="truncate text-xs">{displayName}</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavProjects operations={data.operations} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
