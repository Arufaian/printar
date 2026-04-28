import { z } from 'zod';

const postalCodeRegex = /^\d{5}$/;
const phoneRegex = /^\+?[0-9\s-]{8,20}$/;

export const customerAddressSchema = z.object({
	id: z.uuid().optional(),
	recipientName: z.string().trim().min(2, 'Nama penerima wajib diisi minimal 2 karakter').max(100),
	label: z.string().trim().min(2, 'Label alamat wajib diisi').max(50),
	isDefault: z.coerce.boolean().default(false),
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
