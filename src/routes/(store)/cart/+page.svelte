<script lang="ts">
	import { PUBLIC_BUCKET_NAME } from '$env/static/public';
	import { applyAction, enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import {
		CartEmptyState,
		CartHeader,
		CartItemCard,
		CartSelectAll,
		CartSummary
	} from '$lib/components/cart/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import type { CartItemData } from '$lib/types/cart';
	import type { PageProps } from './$types';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();

	const cartItems = $derived<CartItemData[]>(data.cartItems);
	const shippingCost = $derived(data.summary.shippingCost);

	let deselectedItemIds = $state<string[]>([]);
	const selectedItemIds = $derived(
		cartItems.filter((item) => !deselectedItemIds.includes(item.id)).map((item) => item.id)
	);
	let attachDesignItemId = $state('');
	let attachDesignFilePath = $state('');
	let isUploadingDesign = $state(false);
	let uploadingDesignItemId = $state<string | null>(null);

	const MAX_DESIGN_FILE_SIZE_BYTES = 2 * 1024 * 1024;
	const categoriesHref = resolve('/categories');

	const formatItemMeta = (item: CartItemData) => {
		if (item.options.length === 0) return item.variant;
		return `${item.variant} • ${item.options.join(', ')}`;
	};

	const isAllSelected = $derived(
		cartItems.length > 0 && cartItems.every((item) => selectedItemIds.includes(item.id))
	);

	const selectedItems = $derived(cartItems.filter((item) => selectedItemIds.includes(item.id)));
	const selectedCount = $derived(selectedItems.length);
	const selectedSubtotal = $derived(
		selectedItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
	);
	const grandTotal = $derived(selectedSubtotal + (selectedCount > 0 ? shippingCost : 0));

	const toggleSelectAll = (checked: boolean) => {
		deselectedItemIds = checked ? [] : cartItems.map((item) => item.id);
	};

	const toggleSelectItem = (itemId: string, checked: boolean) => {
		if (checked) {
			if (deselectedItemIds.includes(itemId)) {
				deselectedItemIds = deselectedItemIds.filter((id) => id !== itemId);
			}
			return;
		}

		if (!deselectedItemIds.includes(itemId)) {
			deselectedItemIds = [...deselectedItemIds, itemId];
		}
	};

	const getNextQuantity = (item: CartItemData, delta: number) => {
		const rawNext = item.quantity + delta;
		const upperBound = item.stock > 0 ? item.stock : Number.MAX_SAFE_INTEGER;
		return Math.max(1, Math.min(rawNext, upperBound));
	};

	const createDesignFilePath = (userId: string, fileName: string) => {
		const extension = fileName.split('.').pop()?.toLowerCase() ?? 'bin';
		return `customer-design/${userId}/${crypto.randomUUID()}.${extension}`;
	};

	const getDesignFileUrl = (designFilePath: string | null) => {
		if (!designFilePath || !page.data.supabase) return '';
		const { data } = page.data.supabase.storage
			.from(PUBLIC_BUCKET_NAME)
			.getPublicUrl(designFilePath);
		return data.publicUrl;
	};

	const openAttachDesignPicker = (itemId: string) => {
		if (isUploadingDesign) return;
		uploadingDesignItemId = itemId;
		const input = document.getElementById('cart-design-file-input') as HTMLInputElement | null;
		input?.click();
	};

	const handleAttachDesignFileChange = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		if (!file || !uploadingDesignItemId) {
			uploadingDesignItemId = null;
			return;
		}

		const isSupportedFile = file.type === 'application/pdf' || file.type.startsWith('image/');
		if (!isSupportedFile) {
			toast.error('Format file harus gambar atau PDF.');
			input.value = '';
			uploadingDesignItemId = null;
			return;
		}

		if (file.size > MAX_DESIGN_FILE_SIZE_BYTES) {
			toast.error('Ukuran file maksimal 2MB.');
			input.value = '';
			uploadingDesignItemId = null;
			return;
		}

		const supabase = page.data.supabase;
		const userId = page.data.session?.user?.id;

		if (!supabase || !userId) {
			toast.error('Silakan login terlebih dahulu sebelum upload file desain.');
			input.value = '';
			uploadingDesignItemId = null;
			return;
		}

		isUploadingDesign = true;

		try {
			const nextPath = createDesignFilePath(userId, file.name);
			const { error } = await supabase.storage.from(PUBLIC_BUCKET_NAME).upload(nextPath, file, {
				upsert: false,
				contentType: file.type
			});

			if (error) {
				throw error;
			}

			attachDesignItemId = uploadingDesignItemId;
			attachDesignFilePath = nextPath;
			await tick();
			const form = document.getElementById('cart-attach-design-form') as HTMLFormElement | null;
			form?.requestSubmit();
		} catch (error) {
			toast.error('Gagal upload file desain. Silakan coba lagi.');
			console.error(error);
		} finally {
			isUploadingDesign = false;
			uploadingDesignItemId = null;
			input.value = '';
		}
	};

	const enhanceCartAction: SubmitFunction = () => {
		return async ({
			result,
			update
		}: {
			result: { type: string; data?: unknown };
			update: () => Promise<void>;
		}) => {
			if (result.type === 'success') {
				const message =
					typeof (result.data as { text?: unknown } | undefined)?.text === 'string'
						? (result.data as { text: string }).text
						: 'Keranjang berhasil diperbarui.';

				toast.success(message);
				await update();
				return;
			}

			if (result.type === 'failure') {
				const message =
					typeof (result.data as { message?: unknown } | undefined)?.message === 'string'
						? (result.data as { message: string }).message
						: 'Gagal memperbarui keranjang. Silakan coba lagi.';

				toast.error(message);
				return;
			}

			toast.error('Terjadi kendala saat memperbarui keranjang. Silakan coba lagi.');
		};
	};

	const enhanceCheckoutAction: SubmitFunction = () => {
		return async ({ result }: { result: { type: string; data?: unknown } }) => {
			if (result.type === 'failure') {
				const message =
					typeof (result.data as { message?: unknown } | undefined)?.message === 'string'
						? (result.data as { message: string }).message
						: 'Checkout gagal. Silakan coba lagi.';

				toast.error(message);
			}

			await applyAction(result as Parameters<typeof applyAction>[0]);
		};
	};
</script>

<div class="container mx-auto px-4 py-8 lg:px-8">
	<input
		id="cart-design-file-input"
		type="file"
		accept="image/*,application/pdf"
		class="hidden"
		onchange={handleAttachDesignFileChange}
	/>
	<form
		id="cart-attach-design-form"
		method="POST"
		action="?/attachDesignFile"
		class="hidden"
		use:enhance={enhanceCartAction}
	>
		<input type="hidden" name="itemId" value={attachDesignItemId} />
		<input type="hidden" name="designFilePath" value={attachDesignFilePath} />
	</form>

	{#if cartItems.length === 0}
		<CartEmptyState {categoriesHref} />
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
			<div class="rounded-xl bg-card shadow lg:col-span-8">
				<CartHeader itemCount={cartItems.length} />

				<Separator />

				<CartSelectAll {isAllSelected} onToggleSelectAll={toggleSelectAll} />

				<Separator />

				<div class="space-y-3 p-4 md:p-6">
					{#each cartItems as item (item.id)}
						<CartItemCard
							{item}
							selected={selectedItemIds.includes(item.id)}
							{isUploadingDesign}
							{uploadingDesignItemId}
							{formatItemMeta}
							{getDesignFileUrl}
							onToggleSelect={toggleSelectItem}
							onAttachDesign={openAttachDesignPicker}
							{getNextQuantity}
							{enhanceCartAction}
						/>
					{/each}
				</div>
			</div>

			<CartSummary
				{selectedCount}
				{selectedSubtotal}
				{shippingCost}
				{grandTotal}
				{selectedItemIds}
				{enhanceCheckoutAction}
				{categoriesHref}
			/>
		</div>
	{/if}
</div>
