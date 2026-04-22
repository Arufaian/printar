import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { products, variants } from '$lib/server/db/schema';
import { PUBLIC_BUCKET_NAME } from '$env/static/public';
import { z } from 'zod';

const productIdSchema = z.uuid('ID produk tidak valid.');

const getBucketObjectPathFromPublicUrl = (publicUrl?: string | null) => {
	if (!publicUrl) return null;

	try {
		const parsedUrl = new URL(publicUrl);
		const prefix = `/storage/v1/object/public/${PUBLIC_BUCKET_NAME}/`;
		if (!parsedUrl.pathname.startsWith(prefix)) return null;

		return decodeURIComponent(parsedUrl.pathname.slice(prefix.length));
	} catch {
		return null;
	}
};

export const actions = {
	default: async (event) => {
		const routeProductId = event.params.productId;
		const formData = await event.request.formData();
		const payloadProductId = formData.get('productId');
		const routeProductIdResult = productIdSchema.safeParse(routeProductId);
		const payloadProductIdResult = productIdSchema.safeParse(payloadProductId);

		if (!routeProductIdResult.success) {
			return fail(400, { message: 'ID produk pada URL tidak valid.' });
		}

		if (!payloadProductIdResult.success) {
			return fail(400, { message: 'ID produk pada payload tidak valid.' });
		}

		if (payloadProductIdResult.data !== routeProductIdResult.data) {
			return fail(400, { message: 'Data produk tidak sesuai. Silakan coba lagi.' });
		}

		let variantImageRows: Array<{ imgUrl: string | null }> = [];

		try {
			variantImageRows = await db
				.select({ imgUrl: variants.imgUrl })
				.from(variants)
				.where(eq(variants.productId, routeProductId));

			const deletedProduct = await db
				.delete(products)
				.where(eq(products.id, routeProductId))
				.returning({ id: products.id });

			if (deletedProduct.length === 0) {
				return fail(404, { message: 'Produk tidak ditemukan.' });
			}
		} catch (error) {
			const errorCode =
				typeof error === 'object' && error !== null && 'code' in error
					? String(error.code)
					: undefined;

			if (errorCode === '23503') {
				return fail(409, {
					message: 'Produk tidak dapat dihapus karena sudah digunakan pada transaksi.'
				});
			}

			console.error(error);

			return fail(500, {
				message: 'Gagal menghapus produk. Silakan coba lagi.'
			});
		}

		const objectPaths = Array.from(
			new Set(
				variantImageRows
					.map((variantRow) => getBucketObjectPathFromPublicUrl(variantRow.imgUrl))
					.filter((value): value is string => Boolean(value))
			)
		);

		if (objectPaths.length === 0) {
			return {
				type: 'success',
				text: 'Produk berhasil dihapus.'
			};
		}

		let cleanupFailed = false;

		if (!event.locals.supabase) {
			cleanupFailed = true;
		} else {
			try {
				const { error } = await event.locals.supabase.storage
					.from(PUBLIC_BUCKET_NAME)
					.remove(objectPaths);
				if (error) {
					cleanupFailed = true;
					console.error(error);
				}
			} catch (error) {
				cleanupFailed = true;
				console.error(error);
			}
		}

		if (cleanupFailed) {
			return {
				type: 'success',
				text: 'Produk berhasil dihapus, tetapi sebagian gambar varian gagal dibersihkan dari storage.'
			};
		}

		return {
			type: 'success',
			text: 'Produk berhasil dihapus.'
		};
	}
} satisfies Actions;
