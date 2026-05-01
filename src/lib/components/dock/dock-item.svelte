<script lang="ts">
	// Import utility untuk merge class Tailwind
	import { cn } from '$lib/utils.js';
	import type { LucideIcon } from '@lucide/svelte';

	// Props untuk komponen DockItem
	// Icon menggunakan tipe any karena @lucide/svelte menggunakan tipe yang berbeda dengan Svelte ComponentType
	let {
		icon: Icon, // Komponen icon (contoh: Home, Search dari @lucide/svelte)
		label, // Teks label di bawah icon
		href, // Link tujuan saat diklik
		active = false, // Status aktif (highlight item)
		badge, // Badge count (opsional, untuk cart)
		ref = $bindable(null) // Referensi ke elemen anchor
	}: {
		icon: LucideIcon;
		label: string;
		href: `/${string}`;
		active?: boolean;
		badge?: number;
		ref?: HTMLAnchorElement | null;
	} = $props();
</script>

<!-- 
  DockItem: Item individual di dock menu
  - Menggunakan <a> tag untuk navigasi
  - Active state dengan warna primary
  - Badge untuk notifikasi (misal: cart count)
-->
<a
	bind:this={ref}
	{href}
	class={cn(
		'flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
		// Jika active, gunakan warna primary; jika tidak, gunakan muted-foreground
		active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
	)}
>
	<!-- Container icon dengan badge -->
	<div class="relative">
		<!-- Render komponen icon -->
		<Icon class="size-5" />

		<!-- Badge (jika ada) -->
		{#if badge !== undefined && badge > 0}
			<span
				class="text-destructive-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold"
			>
				{badge > 99 ? '99+' : badge}
			</span>
		{/if}
	</div>

	<!-- Label teks -->
	<span class="truncate">{label}</span>
</a>
