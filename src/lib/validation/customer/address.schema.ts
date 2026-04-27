import { z } from 'zod';

const postalCodeRegex = /^\d{5}$/;
const phoneRegex = /^\+?[0-9\s-]{8,20}$/;

export const customerAddressSchema = z.object({
	id: z.uuid().optional(),
	addressLine: z.string().trim().min(5, 'Alamat wajib diisi minimal 5 karakter').max(200),
	city: z.string().trim().min(2, 'Kota wajib diisi').max(100),
	postalCode: z.string().trim().regex(postalCodeRegex, 'Kode pos harus terdiri dari 5 digit angka'),
	phone: z
		.string()
		.trim()
		.regex(phoneRegex, 'Nomor telepon tidak valid')
		.refine((value) => /\d/.test(value), {
			message: 'Nomor telepon harus mengandung angka'
		})
});

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;
export type CustomerAddressSchema = typeof customerAddressSchema;
