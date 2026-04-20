import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { categories } from '$lib/server/db/schema';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms';
import { insertCategoriesSchema } from '$lib/validation/category/category.schema';
import { eq, DrizzleQueryError } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const response = await db.select().from(categories);
	const form = await superValidate(event, zod4(insertCategoriesSchema));

	return {
		response,
		form
	};
};

export const actions = {
	upsert: async (event) => {
		const form = await superValidate(event, zod4(insertCategoriesSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { id, name, slug } = form.data;

		try {
			if (id) {
				await db
					.update(categories)
					.set({
						name,
						slug
					})
					.where(eq(categories.id, id));

				return message(form, {
					type: 'success',
					text: 'Kategori berhasil diperbarui.'
				});
			}

			await db.insert(categories).values({
				name,
				slug
			});

			return message(form, {
				type: 'success',
				text: 'Kategori berhasil ditambahkan.'
			});
		} catch (error) {
			if (error instanceof DrizzleQueryError) {
				return message(
					form,
					{
						type: 'error',
						text: 'Data slug sudah ada. Silakan coba lagi.'
					},
					{ status: 500 }
				);
			}

			return message(
				form,
				{
					type: 'error',
					text: 'Gagal menyimpan kategori. Silakan coba lagi.'
				},
				{ status: 500 }
			);
		}
	},
	delete: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string' || id.trim() === '') {
			return fail(400, {
				message: 'ID kategori tidak valid.'
			});
		}

		try {
			await db.delete(categories).where(eq(categories.id, id));

			return {
				type: 'success',
				text: 'Kategori berhasil dihapus.'
			};
		} catch (error) {
			console.error(error);

			return fail(500, {
				message: 'Gagal menghapus kategori. Silakan coba lagi.'
			});
		}
	}
} satisfies Actions;
