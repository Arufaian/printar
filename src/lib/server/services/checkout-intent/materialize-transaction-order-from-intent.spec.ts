import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		insert: insertMock,
		update: updateMock
	}
}));

import { materializeTransactionOrderFromIntent } from './materialize-transaction-order-from-intent';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';
const INTENT_ID = '82de0b36-c581-4f4b-ae17-a23979878c5f';
const ORDER_ID = '1f879ee0-89f1-4c3d-9df4-5f3299aa9d7f';

describe('materializeTransactionOrderFromIntent', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reuses existing transaction order when available', async () => {
		const updateSetMock = vi.fn(() => ({ where: vi.fn(async () => [{ id: ORDER_ID }]) }));
		updateMock.mockImplementationOnce(() => ({ set: updateSetMock }));

		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								id: INTENT_ID,
								transactionOrderId: ORDER_ID,
								deliveryMethod: 'courier',
								shippingCost: 18000
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								addressId: 'addr-1',
								customerNote: 'Catatan pertama',
								deliveryMethod: 'courier',
								shippingCost: 18000
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ firstName: 'Alfian' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID, status: 'draft' }])
					}))
				}))
			}));

		const result = await materializeTransactionOrderFromIntent({
			userId: USER_ID,
			intentId: INTENT_ID,
			sourceOrderId: ORDER_ID,
			grossAmount: 58000
		});

		expect(result.transactionOrderId).toBe(ORDER_ID);
		expect(insertMock).not.toHaveBeenCalled();
		expect(updateSetMock).toHaveBeenCalledWith(
			expect.objectContaining({
				totalPrice: 58000,
				addressId: 'addr-1',
				customerNote: 'Catatan pertama',
				deliveryMethod: 'courier',
				shippingCost: 18000
			})
		);
	});

	it('creates transaction order with shipping metadata from intent when available', async () => {
		const transactionOrderId = '6f028cdf-7805-4ca7-80ef-cb0fe6965228';

		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								id: INTENT_ID,
								transactionOrderId: null,
								deliveryMethod: 'courier',
								shippingCost: 18000
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								addressId: 'addr-2',
								customerNote: 'Catatan kedua',
								deliveryMethod: 'pickup',
								shippingCost: 0
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ firstName: 'Alfian' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [{ orderItemId: 'item-1' }])
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [
						{
							id: 'item-1',
							variantId: 'variant-1',
							quantity: 1,
							price: 40000,
							filePath: '/design.pdf'
						}
					])
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [])
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ transactionOrderId }])
					}))
				}))
			}));

		const insertOrderValuesMock = vi.fn(() => ({
			returning: vi.fn(async () => [{ id: transactionOrderId, status: 'draft' }])
		}));

		insertMock
			.mockImplementationOnce(() => ({
				values: insertOrderValuesMock
			}))
			.mockImplementationOnce(() => ({ values: vi.fn(async () => []) }));

		const updateWhereMock = vi.fn(async () => [{ id: INTENT_ID }]);
		updateMock.mockImplementation(() => ({ set: vi.fn(() => ({ where: updateWhereMock })) }));

		const result = await materializeTransactionOrderFromIntent({
			userId: USER_ID,
			intentId: INTENT_ID,
			sourceOrderId: ORDER_ID,
			grossAmount: 58000
		});

		expect(result.transactionOrderId).toBe(transactionOrderId);
		expect(insertMock).toHaveBeenCalledTimes(2);
		expect(insertOrderValuesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				totalPrice: 58000,
				addressId: 'addr-2',
				customerNote: 'Catatan kedua',
				deliveryMethod: 'courier',
				shippingCost: 18000
			})
		);
	});

	it('falls back to source order shipping when intent delivery metadata is empty', async () => {
		const transactionOrderId = '9cf8fccc-488f-4394-9f6c-b75eb45785ad';

		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								id: INTENT_ID,
								transactionOrderId: null,
								deliveryMethod: null,
								shippingCost: 0
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								addressId: 'addr-3',
								customerNote: 'Catatan fallback',
								deliveryMethod: 'courier',
								shippingCost: 18000
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ firstName: 'Alfian' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [{ orderItemId: 'item-1' }])
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [
						{
							id: 'item-1',
							variantId: 'variant-1',
							quantity: 1,
							price: 40000,
							filePath: '/design.pdf'
						}
					])
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [])
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ transactionOrderId }])
					}))
				}))
			}));

		const insertOrderValuesMock = vi.fn(() => ({
			returning: vi.fn(async () => [{ id: transactionOrderId, status: 'draft' }])
		}));

		insertMock
			.mockImplementationOnce(() => ({ values: insertOrderValuesMock }))
			.mockImplementationOnce(() => ({ values: vi.fn(async () => []) }));

		updateMock.mockImplementation(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => []) })) }));

		await materializeTransactionOrderFromIntent({
			userId: USER_ID,
			intentId: INTENT_ID,
			sourceOrderId: ORDER_ID,
			grossAmount: 58000
		});

		expect(insertOrderValuesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				addressId: 'addr-3',
				customerNote: 'Catatan fallback',
				deliveryMethod: 'courier',
				shippingCost: 18000
			})
		);
	});
});
