import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	buildCartPayload,
	CartActionError,
	removeCartItem,
	requireDraftItemOwnership,
	updateCartItemQuantity
} from '$lib/server/services/cart';

export const load: PageServerLoad = async (event) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/sign-in?redirect=/cart');
	}

	return buildCartPayload(user.id);
};

export const actions: Actions = {
	updateQuantity: async (event) => {
		const { user } = await event.locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '').trim();
		const quantity = Number(formData.get('quantity'));

		if (!itemId) {
			return fail(400, { message: 'Item keranjang wajib diisi.' });
		}

		if (!Number.isInteger(quantity) || quantity < 1) {
			return fail(400, { message: 'Jumlah minimal 1.' });
		}

		try {
			const ownedItem = await requireDraftItemOwnership(user.id, itemId);
			await updateCartItemQuantity({ ownedItem, quantity });

			return {
				type: 'success' as const,
				text: 'Jumlah item berhasil diperbarui.'
			};
		} catch (err) {
			if (err instanceof CartActionError) {
				return fail(err.status, { message: err.message });
			}

			console.error('[cart:updateQuantity] unexpected error', err);
			return fail(500, { message: 'Gagal memperbarui jumlah item. Silakan coba lagi.' });
		}
	},

	removeItem: async (event) => {
		const { user } = await event.locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '').trim();

		if (!itemId) {
			return fail(400, { message: 'Item keranjang wajib diisi.' });
		}

		try {
			const ownedItem = await requireDraftItemOwnership(user.id, itemId);
			await removeCartItem(ownedItem);

			return {
				type: 'success' as const,
				text: 'Item berhasil dihapus dari keranjang.'
			};
		} catch (err) {
			if (err instanceof CartActionError) {
				return fail(err.status, { message: err.message });
			}

			console.error('[cart:removeItem] unexpected error', err);
			return fail(500, { message: 'Gagal menghapus item. Silakan coba lagi.' });
		}
	}
};
