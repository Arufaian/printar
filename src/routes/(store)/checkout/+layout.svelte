<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Stepper from '$lib/components/ui/stepper';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { checkoutDraft } from '$lib/features/checkout/state/checkout-draft.svelte';
	import { formatCurrency } from '$lib/utils/string';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { paymentController } from './payment/payment-controller.svelte';

	let { children } = $props();

	const activeStepId = $derived(checkoutDraft.getStepFromPathname(page.url.pathname));
	const activeStepNumber = $derived(checkoutDraft.getStepNumber(activeStepId));
	const previousPath = $derived(checkoutDraft.getPreviousPath(activeStepId));
	const nextPath = $derived(checkoutDraft.getNextPath(activeStepId));
	const intentId = $derived(String(page.data?.intentId ?? ''));
	const selectedSubtotal = $derived(Number(page.data?.selectedSubtotal ?? 0));
	const shippingCost = $derived(Number(page.data?.shippingCost ?? 0));
	const total = $derived(Number(page.data?.grandTotal ?? selectedSubtotal + shippingCost));

	const canProceed = $derived.by(() => {
		if (activeStepId === 'shipping') {
			const selectedAddressId = page.data?.selectedAddressId;
			const selectedDeliveryMethod = page.data?.selectedDeliveryMethod;
			return Boolean(selectedAddressId && selectedDeliveryMethod);
		}

		return checkoutDraft.canProceedFromStep(activeStepId);
	});
	const isPreviousDisabled = $derived(previousPath === null);
	const isNextDisabled = $derived(nextPath === null || !canProceed);

	const navigateTo = async (path: string | null) => {
		if (!path) return;
		const target = resolve(path as Pathname);
		const query = intentId ? `?intentId=${encodeURIComponent(intentId)}` : '';
		await goto(`${target}${query}`);
	};

	const getStepIconLabel = (stepId: string) => {
		if (stepId === 'shipping') return 'Shipping';
		if (stepId === 'review') return 'Review';
		return 'Payment';
	};

	const nextStepTitle = $derived.by(() => {
		if (!nextPath) return 'langkah berikutnya';
		const matchedStep = checkoutDraft.steps.find((step) => step.path === nextPath);
		return matchedStep?.title ?? 'langkah berikutnya';
	});

	const handleSummaryAction = async () => {
		if (activeStepId === 'payment') {
			await paymentController.createPaymentTransaction(intentId);
			return;
		}

		await navigateTo(nextPath);
	};
</script>

<div class="container mx-auto px-4 py-8 lg:px-8">
	<div class="mx-auto max-w-6xl space-y-6">
		<header class="space-y-2">
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Selesaikan Pesanan Anda</h1>
			<p class="text-sm text-muted-foreground md:text-base">
				Ikuti setiap langkah untuk memastikan data pengiriman, rincian pesanan, dan pembayaran
				terisi dengan benar.
			</p>
		</header>

		<Stepper.Root step={activeStepNumber}>
			<Stepper.Nav class="w-full" orientation="horizontal">
				{#each checkoutDraft.steps as step (step.id)}
					<Stepper.Item>
						<Stepper.Trigger disabled class="flex flex-col items-center">
							<Stepper.Indicator>
								<span class="sr-only">{getStepIconLabel(step.id)}</span>
								{#if step.id === 'shipping'}
									<svg viewBox="0 0 24 24" fill="none" class="size-4" aria-hidden="true">
										<path
											d="M3 7h11v8H3zM14 10h3.5L21 13v2h-7zM7 19a1.5 1.5 0 1 0 0 .01M17 19a1.5 1.5 0 1 0 0 .01"
											stroke="currentColor"
											stroke-width="1.8"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{:else if step.id === 'review'}
									<svg viewBox="0 0 24 24" fill="none" class="size-4" aria-hidden="true">
										<path
											d="M8 6h13M8 12h13M8 18h13M3 6.5l1.2 1.2L6.8 5.1M3 12.5l1.2 1.2 2.6-2.6M3 18.5l1.2 1.2 2.6-2.6"
											stroke="currentColor"
											stroke-width="1.8"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{:else}
									<svg viewBox="0 0 24 24" fill="none" class="size-4" aria-hidden="true">
										<path
											d="M3 8.5h18v10H3zM3 12h18M7 16h3"
											stroke="currentColor"
											stroke-width="1.8"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{/if}
							</Stepper.Indicator>
							<div class="my-2 hidden flex-col lg:flex">
								<Stepper.Title class="text-sm leading-tight md:text-base">
									{step.title}
								</Stepper.Title>
							</div>
						</Stepper.Trigger>
						<Stepper.Separator class="lg:left-[calc(60px)]" />
					</Stepper.Item>
				{/each}
			</Stepper.Nav>

			<div class="flex items-center justify-between gap-3">
				<Stepper.Previous disabled={isPreviousDisabled}>
					{#snippet child({ props })}
						<Button {...props} onclick={() => navigateTo(previousPath)}>Sebelumnya</Button>
					{/snippet}
				</Stepper.Previous>
				<p class="text-sm text-muted-foreground">
					Langkah {activeStepNumber} dari {checkoutDraft.steps.length}:
					{checkoutDraft.steps[activeStepNumber - 1].title}
				</p>
				<Stepper.Next disabled={isNextDisabled}>
					{#snippet child({ props })}
						<Button {...props} onclick={() => navigateTo(nextPath)}>Lanjut</Button>
					{/snippet}
				</Stepper.Next>
			</div>
		</Stepper.Root>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
			<div class="space-y-6 lg:col-span-8">
				{@render children()}
			</div>

			<div class="lg:col-span-4">
				<Card class="lg:sticky lg:top-24">
					<CardHeader class="space-y-1.5 border-b">
						<CardTitle>Ringkasan Pesanan</CardTitle>
						<CardDescription>Total biaya belanja Anda saat ini.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4 pt-6">
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<span>Subtotal</span>
							<span>{formatCurrency(selectedSubtotal)}</span>
						</div>
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<span>Ongkos Kirim</span>
							<span>{formatCurrency(shippingCost)}</span>
						</div>
						<Separator />
						<div class="flex items-center justify-between text-base font-semibold">
							<span>Total</span>
							<span>{formatCurrency(total)}</span>
						</div>
					</CardContent>
					<CardFooter>
						<div class="flex flex-col items-center justify-center">
							<Button
								class="w-full"
								size="lg"
								disabled={activeStepId === 'payment'
									? paymentController.isCreatingTransaction ||
										!paymentController.isScriptReady ||
										paymentController.showOrdersRedirectCta
									: isNextDisabled}
								onclick={handleSummaryAction}
							>
								{#if activeStepId === 'payment'}
									{#if paymentController.isCreatingTransaction}
										Menyiapkan pembayaran...
									{:else if !paymentController.isScriptReady}
										Memuat Midtrans...
									{:else}
										Bayar Sekarang
									{/if}
								{:else}
									Lanjut ke {nextStepTitle}
								{/if}
							</Button>
							{#if activeStepId === 'payment' && paymentController.showOrdersRedirectCta}
								<Button
									variant="outline"
									class="mt-2 w-full"
									onclick={() => (window.location.href = '/customer/orders')}
								>
									Lanjutkan di Pesanan Saya
								</Button>

								<p class="mt-3 text-center text-xs text-muted-foreground">
									Sesi pembayaran sebelumnya tidak bisa dilanjutkan dari halaman ini.
								</p>
							{/if}
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	</div>
</div>
