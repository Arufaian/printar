<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	import {
		FormButton,
		FormControl,
		FormField,
		FormFieldErrors,
		FormLabel
	} from '$lib/components/ui/form';

	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { signInSchema, type SignInSchema } from '$lib/validation/auth/sign-in.schema';
	import Spinner from './ui/spinner/spinner.svelte';
	import { goto } from '$app/navigation';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		data: { form: SuperValidated<Infer<SignInSchema>> };
	}

	let { class: className, data, ...restProps }: Props = $props();

	const initialForm = () => data.form;

	const form = superForm(initialForm(), {
		validators: zod4Client(signInSchema),
		multipleSubmits: 'prevent',

		onUpdated({ form }) {
			if (form.message) {
				if (form.message.type === 'success') {
					toast.success(form.message.text);
					setTimeout(() => {
						goto(resolve('/'));
					}, 1500);
				} else if (form.message.type === 'error') {
					toast.error(form.message.text);
				}
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Welcome back</Card.Title>
			<Card.Description>Masuk dengan email dan password Anda</Card.Description>
		</Card.Header>
		<Card.Content>
			<form use:enhance class="space-y-4" method="POST">
				<FormField {form} name="email">
					<FormControl>
						{#snippet children({ props })}
							<FormLabel>Email</FormLabel>
							<Input
								{...props}
								type="email"
								bind:value={$formData.email}
								placeholder="m@example.com"
							/>
						{/snippet}
					</FormControl>
					<FormFieldErrors />
				</FormField>

				<FormField {form} name="password">
					<FormControl>
						{#snippet children({ props })}
							<div class="flex items-center">
								<FormLabel>Password</FormLabel>

								<a href="##" class="ms-auto text-sm underline-offset-4 hover:underline">
									Lupa password?
								</a>
							</div>
							<Input {...props} type="password" bind:value={$formData.password} />
						{/snippet}
					</FormControl>
					<FormFieldErrors />
				</FormField>

				<FormButton disabled={$submitting} class="w-full ">
					{#if $submitting}
						<Spinner />
						Loading...
					{:else}
						Sign in
					{/if}
				</FormButton>

				<div class="text-center text-sm text-muted-foreground">
					Belum punya akun? <a href={resolve('/sign-up')} class="underline underline-offset-4"
						>Sign up</a
					>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
