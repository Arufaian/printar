<script lang="ts">
	import { User, LogOut } from '@lucide/svelte/icons';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import type { UserProfile } from '$lib/types/user-profile';
	import { getInitials } from '$lib/utils/string';
	import { enhance } from '$app/forms';
	import Spinner from '../ui/spinner/spinner.svelte';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';

	let signOutForm = $state<HTMLFormElement>();
	let isLoading = $state(false);

	type Props = {
		userProfile: UserProfile;
	};

	let { userProfile }: Props = $props();

	const name = $derived(userProfile?.name ?? 'Guest');
</script>

<form
	action={`${resolve('/')}sign-out`}
	method="POST"
	bind:this={signOutForm}
	use:enhance={() => {
		isLoading = true;
		return async ({ result, update }) => {
			if (result.type === 'failure') {
				const message =
					typeof result.data?.message === 'string'
						? result.data.message
						: 'Gagal logout, silakan coba lagi.';
				toast.error(message);
				isLoading = false;
				return;
			}

			if (result.type === 'error') {
				toast.error('Terjadi gangguan saat logout. Silakan coba lagi.');
				isLoading = false;
				return;
			}

			await update();
			isLoading = false;
		};
	}}
	class="hidden"
></form>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="h-16">
		<Avatar.Root size="lg">
			<div class="flex w-full items-center justify-center">
				<Avatar.Fallback class="bg-primary text-primary-foreground">
					{getInitials(name)}
				</Avatar.Fallback>
			</div>
		</Avatar.Root>
	</DropdownMenu.Trigger>

	<DropdownMenu.Content class=" mr-8  w-32 ">
		<a href={resolve('/customer/profile')}>
			<DropdownMenu.Item>
				<User />
				Profile
			</DropdownMenu.Item>
		</a>
		<DropdownMenu.Separator />

		<DropdownMenu.Item
			variant="destructive"
			class="cursor-pointer"
			onclick={() => {
				if (!isLoading && signOutForm) {
					signOutForm.requestSubmit();
				}
			}}
		>
			{#if isLoading}
				<Spinner />
			{:else}
				<LogOut />
				logout
			{/if}
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
