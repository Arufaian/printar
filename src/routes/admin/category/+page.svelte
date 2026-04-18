<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { DataTable } from '$lib/components/ui/data-table/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import { insertCategoriesSchema } from '$lib/validation/category/category.schema';
	import { createColumns, type Category } from './columns.js';
	import type { PageData } from './$types';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';

	let { data }: { data: PageData } = $props();

	let open = $state(false);
	let mode = $state<'create' | 'edit'>('create');

	const slugify = (value: string) =>
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');

	const getInitialForm = () => data.form;
	const getTableData = (): Category[] =>
		data.response.map((item) => ({
			id: item.id,
			name: item.name,
			slug: item.slug
		}));

	const form = superForm(getInitialForm(), {
		validators: zod4Client(insertCategoriesSchema),
		multipleSubmits: 'prevent',
		resetForm: false,
		onUpdated: async ({ form }) => {
			if (!form.message) return;

			if (form.message.type === 'success') {
				toast.success(form.message.text);
				open = false;
				mode = 'create';
				await invalidateAll();
			} else if (form.message.type === 'error') {
				toast.error(form.message.text);
			}
		}
	});

	const { form: formData, enhance, submitting } = form;

	const openCreateModal = () => {
		mode = 'create';
		$formData.id = undefined;
		$formData.name = '';
		$formData.slug = '';
		open = true;
	};

	const onEdit = (category: Category) => {
		mode = 'edit';
		$formData.id = category.id;
		$formData.name = category.name ?? '';
		$formData.slug = slugify(category.name ?? '');
		open = true;
	};

	const onDelete = async (category: Category) => {
		const categoryName = category.name ?? category.slug ?? 'kategori ini';
		const confirmed = confirm(`Hapus ${categoryName}? Tindakan ini tidak dapat dibatalkan.`);

		if (!confirmed) {
			return;
		}

		const payload = new FormData();
		payload.set('id', category.id);

		const response = await fetch('?/delete', {
			method: 'POST',
			body: payload,
			headers: {
				'x-sveltekit-action': 'true'
			}
		});

		const result = deserialize(await response.text());

		if (result.type === 'success') {
			const message =
				typeof result.data?.text === 'string' ? result.data.text : 'Kategori berhasil dihapus.';

			toast.success(message);
			await invalidateAll();
			return;
		}

		if (result.type === 'failure') {
			const message =
				typeof result.data?.message === 'string'
					? result.data.message
					: 'Gagal menghapus kategori. Silakan coba lagi.';

			toast.error(message);
			return;
		}

		toast.error('Terjadi gangguan saat menghapus kategori. Silakan coba lagi.');
	};

	const columns = createColumns({ onEdit, onDelete });

	$effect(() => {
		const generatedSlug = slugify(($formData.name ?? '').toString());
		if ($formData.slug !== generatedSlug) {
			$formData.slug = generatedSlug;
		}
	});
</script>

<section>
	<div>
		<Dialog.Root bind:open>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} onclick={openCreateModal}>Add category</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>{mode === 'edit' ? 'Edit category' : 'Add category'}</Dialog.Title>
					<Dialog.Description>
						{mode === 'edit'
							? 'Perbarui data kategori yang dipilih.'
							: 'Tambahkan kategori baru untuk produk Anda.'}
					</Dialog.Description>
				</Dialog.Header>

				<form method="POST" action="?/upsert" use:enhance class="space-y-4">
					<input type="hidden" name="id" bind:value={$formData.id} />

					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name</Form.Label>
								<Input {...props} bind:value={$formData.name} placeholder="Contoh: Kartu Nama" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="slug">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Slug</Form.Label>
								<Input
									{...props}
									bind:value={$formData.slug}
									readonly
									placeholder="slug-kategori"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Dialog.Footer>
						<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
							Cancel
						</Dialog.Close>
						<Button type="submit" disabled={$submitting}>
							{mode === 'edit' ? 'Save changes' : 'Create category'}
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<DataTable
		data={getTableData()}
		{columns}
		filterColumnId="name"
		filterPlaceholder="Filter categories..."
	/>
</section>
