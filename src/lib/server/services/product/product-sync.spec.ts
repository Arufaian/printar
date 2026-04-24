import { describe, expect, it, vi } from 'vitest';
import { optionGroups, options, products, variants } from '$lib/server/db/schema';
import {
	InvalidOptionOwnershipError,
	InvalidVariantOwnershipError,
	ProductNotFoundError,
	syncOptionGroupsDiff,
	syncVariantsDiff,
	updateProductCore
} from './index';

const PRODUCT_ID = '8f8f5688-79f8-4d56-8c4f-0eb8d74fd8ba';

type SyncTxState = {
	existingVariantIds?: string[];
	existingGroupIds?: string[];
	optionSelectQueue?: string[][];
	productFound?: boolean;
};

const createTx = (state: SyncTxState) => {
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
							return [{ id: crypto.randomUUID() }];
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

describe('product sync service', () => {
	it('throws InvalidVariantOwnershipError for foreign variant id', async () => {
		const { tx } = createTx({
			existingVariantIds: ['5b393ddd-5fb7-49ec-a40c-e73e137dc1fa']
		});

		await expect(
			syncVariantsDiff(tx as never, {
				productId: PRODUCT_ID,
				variants: [
					{
						id: 'd7677e6a-c6d7-4488-887d-c32c8167ca99',
						name: 'Injected',
						price: 1,
						stock: 1,
						img_url: ''
					}
				]
			})
		).rejects.toBeInstanceOf(InvalidVariantOwnershipError);
	});

	it('handles mixed variant diff update/create/delete', async () => {
		const { tx, calls } = createTx({
			existingVariantIds: [
				'5b393ddd-5fb7-49ec-a40c-e73e137dc1fa',
				'5fef16a2-cf8c-42a8-9f66-e374ecb4ff94'
			]
		});

		await syncVariantsDiff(tx as never, {
			productId: PRODUCT_ID,
			variants: [
				{
					id: '5b393ddd-5fb7-49ec-a40c-e73e137dc1fa',
					name: 'Updated',
					price: 1000,
					stock: 2,
					img_url: ''
				},
				{ name: 'New', price: 1200, stock: 3, img_url: '' }
			]
		});

		expect(calls.variantUpdate).toBe(1);
		expect(calls.variantInsert).toBe(1);
		expect(calls.variantDelete).toBe(1);
	});

	it('throws InvalidOptionOwnershipError for foreign option id', async () => {
		const { tx } = createTx({
			existingGroupIds: ['9f38e339-faf8-4f70-ba7e-27ad056709d3'],
			optionSelectQueue: [['f69b062e-5f16-4f72-b6e5-9f08c9b66d33']]
		});

		await expect(
			syncOptionGroupsDiff(tx as never, {
				productId: PRODUCT_ID,
				optionGroups: [
					{
						id: '9f38e339-faf8-4f70-ba7e-27ad056709d3',
						name: 'Group A',
						options: [
							{
								id: '0c55a0a8-2af0-4553-af14-2ef91b8304d5',
								name: 'Injected',
								additionalPrice: 100
							}
						]
					}
				]
			})
		).rejects.toBeInstanceOf(InvalidOptionOwnershipError);
	});

	it('handles no-op option group submit without create/delete', async () => {
		const { tx, calls } = createTx({
			existingGroupIds: ['9f38e339-faf8-4f70-ba7e-27ad056709d3'],
			optionSelectQueue: [['f69b062e-5f16-4f72-b6e5-9f08c9b66d33']]
		});

		await syncOptionGroupsDiff(tx as never, {
			productId: PRODUCT_ID,
			optionGroups: [
				{
					id: '9f38e339-faf8-4f70-ba7e-27ad056709d3',
					name: 'Group Stable',
					options: [
						{
							id: 'f69b062e-5f16-4f72-b6e5-9f08c9b66d33',
							name: 'Option Stable',
							additionalPrice: 100
						}
					]
				}
			]
		});

		expect(calls.groupInsert).toBe(0);
		expect(calls.groupDelete).toBe(0);
		expect(calls.optionInsert).toBe(0);
		expect(calls.optionDelete).toBe(0);
	});

	it('throws ProductNotFoundError when product update affects no rows', async () => {
		const { tx } = createTx({ productFound: false });

		await expect(
			updateProductCore(tx as never, {
				productId: PRODUCT_ID,
				name: 'Updated',
				slug: 'updated',
				description: 'desc',
				categoryId: '7ad9559c-30bd-4afb-bbd4-5627f8ddfbd6'
			})
		).rejects.toBeInstanceOf(ProductNotFoundError);
	});
});
