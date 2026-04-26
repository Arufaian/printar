import { fail, redirect } from '@sveltejs/kit';
import { and, eq, DrizzleQueryError } from 'drizzle-orm';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { db } from '$lib/server/db';
import { addresses } from '$lib/server/db/schema';
import { customerAddressSchema } from '$lib/validation/customer/address.schema';
import type { Actions, PageServerLoad } from './$types';

const addressIdSchema = z.uuid('ID alamat tidak valid.');

export const load: PageServerLoad = async (event) => {
	const { user } = await event.locals.safeGetSession();

	if (!user) {
		redirect(303, '/sign-in?redirect=/customer/addresses');
	}

	const response = await db
		.select({
			id: addresses.id,
			addressLine: addresses.addressLine,
			city: addresses.city,
			postalCode: addresses.postalCode,
			phone: addresses.phone,
			createdAt: addresses.createdAt
		})
		.from(addresses)
		.where(eq(addresses.profileId, user.id));

	const form = await superValidate(event, zod4(customerAddressSchema));

	return {
		response,
		form
	};
};

export const actions: Actions = {
	upsert: async (event) => {
		const { user } = await event.locals.safeGetSession();

		if (!user) {
			return fail(401, {
				message: 'Silakan login terlebih dahulu.'
			});
		}

		const form = await superValidate(event, zod4(customerAddressSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const payload = {
			addressLine: form.data.addressLine.trim(),
			city: form.data.city.trim(),
			postalCode: form.data.postalCode.trim(),
			phone: form.data.phone.trim()
		};

		try {
			if (form.data.id) {
				const [updatedAddress] = await db
					.update(addresses)
					.set(payload)
					.where(and(eq(addresses.id, form.data.id), eq(addresses.profileId, user.id)))
					.returning({ id: addresses.id });

				if (!updatedAddress) {
					return message(
						form,
						{
							type: 'error',
							text: 'Alamat tidak ditemukan atau tidak dapat diperbarui.'
						},
						{ status: 404 }
					);
				}

				return message(form, {
					type: 'success',
					text: 'Alamat berhasil diperbarui.'
				});
			}

			await db.insert(addresses).values({
				profileId: user.id,
				...payload
			});

			return message(form, {
				type: 'success',
				text: 'Alamat berhasil ditambahkan.'
			});
		} catch (error) {
			if (error instanceof DrizzleQueryError) {
				return message(
					form,
					{
						type: 'error',
						text: 'Gagal menyimpan alamat. Silakan coba lagi.'
					},
					{ status: 500 }
				);
			}

			return message(
				form,
				{
					type: 'error',
					text: 'Terjadi gangguan saat menyimpan alamat.'
				},
				{ status: 500 }
			);
		}
	},
	delete: async (event) => {
		const { user } = await event.locals.safeGetSession();

		if (!user) {
			return fail(401, {
				message: 'Silakan login terlebih dahulu.'
			});
		}

		const formData = await event.request.formData();
		const rawId = formData.get('id');

		if (typeof rawId !== 'string' || rawId.trim() === '') {
			return fail(400, {
				message: 'ID alamat wajib diisi.'
			});
		}

		const parsedId = addressIdSchema.safeParse(rawId);

		if (!parsedId.success) {
			return fail(400, {
				message: parsedId.error.issues[0]?.message ?? 'ID alamat tidak valid.'
			});
		}

		try {
			const [deletedAddress] = await db
				.delete(addresses)
				.where(and(eq(addresses.id, parsedId.data), eq(addresses.profileId, user.id)))
				.returning({ id: addresses.id });

			if (!deletedAddress) {
				return fail(404, {
					message: 'Alamat tidak ditemukan atau tidak dapat dihapus.'
				});
			}

			return {
				type: 'success',
				text: 'Alamat berhasil dihapus.'
			};
		} catch (error) {
			if (error instanceof DrizzleQueryError) {
				return fail(500, {
					message: 'Alamat tidak bisa dihapus karena sedang digunakan pada pesanan.'
				});
			}

			return fail(500, {
				message: 'Terjadi gangguan saat menghapus alamat.'
			});
		}
	}
};
