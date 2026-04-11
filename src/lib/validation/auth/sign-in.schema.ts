import { z } from 'zod';

export const signInSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email('Format email tidak valid')),
	password: z
		.string()
		.min(8, 'Password minimal 8 karakter')
		.regex(/[A-Z]/, 'Harus ada huruf besar')
		.regex(/[a-z]/, 'Harus ada huruf kecil')
		.regex(/[0-9]/, 'Harus ada angka')
		.regex(/[^A-Za-z0-9]/, 'Harus ada simbol spesial')
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignInSchema = typeof signInSchema;
