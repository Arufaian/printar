<script lang="ts">
	import { enhance as kitEnhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		customerAddressSchema,
		type CustomerAddressSchema
	} from '$lib/validation/customer/address.schema';
	import { Edit3, MapPin, Phone, Plus, Trash2 } from '@lucide/svelte/icons';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	type AddressItem = {
		id: string;
		addressLine: string | null;
		city: string | null;
		postalCode: string | null;
		phone: string | null;
		createdAt: unknown;
	};

	let { data }: { data: PageData } = $props();

	let open = $state(false);
	let mode = $state<'create' | 'edit'>('create');
	let deleteDialogOpen = $state(false);
	let selectedAddress = $state<AddressItem | null>(null);

	const getInitialForm = () => data.form as SuperValidated<Infer<CustomerAddressSchema>>;
	const getAddresses = (): AddressItem[] => data.response as AddressItem[];
	let addressesList = $derived(getAddresses());

	const form = superForm(getInitialForm(), {
		validators: zod4Client(customerAddressSchema),
		multipleSubmits: 'prevent',
		resetForm: false,
		onUpdated: async ({ form: updatedForm }) => {
			if (!updatedForm.message) return;

			if (updatedForm.message.type === 'success') {
				toast.success(updatedForm.message.text);
				open = false;
				mode = 'create';
				await invalidateAll();
				return;
			}

			if (updatedForm.message.type === 'error') {
				toast.error(updatedForm.message.text);
			}
		}
	});

	const { form: formData, enhance: enhanceUpsert, submitting } = form;

	const openCreateModal = () => {
		mode = 'create';
		$formData.id = undefined;
		$formData.addressLine = '';
		$formData.city = '';
		$formData.postalCode = '';
		$formData.phone = '';
		open = true;
	};

	const onEdit = (address: AddressItem) => {
		mode = 'edit';
		$formData.id = address.id;
		$formData.addressLine = address.addressLine ?? '';
		$formData.city = address.city ?? '';
		$formData.postalCode = address.postalCode ?? '';
		$formData.phone = address.phone ?? '';
		open = true;
	};

	const onDelete = (address: AddressItem) => {
		selectedAddress = address;
		deleteDialogOpen = true;
	};

	const formatAddressMeta = (address: AddressItem) => {
		const city = address.city?.trim() || '-';
		const postalCode = address.postalCode?.trim() || '-';
		const phone = address.phone?.trim() || '-';

		return `${city} • ${postalCode} • ${phone}`;
	};

	$effect(() => {
		if (!deleteDialogOpen) {
			selectedAddress = null;
		}
	});
</script>

<section class="space-y-6">
	<form
		id="delete-address-form"
		method="POST"
		action="?/delete"
		class="hidden"
		use:kitEnhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					const message =
						typeof result.data?.text === 'string' ? result.data.text : 'Alamat berhasil dihapus.';

					toast.success(message);
					deleteDialogOpen = false;
					selectedAddress = null;
					await update();
					await invalidateAll();
					return;
				}

				if (result.type === 'failure') {
					const message =
						typeof result.data?.message === 'string'
							? result.data.message
							: 'Gagal menghapus alamat. Silakan coba lagi.';

					toast.error(message);
					return;
				}

				toast.error('Terjadi gangguan saat menghapus alamat. Silakan coba lagi.');
			};
		}}
	>
		<input type="hidden" name="id" value={selectedAddress?.id ?? ''} />
	</form>

	<div class="flex items-center justify-between gap-4">
		<div>
			<h1 class="text-lg font-semibold">Alamat</h1>
			<p class="text-sm text-muted-foreground">Kelola beberapa alamat pengiriman Anda.</p>
		</div>
		<Button type="button" onclick={openCreateModal} aria-label="Tambah alamat baru">
			<Plus class="size-4" />
			Tambah Alamat
		</Button>
	</div>

	{#if addressesList.length === 0}
		<div class="rounded-xl border border-dashed p-6 text-center">
			<p class="text-sm text-muted-foreground">Belum ada alamat tersimpan.</p>
			<Button type="button" class="mt-4" variant="outline" onclick={openCreateModal}
				>Tambah Alamat Pertama</Button
			>
		</div>
	{:else}
		<div class="space-y-3">
			{#each addressesList as address (address.id)}
				<Item.Root variant="outline">
					<Item.Media variant="icon">
						<MapPin class="size-4" />
					</Item.Media>
					<Item.Content>
						<Item.Title>{address.addressLine?.trim() || 'Alamat tanpa detail'}</Item.Title>
						<Item.Description>{formatAddressMeta(address)}</Item.Description>
					</Item.Content>
					<Item.Actions class="items-center gap-1">
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label={`Ubah alamat ${address.addressLine ?? ''}`}
							onclick={() => onEdit(address)}
						>
							<Edit3 class="size-4" />
						</Button>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							class="text-destructive hover:text-destructive"
							aria-label={`Hapus alamat ${address.addressLine ?? ''}`}
							onclick={() => onDelete(address)}
						>
							<Trash2 class="size-4" />
						</Button>
					</Item.Actions>
				</Item.Root>
			{/each}
		</div>
	{/if}

	<Dialog.Root bind:open>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>{mode === 'edit' ? 'Ubah alamat' : 'Tambah alamat'}</Dialog.Title>
				<Dialog.Description>
					{mode === 'edit'
						? 'Perbarui alamat yang dipilih untuk pengiriman.'
						: 'Tambahkan alamat baru untuk pengiriman pesanan Anda.'}
				</Dialog.Description>
			</Dialog.Header>

			<form method="POST" action="?/upsert" use:enhanceUpsert class="space-y-4">
				<input type="hidden" name="id" bind:value={$formData.id} />

				<Form.Field {form} name="addressLine">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Alamat lengkap</Form.Label>
							<Textarea {...props} bind:value={$formData.addressLine} rows={3} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Form.Field {form} name="city">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Kota</Form.Label>
								<Input {...props} bind:value={$formData.city} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="postalCode">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Kode pos</Form.Label>
								<Input {...props} bind:value={$formData.postalCode} inputmode="numeric" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<Form.Field {form} name="phone">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Nomor telepon</Form.Label>
							<div class="relative">
								<Phone
									class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input {...props} bind:value={$formData.phone} class="pl-9" />
							</div>
						{/snippet}
					</Form.Control>
					<Form.Description>
						Pastikan nomor telepon aktif dan tersambung dengan WhatsApp.
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Dialog.Footer>
					<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}
						>Batal</Dialog.Close
					>
					<Button type="submit" disabled={$submitting}>
						{#if $submitting}
							<Spinner />
							Menyimpan...
						{:else}
							{mode === 'edit' ? 'Simpan perubahan' : 'Tambah alamat'}
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<AlertDialog.Root bind:open={deleteDialogOpen}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Hapus alamat ini?</AlertDialog.Title>
				<AlertDialog.Description>
					Alamat <strong>{selectedAddress?.addressLine ?? '-'}</strong> akan dihapus permanen.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Batal</AlertDialog.Cancel>
				<AlertDialog.Action type="submit" form="delete-address-form" variant="destructive">
					Hapus alamat
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</section>
