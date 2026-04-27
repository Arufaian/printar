import { fail, redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { PUBLIC_BUCKET_NAME } from '$env/static/public';
import { db } from '$lib/server/db';
import { orderItems, orders } from '$lib/server/db/schema';
import {
	buildCartPayload,
	CartActionError,
	isCustomerDesignFilePath,
	parseRequiredDesignFilePath,
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

			if (!ownedItem.filePath || !isCustomerDesignFilePath(ownedItem.filePath)) {
				return {
					type: 'success' as const,
					text: 'Item berhasil dihapus dari keranjang.'
				};
			}

			if (!event.locals.supabase) {
				return {
					type: 'success' as const,
					text: 'Item berhasil dihapus, tetapi file desain gagal dibersihkan dari storage.'
				};
			}

			const { error: storageError } = await event.locals.supabase.storage
				.from(PUBLIC_BUCKET_NAME)
				.remove([ownedItem.filePath]);

			if (storageError) {
				console.error('[cart:removeItem] storage cleanup failed', storageError);
				return {
					type: 'success' as const,
					text: 'Item berhasil dihapus, tetapi file desain gagal dibersihkan dari storage.'
				};
			}

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
	},

	attachDesignFile: async (event) => {
		const { user } = await event.locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '').trim();

		if (!itemId) {
			return fail(400, { message: 'Item keranjang wajib diisi.' });
		}

		const designFilePathResult = parseRequiredDesignFilePath(formData.get('designFilePath'));
		if (!designFilePathResult.ok) {
			return fail(400, { message: designFilePathResult.message });
		}

		try {
			const ownedItem = await requireDraftItemOwnership(user.id, itemId);

			await db
				.update(orderItems)
				.set({ filePath: designFilePathResult.value })
				.where(eq(orderItems.id, ownedItem.itemId));

			const previousPath = ownedItem.filePath?.trim() ?? '';
			const nextPath = designFilePathResult.value.trim();

			if (!previousPath || previousPath === nextPath || !isCustomerDesignFilePath(previousPath)) {
				return {
					type: 'success' as const,
					text: 'File desain berhasil dilampirkan.'
				};
			}

			if (!event.locals.supabase) {
				return {
					type: 'success' as const,
					text: 'File desain berhasil diperbarui, tetapi file lama gagal dibersihkan dari storage.'
				};
			}

			const { error: storageError } = await event.locals.supabase.storage
				.from(PUBLIC_BUCKET_NAME)
				.remove([previousPath]);

			if (storageError) {
				console.error('[cart:attachDesignFile] storage cleanup failed', storageError);
				return {
					type: 'success' as const,
					text: 'File desain berhasil diperbarui, tetapi file lama gagal dibersihkan dari storage.'
				};
			}

			return {
				type: 'success' as const,
				text: 'File desain berhasil dilampirkan.'
			};
		} catch (err) {
			if (err instanceof CartActionError) {
				return fail(err.status, { message: err.message });
			}

			console.error('[cart:attachDesignFile] unexpected error', err);
			return fail(500, { message: 'Gagal melampirkan file desain. Silakan coba lagi.' });
		}
	},

	checkout: async (event) => {
		const { user } = await event.locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const formData = await event.request.formData();
		const selectedItemIds = Array.from(
			new Set(
				formData
					.getAll('selectedItemIds')
					.map((value) => String(value).trim())
					.filter((value) => value.length > 0)
			)
		);

		if (selectedItemIds.length === 0) {
			return fail(400, { message: 'Pilih minimal satu item untuk checkout.' });
		}

		const selectedRows = await db
			.select({
				itemId: orderItems.id,
				orderId: orderItems.orderId,
				filePath: orderItems.filePath
			})
			.from(orderItems)
			.innerJoin(orders, eq(orderItems.orderId, orders.id))
			.where(
				and(
					inArray(orderItems.id, selectedItemIds),
					eq(orders.profileId, user.id),
					eq(orders.status, 'draft')
				)
			);

		if (selectedRows.length !== selectedItemIds.length) {
			return fail(404, { message: 'Satu atau lebih item checkout tidak ditemukan.' });
		}

		const orderIdSet = new Set(
			selectedRows.map((row) => row.orderId).filter((value): value is string => Boolean(value))
		);
		if (orderIdSet.size !== 1) {
			return fail(400, { message: 'Item checkout harus berasal dari keranjang yang sama.' });
		}

		const missingDesignFile = selectedRows.some((row) => !(row.filePath?.trim() ?? ''));
		if (missingDesignFile) {
			return fail(400, {
				message: 'Masih ada item yang belum memiliki file desain. Lengkapi dulu sebelum checkout.'
			});
		}

		const query = new URLSearchParams();
		for (const itemId of selectedItemIds) {
			query.append('itemId', itemId);
		}

		throw redirect(303, `/checkout?${query.toString()}`);
	}
};
