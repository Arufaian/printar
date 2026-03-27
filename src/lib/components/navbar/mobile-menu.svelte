<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { XIcon, UserIcon, SettingsIcon, LogOutIcon } from '@lucide/svelte/icons';
	import { resolve } from '$app/paths';

	// VARIABLES
	let { isOpen = $bindable(false), navLinks }: Props = $props();

	const closeMenu = () => (isOpen = false);

	/** Props type */
	type Props = {
		isOpen: boolean;
		navLinks: Array<{ label: string; href: string }>;
	};
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
		onclick={closeMenu}
		transition:fade={{ duration: 200 }}
	></div>

	<!-- Menu Panel -->
	<div
		class="shadow-lg-xl fixed top-0 right-0 z-50 h-full w-full max-w-sm border-l bg-background"
		transition:fly={{ x: 300, duration: 300 }}
	>
		<div class="flex h-full flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Menu</h2>
				<Button size="icon" variant="ghost" class="size-9" onclick={closeMenu}>
					<XIcon class="size-5" />
				</Button>
			</div>

			<!-- Navigation Links -->
			<div class="flex-1 overflow-y-auto px-4 py-6">
				<div class="space-y-1">
					{#each navLinks as link (link)}
						<a
							href={resolve(`/`)}
							class="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
							onclick={closeMenu}
						>
							{link.label}
						</a>
					{/each}
				</div>

				<Separator class="my-6" />

				<!-- User Section -->
				<div class="space-y-1">
					<a
						href="#account"
						class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
						onclick={closeMenu}
					>
						<UserIcon class="size-5" />
						My Account
					</a>
					<a
						href="#settings"
						class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
						onclick={closeMenu}
					>
						<SettingsIcon class="size-5" />
						Settings
					</a>
					<button
						class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
						onclick={closeMenu}
					>
						<LogOutIcon class="size-5" />
						Sign Out
					</button>
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t px-6 py-4">
				<p class="text-xs text-muted-foreground">© 2024 DigitalPrint. All rights reserved.</p>
			</div>
		</div>
	</div>
{/if}
