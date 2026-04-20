import { z } from 'zod';

export const insertCategoriesSchema = z.object({
	id: z.uuid().optional(),
	name: z.string().trim().min(1, 'Nama kategori wajib diisi'),
	slug: z.string().trim().min(1, 'Slug kategori wajib diisi')
});

export type InsertCategoriesSchema = typeof insertCategoriesSchema;
