import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleQueryError } from 'drizzle-orm';
import { optionGroups, options, products, variants } from '$lib/server/db/schema';

const transactionMock = vi.hoisted(() => vi.fn());
const superValidateMock = vi.hoisted(() => vi.fn());
const messageMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		transaction: transactionMock
	}
}));

vi.mock('sveltekit-superforms', async () => {
	const actual =
		await vi.importActual<typeof import('sveltekit-superforms')>('sveltekit-superforms');

	return {
		...actual,
		superValidate: superValidateMock,
		message: messageMock
	};
});

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn(() => ({}))
}));

import { actions } from './+page.server';

type TransactionState = {
	productFound?: boolean;
	existingVariantIds?: string[];
	existingGroupIds?: string[];
	optionSelectQueue?: string[][];
	createdGroupIds?: string[];
};

const PRODUCT_ID = '8f8f5688-79f8-4d56-8c4f-0eb8d74fd8ba';
const CATEGORY_ID = '7ad9559c-30bd-4afb-bbd4-5627f8ddfbd6';

const baseFormData = {
	id: PRODUCT_ID,
	name: 'Produk Demo',
	slug: 'produk-demo',
	description: 'desc',
	categoryId: CATEGORY_ID,
	variants: [
		{
			id: '5b393ddd-5fb7-49ec-a40c-e73e137dc1fa',
			name: 'Varian A',
			price: 10000,
			stock: 5,
			img_url: 'https://example.com/a.jpg'
		}
	],
	optionGroups: [] as Array<{
		id?: string;
		name: string;
		options: Array<{ id?: string; name: string; additionalPrice: number }>;
	}>
};

const makeEvent = () =>
	({
		params: { productId: PRODUCT_ID },
		request: new Request('http://localhost/admin/products/edit', { method: 'POST' })
	}) as Parameters<(typeof actions)['default']>[0];

const makeEventWithProductId = (productId: string) =>
	({
		params: { productId },
		request: new Request('http://localhost/admin/products/edit', { method: 'POST' })
	}) as Parameters<(typeof actions)['default']>[0];

type ActionMessageResult = {
	status: number;
	message: {
		type?: string;
		text: string;
	};
};

const asActionMessageResult = (value: unknown) => value as ActionMessageResult;

type ActionFailureResult = {
	status: number;
	data: {
		message?: string;
		form?: unknown;
	};
};

const asActionFailureResult = (value: unknown) => value as ActionFailureResult;

const createTransactionTx = (state: TransactionState) => {
	const calls = {
		variantUpdate: 0,
		variantInsert: 0,
		variantDelete: 0,
		groupUpdate: 0,
		groupInsert: 0,
		groupDelete: 0,
		optionUpdate: 0,
		optionInsert: 0,
		optionDelete: 0
	};

	const optionQueue = [...(state.optionSelectQueue ?? [])];
	const createdGroupIds = [...(state.createdGroupIds ?? [])];

	const tx = {
		select: vi.fn(() => ({
			from: vi.fn((table: unknown) => ({
				where: vi.fn(async () => {
					if (table === variants) {
						return (state.existingVariantIds ?? []).map((id) => ({ id }));
					}

					if (table === optionGroups) {
						return (state.existingGroupIds ?? []).map((id) => ({ id }));
					}

					if (table === options) {
						const next = optionQueue.shift() ?? [];
						return next.map((id) => ({ id }));
					}

					return [];
				})
			}))
		})),
		update: vi.fn((table: unknown) => {
			if (table === products) {
				return {
					set: vi.fn(() => ({
						where: vi.fn(() => ({
							returning: vi.fn(async () =>
								state.productFound === false ? [] : [{ id: PRODUCT_ID }]
							)
						}))
					}))
				};
			}

			if (table === variants) {
				return {
					set: vi.fn(() => ({
						where: vi.fn(async () => {
							calls.variantUpdate += 1;
							return [];
						})
					}))
				};
			}

			if (table === optionGroups) {
				return {
					set: vi.fn(() => ({
						where: vi.fn(async () => {
							calls.groupUpdate += 1;
							return [];
						})
					}))
				};
			}

			return {
				set: vi.fn(() => ({
					where: vi.fn(async () => {
						calls.optionUpdate += 1;
						return [];
					})
				}))
			};
		}),
		insert: vi.fn((table: unknown) => {
			if (table === variants) {
				return {
					values: vi.fn(async (rows: unknown[]) => {
						calls.variantInsert += rows.length;
						return [];
					})
				};
			}

			if (table === optionGroups) {
				return {
					values: vi.fn(() => ({
						returning: vi.fn(async () => {
							calls.groupInsert += 1;
							return [{ id: createdGroupIds.shift() ?? crypto.randomUUID() }];
						})
					}))
				};
			}

			return {
				values: vi.fn(async (rows: unknown[]) => {
					calls.optionInsert += rows.length;
					return [];
				})
			};
		}),
		delete: vi.fn((table: unknown) => {
			if (table === variants) {
				return {
					where: vi.fn(async () => {
						calls.variantDelete += 1;
						return [];
					})
				};
			}

			if (table === optionGroups) {
				return {
					where: vi.fn(async () => {
						calls.groupDelete += 1;
						return [];
					})
				};
			}

			return {
				where: vi.fn(async () => {
					calls.optionDelete += 1;
					return [];
				})
			};
		})
	};

	return { tx, calls };
};

describe('admin products edit action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		messageMock.mockImplementation((form, payload, options) => ({
			form,
			message: payload,
			status: options?.status ?? 200
		}));
	});

	it('rejects foreign variant id with status 400', async () => {
		superValidateMock.mockResolvedValue({
			valid: true,
			data: {
				...baseFormData,
				variants: [
					{
						...baseFormData.variants[0],
						id: 'd7677e6a-c6d7-4488-887d-c32c8167ca99'
					}
				]
			}
		});

		const { tx } = createTransactionTx({
			existingVariantIds: ['5b393ddd-5fb7-49ec-a40c-e73e137dc1fa']
		});
		transactionMock.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => {
			await callback(tx);
		});

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.status).toBe(400);
		expect(output.message.text).toContain('Data varian tidak valid');
	});

	it('returns fail 400 when productId param is invalid', async () => {
		const result = await actions.default(makeEventWithProductId('invalid-id'));
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('ID produk pada URL tidak valid');
		expect(superValidateMock).not.toHaveBeenCalled();
		expect(transactionMock).not.toHaveBeenCalled();
	});

	it('returns fail 400 when superform validation fails', async () => {
		const invalidForm = {
			valid: false,
			errors: { name: ['Nama produk wajib diisi'] },
			data: baseFormData
		};
		superValidateMock.mockResolvedValue(invalidForm);

		const result = await actions.default(makeEvent());
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.form).toEqual(invalidForm);
		expect(transactionMock).not.toHaveBeenCalled();
	});

	it('returns message 400 when form id mismatches route productId', async () => {
		superValidateMock.mockResolvedValue({
			valid: true,
			data: {
				...baseFormData,
				id: '2641272d-4770-4778-8f94-cac8a4758bbb'
			}
		});

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.status).toBe(400);
		expect(output.message.text).toContain('Data produk tidak sesuai');
		expect(transactionMock).not.toHaveBeenCalled();
	});

	it('rejects foreign option group id with status 400', async () => {
		superValidateMock.mockResolvedValue({
			valid: true,
			data: {
				...baseFormData,
				optionGroups: [
					{
						id: 'fa71956a-9f4b-4fba-8d94-f8733c9fbf74',
						name: 'Group X',
						options: [{ name: 'Opt X', additionalPrice: 1000 }]
					}
				]
			}
		});

		const { tx } = createTransactionTx({
			existingVariantIds: ['5b393ddd-5fb7-49ec-a40c-e73e137dc1fa'],
			existingGroupIds: ['4fc0f41e-6f35-41d9-89af-0f593f9ca66d']
		});
		transactionMock.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => {
			await callback(tx);
		});

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.status).toBe(400);
		expect(output.message.text).toContain('Data opsi tidak valid');
	});

	it('rejects foreign option id with status 400', async () => {
		superValidateMock.mockResolvedValue({
			valid: true,
			data: {
				...baseFormData,
				optionGroups: [
					{
						id: '9f38e339-faf8-4f70-ba7e-27ad056709d3',
						name: 'Group A',
						options: [
							{
								id: '0c55a0a8-2af0-4553-af14-2ef91b8304d5',
								name: 'Injected Option',
								additionalPrice: 3000
							}
						]
					}
				]
			}
		});

		const { tx } = createTransactionTx({
			existingVariantIds: ['5b393ddd-5fb7-49ec-a40c-e73e137dc1fa'],
			existingGroupIds: ['9f38e339-faf8-4f70-ba7e-27ad056709d3'],
			optionSelectQueue: [['f69b062e-5f16-4f72-b6e5-9f08c9b66d33']]
		});
		transactionMock.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => {
			await callback(tx);
		});

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.status).toBe(400);
		expect(output.message.text).toContain('Data opsi tidak valid');
	});

	it('handles mixed variant diff (update/create/delete)', async () => {
		superValidateMock.mockResolvedValue({
			valid: true,
			data: {
				...baseFormData,
				variants: [
					{
						...baseFormData.variants[0],
						id: '5b393ddd-5fb7-49ec-a40c-e73e137dc1fa',
						name: 'Updated'
					},
					{ name: 'Varian Baru', price: 12000, stock: 3, img_url: 'https://example.com/new.jpg' }
				]
			}
		});

		const { tx, calls } = createTransactionTx({
			existingVariantIds: [
				'5b393ddd-5fb7-49ec-a40c-e73e137dc1fa',
				'5fef16a2-cf8c-42a8-9f66-e374ecb4ff94'
			],
			existingGroupIds: []
		});
		transactionMock.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => {
			await callback(tx);
		});

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.message.type).toBe('success');
		expect(calls.variantUpdate).toBe(1);
		expect(calls.variantInsert).toBe(1);
		expect(calls.variantDelete).toBe(1);
	});

	it('handles mixed option group/option diff', async () => {
		superValidateMock.mockResolvedValue({
			valid: true,
			data: {
				...baseFormData,
				optionGroups: [
					{
						id: '9f38e339-faf8-4f70-ba7e-27ad056709d3',
						name: 'Updated Group',
						options: [
							{
								id: 'f69b062e-5f16-4f72-b6e5-9f08c9b66d33',
								name: 'Updated Option',
								additionalPrice: 2000
							},
							{ name: 'New Option', additionalPrice: 3500 }
						]
					},
					{
						name: 'New Group',
						options: [{ name: 'New Group Option', additionalPrice: 500 }]
					}
				]
			}
		});

		const { tx, calls } = createTransactionTx({
			existingVariantIds: ['5b393ddd-5fb7-49ec-a40c-e73e137dc1fa'],
			existingGroupIds: [
				'9f38e339-faf8-4f70-ba7e-27ad056709d3',
				'06a51925-aa87-4848-83d0-539899425f7e'
			],
			optionSelectQueue: [
				['f69b062e-5f16-4f72-b6e5-9f08c9b66d33', 'b90003f1-60ba-43d8-889b-c7a6f56ce337']
			],
			createdGroupIds: ['a3d86523-4c54-4f82-80ab-8c6de74f1034']
		});
		transactionMock.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => {
			await callback(tx);
		});

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.message.type).toBe('success');
		expect(calls.groupUpdate).toBe(1);
		expect(calls.groupInsert).toBe(1);
		expect(calls.groupDelete).toBe(1);
		expect(calls.optionUpdate).toBe(1);
		expect(calls.optionInsert).toBe(2);
		expect(calls.optionDelete).toBe(1);
	});

	it('maps DrizzleQueryError to slug conflict message', async () => {
		superValidateMock.mockResolvedValue({ valid: true, data: baseFormData });
		transactionMock.mockRejectedValue(
			new DrizzleQueryError(
				'update products set slug = $1',
				['produk-demo'],
				new Error('duplicate key')
			)
		);

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.status).toBe(500);
		expect(output.message.text).toContain('Slug produk sudah digunakan');
	});

	it('maps missing product update to 404 message', async () => {
		superValidateMock.mockResolvedValue({ valid: true, data: baseFormData });

		const { tx } = createTransactionTx({
			productFound: false,
			existingVariantIds: ['5b393ddd-5fb7-49ec-a40c-e73e137dc1fa']
		});
		transactionMock.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => {
			await callback(tx);
		});

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.status).toBe(404);
		expect(output.message.text).toContain('Produk tidak ditemukan');
	});

	it('maps unexpected error to generic 500 message', async () => {
		superValidateMock.mockResolvedValue({ valid: true, data: baseFormData });
		transactionMock.mockRejectedValue(new Error('unexpected'));

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.status).toBe(500);
		expect(output.message.text).toContain('Gagal memperbarui produk');
	});

	it('handles no-op submit without creating or deleting variants/options', async () => {
		superValidateMock.mockResolvedValue({
			valid: true,
			data: {
				...baseFormData,
				variants: [
					{
						id: '5b393ddd-5fb7-49ec-a40c-e73e137dc1fa',
						name: 'Varian A',
						price: 10000,
						stock: 5,
						img_url: 'https://example.com/a.jpg'
					}
				],
				optionGroups: [
					{
						id: '9f38e339-faf8-4f70-ba7e-27ad056709d3',
						name: 'Group Stable',
						options: [
							{
								id: 'f69b062e-5f16-4f72-b6e5-9f08c9b66d33',
								name: 'Option Stable',
								additionalPrice: 1000
							}
						]
					}
				]
			}
		});

		const { tx, calls } = createTransactionTx({
			existingVariantIds: ['5b393ddd-5fb7-49ec-a40c-e73e137dc1fa'],
			existingGroupIds: ['9f38e339-faf8-4f70-ba7e-27ad056709d3'],
			optionSelectQueue: [['f69b062e-5f16-4f72-b6e5-9f08c9b66d33']]
		});
		transactionMock.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => {
			await callback(tx);
		});

		const result = await actions.default(makeEvent());
		const output = asActionMessageResult(result);

		expect(output.message.type).toBe('success');
		expect(calls.variantInsert).toBe(0);
		expect(calls.variantDelete).toBe(0);
		expect(calls.groupInsert).toBe(0);
		expect(calls.groupDelete).toBe(0);
		expect(calls.optionInsert).toBe(0);
		expect(calls.optionDelete).toBe(0);
	});
});
