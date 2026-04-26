import { z } from 'zod';

const profileNameRegex = /^[A-Za-z\s'-]+$/;

export const customerProfileSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, 'Nama minimal 3 karakter')
		.max(50, 'Nama maksimal 50 karakter')
		.regex(profileNameRegex, "Nama hanya boleh berisi huruf, spasi, tanda petik (') atau strip (-)")
		.refine((value) => /[A-Za-z]/.test(value), {
			message: 'Nama wajib mengandung huruf'
		})
});

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
export type CustomerProfileSchema = typeof customerProfileSchema;
