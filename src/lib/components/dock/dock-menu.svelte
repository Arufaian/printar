<script lang="ts">
	// Import icon dari @lucide/svelte
	import { House, LayoutDashboard, User } from '@lucide/svelte/icons';
	// Import komponen DockItem
	import DockItem from './dock-item.svelte';
	import type { Pathname } from '$app/types';
	import type { LucideIcon } from '@lucide/svelte/icons';

	// Tipe untuk item menu di dock
	// Icon menggunakan tipe any karena @lucide/svelte menggunakan tipe yang berbeda dengan Svelte ComponentType

	interface MenuItem {
		icon: LucideIcon; // Komponen icon dari @lucide/svelte
		label: string; // Teks label
		href: Pathname; // Link tujuan
		active?: boolean; // Status aktif
		badge?: number; // Badge count (opsional)
	}

	// Props untuk komponen DockMenu
	let {
		items, // Custom menu items (opsional)
		cartCount = 0, // Badge count untuk cart
		activePath
	}: {
		items?: MenuItem[];
		cartCount?: number;
		activePath?: Pathname;
	} = $props();

	// Default menu items jika tidak ada custom items
	const defaultItems: MenuItem[] = [
		{ icon: House, label: 'Home', href: '/' },
		{ icon: LayoutDashboard, label: 'Kategori', href: '/categories' },
		{ icon: User, label: 'Account', href: '/test' }
	];

	// Gunakan custom items jika ada, jika tidak gunakan default
	// $derived akan otomatis update jika items berubah
	let menuItems = $derived(
		(items ?? defaultItems).map((item) => ({
			...item,
			// Tambahkan badge ke cart item jika cartCount > 0
			badge: item.label === 'Cart' ? cartCount : item.badge,
			// Tentukan apakah item aktif berdasarkan activePath
			active: activePath ? item.href === activePath : item.active
		}))
	);
</script>

<!-- 
  DockMenu: Bottom navigation untuk mobile
  - Fixed di bagian bawah layar
  - Hanya tampil di mobile (md:hidden)
  - Style match dengan navbar (border, bg-background, backdrop-blur)
  - Safe area inset untuk iPhone notch
-->
<nav
	class="fixed right-0 bottom-0 left-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden"
>
	<!-- Safe area untuk device dengan notch (iPhone, dll) -->
	<div class="pb-[env(safe-area-inset-bottom)]">
		<!-- Container menu items -->
		<div class="flex items-center justify-around px-2">
			{#each menuItems as item (item.label)}
				<DockItem
					icon={item.icon}
					label={item.label}
					href={item.href}
					active={item.active}
					badge={item.badge}
				/>
			{/each}
		</div>
	</div>
</nav>
