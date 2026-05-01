import { describe, expect, it, vi } from 'vitest';

vi.mock('./midtrans.js', () => ({
	mapMidtransStatusToOrderStatus: vi.fn((status: string) => {
		if (status.toLowerCase() === 'settlement') return 'paid';
		if (status.toLowerCase() === 'pending') return 'pending_payment';
		if (status.toLowerCase() === 'cancel' || status.toLowerCase() === 'expire') return 'draft';
		return null;
	})
}));

import { applyMidtransPaymentStatus } from './apply-midtrans-payment-status';

describe('applyMidtransPaymentStatus', () => {
	it('resets empty source draft cart fields after successful paid transition', async () => {
		const selectMock = vi
			.fn()
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: 'trx-1', status: 'pending_payment' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({ limit: vi.fn(async () => [{ id: 'pay-1', rawResponse: {} }]) }))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({ where: vi.fn(async () => []) }))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: 'intent-1', sourceOrderId: 'source-1' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({ where: vi.fn(async () => [{ orderItemId: 'source-item-1' }]) }))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({ where: vi.fn(async () => []) }))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({ limit: vi.fn(async () => [{ shippingCost: 18000 }]) }))
				}))
			}));

		const updateSetMock = vi.fn(() => ({ where: vi.fn(async () => []) }));
		const updateReturningMock = vi.fn(async () => [{ id: 'variant-1' }]);
		const updateMock = vi
			.fn()
			.mockImplementationOnce(() => ({ set: updateSetMock }))
			.mockImplementationOnce(() => ({
				set: vi.fn(() => ({ where: vi.fn(() => ({ returning: updateReturningMock })) }))
			}))
			.mockImplementationOnce(() => ({ set: updateSetMock }))
			.mockImplementationOnce(() => ({ set: updateSetMock }))
			.mockImplementationOnce(() => ({ set: updateSetMock }));

		const insertMock = vi.fn(() => ({ values: vi.fn(async () => []) }));
		const deleteMock = vi.fn(() => ({ where: vi.fn(async () => []) }));

		await applyMidtransPaymentStatus(
			{ select: selectMock, update: updateMock, insert: insertMock, delete: deleteMock },
			{
				orderId: 'trx-1',
				transactionStatus: 'settlement',
				paymentType: 'bank_transfer',
				rawPayload: { order_id: 'trx-1' }
			}
		);

		expect(updateSetMock).toHaveBeenCalledWith(
			expect.objectContaining({
				totalPrice: 0,
				shippingCost: 0,
				deliveryMethod: null,
				addressId: null,
				customerNote: null
			})
		);
	});
});
