import { z } from 'zod';

// NOTE: Avoid `.trim()` transform in client-side validators so spaces remain typable while editing.
const hasVisibleText = (value: string) => value.trim().length > 0;

const productNameSchema = z
	.string()
	.refine(hasVisibleText, 'Nama produk wajib diisi')
	.max(120, 'Nama produk maksimal 120 karakter');

const categoryIdSchema = z.uuid('Kategori wajib dipilih');

const variantNameSchema = z
	.string()
	.refine(hasVisibleText, 'Nama varian wajib diisi')
	.max(80, 'Nama varian maksimal 80 karakter');

const optionGroupNameSchema = z
	.string()
	.refine(hasVisibleText, 'Nama grup opsi wajib diisi')
	.max(80, 'Nama grup opsi maksimal 80 karakter');

const optionNameSchema = z
	.string()
	.refine(hasVisibleText, 'Nama opsi wajib diisi')
	.max(80, 'Nama opsi maksimal 80 karakter');

const parseRequiredInteger = (
	requiredMessage: string,
	integerMessage: string,
	minimumValue: number,
	minMessage: string
) =>
	z.preprocess(
		(value) => {
			if (value === '' || value === null || value === undefined) return null;
			if (typeof value === 'number' && Number.isNaN(value)) return null;
			if (typeof value === 'string') return Number(value);
			return value;
		},
		z.number(requiredMessage).int(integerMessage).min(minimumValue, minMessage)
	);

const moneySchema = parseRequiredInteger(
	'Harga wajib diisi',
	'Harga harus berupa bilangan bulat',
	0,
	'Harga tidak boleh kurang dari 0'
);

const stockSchema = parseRequiredInteger(
	'Stok wajib diisi',
	'Stok harus berupa bilangan bulat',
	1,
	'Stok minimal 1'
);

const additionalPriceSchema = parseRequiredInteger(
	'Biaya tambahan wajib diisi',
	'Biaya tambahan harus berupa bilangan bulat',
	0,
	'Biaya tambahan tidak boleh kurang dari 0'
);

export const productSchema = z
	.object({
		id: z.uuid().optional(),
		name: productNameSchema,
		description: z.string().trim().optional(),
		categoryId: categoryIdSchema,
		variants: z
			.array(
				z.object({
					id: z.uuid().optional(),
					name: variantNameSchema,
					price: moneySchema,
					stock: stockSchema,
					img_url: z.url('URL gambar tidak valid').optional()
				})
			)
			.min(1, 'Minimal harus ada 1 varian'),
		optionGroups: z
			.array(
				z.object({
					id: z.uuid().optional(),
					name: optionGroupNameSchema,
					options: z
						.array(
							z.object({
								id: z.uuid().optional(),
								name: optionNameSchema,
								additionalPrice: additionalPriceSchema
							})
						)
						.min(1, 'Minimal harus ada 1 opsi')
				})
			)
			.default([])
	})
	.superRefine((value, ctx) => {
		const variantNames = new Set<string>();
		for (const [index, variant] of value.variants.entries()) {
			const key = variant.name.toLowerCase();
			if (variantNames.has(key)) {
				ctx.addIssue({
					code: 'custom',
					message: 'Nama varian harus unik',
					path: ['variants', index, 'name']
				});
			}
			variantNames.add(key);
		}

		const optionGroupNames = new Set<string>();
		for (const [groupIndex, group] of value.optionGroups.entries()) {
			const groupKey = group.name.toLowerCase();
			if (optionGroupNames.has(groupKey)) {
				ctx.addIssue({
					code: 'custom',
					message: 'Nama grup opsi harus unik',
					path: ['optionGroups', groupIndex, 'name']
				});
			}
			optionGroupNames.add(groupKey);

			const optionNames = new Set<string>();
			for (const [optionIndex, option] of group.options.entries()) {
				const optionKey = option.name.toLowerCase();
				if (optionNames.has(optionKey)) {
					ctx.addIssue({
						code: 'custom',
						message: 'Nama opsi harus unik dalam grup yang sama',
						path: ['optionGroups', groupIndex, 'options', optionIndex, 'name']
					});
				}
				optionNames.add(optionKey);
			}
		}
	});

export type UpsertProductSchema = z.infer<typeof productSchema>;
