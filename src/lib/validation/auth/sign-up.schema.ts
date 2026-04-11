import { z } from 'zod';

export const signupSchema = z
	.object({
		name: z
			.string()
			.trim()
			.refine((val) => val.length > 0, { message: 'Nama tidak boleh kosong' })
			.pipe(z.string().min(3, 'Nama minimal 3 karakter').max(50, 'Nama maksimal 50 karakter')),

		email: z.string().trim().toLowerCase().pipe(z.email('Format email tidak valid')),
		password: z
			.string()
			.min(8, 'Password minimal 8 karakter')
			.regex(/[A-Z]/, 'Harus ada huruf besar')
			.regex(/[a-z]/, 'Harus ada huruf kecil')
			.regex(/[0-9]/, 'Harus ada angka')
			.regex(/[^A-Za-z0-9]/, 'Harus ada simbol spesial'),

		confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Password tidak sama',
		path: ['confirmPassword']
	});

export type SignUpInput = z.infer<typeof signupSchema>;
export type SignUpSchema = typeof signupSchema;
