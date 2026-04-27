<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import {
		customerProfileSchema,
		type CustomerProfileSchema
	} from '$lib/validation/customer/profile.schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const getInitialForm = () => data.form as SuperValidated<Infer<CustomerProfileSchema>>;
	const getInitialName = () => data.form.data.name?.trim() ?? '';

	const form = superForm(getInitialForm(), {
		validators: zod4Client(customerProfileSchema),
		multipleSubmits: 'prevent',
		onUpdated: async ({ form: updatedForm }) => {
			if (!updatedForm.message) return;

			if (updatedForm.message.type === 'success') {
				initialName = updatedForm.data.name.trim();
				toast.success(updatedForm.message.text);
				await invalidateAll();
				return;
			}

			if (updatedForm.message.type === 'error') {
				toast.error(updatedForm.message.text);
			}
		}
	});

	const { form: formData, enhance, submitting } = form;

	let initialName = $state(getInitialName());
	let normalizedName = $derived(($formData.name ?? '').trim());
	let isUnchanged = $derived(normalizedName === initialName);
	let isSubmitDisabled = $derived($submitting || normalizedName.length === 0 || isUnchanged);
</script>

<div class="space-y-6">
	<div class="space-y-1">
		<h1 class="text-lg font-semibold">Profil</h1>
		<p class="text-sm text-muted-foreground">Ubah nama yang ditampilkan pada akun Anda.</p>
	</div>

	<form method="POST" use:enhance class="max-w-xl space-y-4">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Nama</Form.Label>
					<Input {...props} placeholder="Masukkan nama lengkap" bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.Description>Huruf, spasi, tanda petik (') dan strip (-) diperbolehkan.</Form.Description
			>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button disabled={isSubmitDisabled}>
			{#if $submitting}
				<Spinner />
				Menyimpan...
			{:else}
				Simpan Perubahan
			{/if}
		</Form.Button>
	</form>
</div>
