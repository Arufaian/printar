import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const verifyMidtransSignatureMock = vi.hoisted(() => vi.fn());
const mapMidtransStatusToOrderStatusMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		update: updateMock,
		insert: insertMock
	}
}));

vi.mock('$lib/server/services/payment', () => ({
	verifyMidtransSignature: verifyMidtransSignatureMock,
	mapMidtransStatusToOrderStatus: mapMidtransStatusToOrderStatusMock
}));

import { POST } from './+server';

const ORDER_ID = '1f879ee0-89f1-4c3d-9df4-5f3299aa9d7f';

const makeEvent = (payload: Record<string, unknown>) =>
	({
		request: new Request('http://localhost/api/payments/midtrans/webhook', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		})
	}) as unknown as Parameters<typeof POST>[0];

const basePayload = {
	order_id: ORDER_ID,
	transaction_status: 'settlement',
	status_code: '200',
	gross_amount: '38000.00',
	signature_key: 'valid-signature',
	payment_type: 'bank_transfer'
};

describe('midtrans webhook API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		verifyMidtransSignatureMock.mockReturnValue(true);
		mapMidtransStatusToOrderStatusMock.mockReturnValue('paid');
	});

	it('rejects invalid signature', async () => {
		verifyMidtransSignatureMock.mockReturnValueOnce(false);
		const response = await POST(makeEvent(basePayload));
		expect(response.status).toBe(401);
	});

	it('updates payment and order on settlement', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID, status: 'pending_payment' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: 'payment-1' }])
					}))
				}))
			}));

		const updateWhereMock = vi.fn(async () => [{ id: 'payment-1' }]);
		const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
		updateMock.mockImplementation(() => ({ set: updateSetMock }));

		const insertValuesMock = vi.fn(async () => [{ id: 'log-1' }]);
		insertMock.mockImplementation(() => ({ values: insertValuesMock }));

		const response = await POST(makeEvent(basePayload));
		expect(response.status).toBe(200);
		expect(updateMock).toHaveBeenCalled();
		expect(insertMock).toHaveBeenCalledTimes(1);
	});

	it('maps cancel to draft', async () => {
		mapMidtransStatusToOrderStatusMock.mockReturnValueOnce('draft');
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID, status: 'pending_payment' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: 'payment-1' }])
					}))
				}))
			}));

		const updateWhereMock = vi.fn(async () => [{ id: 'payment-1' }]);
		const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
		updateMock.mockImplementation(() => ({ set: updateSetMock }));

		const insertValuesMock = vi.fn(async () => [{ id: 'log-1' }]);
		insertMock.mockImplementation(() => ({ values: insertValuesMock }));

		const response = await POST(makeEvent({ ...basePayload, transaction_status: 'cancel' }));
		expect(response.status).toBe(200);
		expect(updateMock).toHaveBeenCalled();
	});

	it('refreshes raw_response on duplicate callback without status change', async () => {
		mapMidtransStatusToOrderStatusMock.mockReturnValueOnce('paid');
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID, status: 'paid' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: 'payment-1' }])
					}))
				}))
			}));

		const updateWhereMock = vi.fn(async () => [{ id: 'payment-1' }]);
		const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
		updateMock.mockImplementation(() => ({ set: updateSetMock }));

		const response = await POST(makeEvent(basePayload));
		expect(response.status).toBe(200);
		expect(insertMock).not.toHaveBeenCalled();
		expect(updateMock).toHaveBeenCalledTimes(1);
	});

	it('inserts payment row when missing', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID, status: 'pending_payment' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [])
					}))
				}))
			}));

		const updateWhereMock = vi.fn(async () => [{ id: ORDER_ID }]);
		const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
		updateMock.mockImplementation(() => ({ set: updateSetMock }));

		const insertValuesMock = vi.fn(async () => [{ id: 'payment-1' }]);
		insertMock.mockImplementation(() => ({ values: insertValuesMock }));

		const response = await POST(makeEvent(basePayload));
		expect(response.status).toBe(200);
		expect(insertMock).toHaveBeenCalled();
	});
});
