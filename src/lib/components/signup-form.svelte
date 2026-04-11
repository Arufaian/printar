<script lang="ts">
	import { cn } from '$lib/utils.js';
	import * as Card from '$lib/components/ui/card/index.js';

	import * as Form from '$lib/components/ui/form/index.js';
	import { signupSchema, type SignUpSchema } from '$lib/validation/auth/sign-up.schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

	import { Input } from '$lib/components/ui/input/index.js';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		data: { form: SuperValidated<Infer<SignUpSchema>> };
	}

	let { class: className, data, ...restProps }: Props = $props();

	const initialForm = () => data.form;

	const form = superForm(initialForm(), {
		validators: zod4Client(signupSchema),
		multipleSubmits: 'prevent',

		onUpdated({ form }) {
			if (form.message) {
				if (form.message.type === 'success') {
					toast.success(form.message.text);
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
			<Card.Title class="text-xl">Create your account</Card.Title>
			<Card.Description>Enter your email below to create your account</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-4">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Full Name</Form.Label>
							<Input {...props} bind:value={$formData.name} placeholder="John Doe" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input
								{...props}
								type="email"
								bind:value={$formData.email}
								placeholder="m@example.com"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="grid grid-cols-2 gap-4">
					<Form.Field {form} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Password</Form.Label>
								<Input {...props} type="password" bind:value={$formData.password} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="confirmPassword">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Confirm Password</Form.Label>
								<Input {...props} type="password" bind:value={$formData.confirmPassword} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<div class="mt-2 flex flex-col gap-4">
					<Form.Button disabled={$submitting}>
						{#if $submitting}
							<Spinner />
							loading...
						{:else}
							Sign Up
						{/if}
					</Form.Button>
					<div class="text-center text-sm text-muted-foreground">
						Already have an account? <a href="#/" class="underline underline-offset-4">Sign in</a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
