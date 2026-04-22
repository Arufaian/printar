import { z } from 'zod';

const productNameSchema = z
	.string()
	.trim()
	.min(1, 'Product name is required')
	.max(120, 'Product name must be at most 120 characters');

const categoryIdSchema = z.uuid('Invalid Category ID format');

const variantNameSchema = z
	.string()
	.trim()
	.min(1, 'Variant name is required')
	.max(80, 'Variant name must be at most 80 characters');

const optionGroupNameSchema = z
	.string()
	.trim()
	.min(1, 'Option group name is required')
	.max(80, 'Option group name must be at most 80 characters');

const optionNameSchema = z
	.string()
	.trim()
	.min(1, 'Option name is required')
	.max(80, 'Option name must be at most 80 characters');

const moneySchema = z.coerce
	.number()
	.int('Price must be an integer')
	.min(0, 'Harga tidak boleh kosong');

const stockSchema = z.coerce
	.number()
	.int('Stock must be an integer')
	.min(0, 'Stock must be at least 0');

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
					img_url: z.url('Invalid image URL').optional()
				})
			)
			.min(1, 'At least one variant is required'),
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
								additionalPrice: moneySchema
							})
						)
						.min(1, 'At least one option is required')
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
					message: 'Variant name must be unique',
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
					message: 'Option group name must be unique',
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
						message: 'Option name must be unique within the same group',
						path: ['optionGroups', groupIndex, 'options', optionIndex, 'name']
					});
				}
				optionNames.add(optionKey);
			}
		}
	});

export type UpsertProductSchema = z.infer<typeof productSchema>;
