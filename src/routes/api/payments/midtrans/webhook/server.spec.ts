import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const verifyMidtransSignatureMock = vi.hoisted(() => vi.fn());
const applyMidtransPaymentStatusMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		transaction: transactionMock
	}
}));

vi.mock('$lib/server/services/payment', () => {
	class StockInsufficientError extends Error {}
	return {
		verifyMidtransSignature: verifyMidtransSignatureMock,
		applyMidtransPaymentStatus: applyMidtransPaymentStatusMock,
		StockInsufficientError
	};
});

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
		transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
			callback({ select: selectMock })
		);
		selectMock.mockImplementation(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [{ id: ORDER_ID }])
				}))
			}))
		}));
		applyMidtransPaymentStatusMock.mockResolvedValue({ paymentStatus: 'settlement' });
	});

	it('rejects invalid signature', async () => {
		verifyMidtransSignatureMock.mockReturnValueOnce(false);
		const response = await POST(makeEvent(basePayload));
		expect(response.status).toBe(401);
	});

	it('returns 404 when order not found', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => []) })) }))
		}));

		const response = await POST(makeEvent(basePayload));
		expect(response.status).toBe(404);
	});

	it('applies webhook status via shared transition service', async () => {
		const response = await POST(makeEvent(basePayload));
		expect(response.status).toBe(200);
		expect(applyMidtransPaymentStatusMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				orderId: ORDER_ID,
				transactionStatus: 'settlement',
				paymentType: 'bank_transfer'
			})
		);
	});

	it('returns 400 when transaction status unsupported', async () => {
		applyMidtransPaymentStatusMock.mockResolvedValueOnce({ paymentStatus: null });
		const response = await POST(makeEvent({ ...basePayload, transaction_status: 'authorize' }));
		expect(response.status).toBe(400);
	});
});
