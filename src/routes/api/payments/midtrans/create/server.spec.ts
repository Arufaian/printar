import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const getCheckoutIntentSummaryRealtimeMock = vi.hoisted(() => vi.fn());
const materializeTransactionOrderFromIntentMock = vi.hoisted(() => vi.fn());
const createSnapForOrderMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

vi.mock('$lib/server/services/checkout-intent', () => {
	class CheckoutIntentError extends Error {
		status: number;
		constructor(status: number, message: string) {
			super(message);
			this.status = status;
		}
	}

	return {
		CheckoutIntentError,
		getCheckoutIntentSummaryRealtime: getCheckoutIntentSummaryRealtimeMock,
		materializeTransactionOrderFromIntent: materializeTransactionOrderFromIntentMock
	};
});

vi.mock('$lib/server/services/payment/create-snap-order', () => ({
	createSnapForOrder: createSnapForOrderMock
}));

import { POST } from './+server';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';
const INTENT_ID = '82de0b36-c581-4f4b-ae17-a23979878c5f';
const ORDER_ID = '1f879ee0-89f1-4c3d-9df4-5f3299aa9d7f';

const makeEvent = (payload: unknown, userId: string | null) =>
	({
		request: new Request('http://localhost/api/payments/midtrans/create', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		}),
		url: new URL('http://localhost/api/payments/midtrans/create'),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof POST>[0];

describe('midtrans create payment API', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		getCheckoutIntentSummaryRealtimeMock.mockResolvedValue({
			intentId: INTENT_ID,
			orderId: ORDER_ID,
			selectedItemIds: ['item-1'],
			selectedCount: 1,
			selectedSubtotal: 20000,
			shippingCost: 18000,
			grandTotal: 38000
		});

		createSnapForOrderMock.mockResolvedValue({
			status: 200,
			body: {
				snapToken: 'snap-token',
				redirectUrl: 'https://example.com',
				orderId: ORDER_ID,
				reused: false
			}
		});

		materializeTransactionOrderFromIntentMock.mockResolvedValue({
			transactionOrderId: ORDER_ID,
			statusBeforeCreate: 'draft',
			customerFirstName: 'Alfian'
		});
	});

	it('returns 401 for unauthenticated user', async () => {
		const response = await POST(makeEvent({ intentId: INTENT_ID }, null));
		expect(response.status).toBe(401);
	});

	it('returns 400 for invalid intentId', async () => {
		const response = await POST(makeEvent({ intentId: 'invalid-id' }, USER_ID));
		expect(response.status).toBe(400);
	});

	it('returns 404 when intent is not found', async () => {
		const { CheckoutIntentError } = await import('$lib/server/services/checkout-intent');
		getCheckoutIntentSummaryRealtimeMock.mockRejectedValueOnce(
			new CheckoutIntentError(404, 'Checkout intent tidak ditemukan.')
		);

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(404);
	});

	it('returns materialization error when transaction order cannot be prepared', async () => {
		const { CheckoutIntentError } = await import('$lib/server/services/checkout-intent');
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID, status: 'draft', profileName: 'Alfian' }])
					}))
				}))
			}))
		}));
		materializeTransactionOrderFromIntentMock.mockRejectedValueOnce(
			new CheckoutIntentError(400, 'Checkout intent tidak memiliki item.')
		);

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(400);
	});

	it('returns 404 when order is not found', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [])
					}))
				}))
			}))
		}));

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(404);
	});

	it('returns 400 when grandTotal is invalid', async () => {
		getCheckoutIntentSummaryRealtimeMock.mockResolvedValueOnce({
			intentId: INTENT_ID,
			orderId: ORDER_ID,
			selectedItemIds: ['item-1'],
			selectedCount: 1,
			selectedSubtotal: 0,
			shippingCost: 0,
			grandTotal: 0
		});

		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID, status: 'draft', profileName: 'Alfian' }])
					}))
				}))
			}))
		}));

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(400);
		expect(createSnapForOrderMock).not.toHaveBeenCalled();
	});

	it('creates payment using shared order service', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{ id: ORDER_ID, status: 'pending_payment', profileName: 'Alfian' }
						])
					}))
				}))
			}))
		}));

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(200);
		expect(createSnapForOrderMock).toHaveBeenCalledTimes(1);
		expect(materializeTransactionOrderFromIntentMock).toHaveBeenCalledWith({
			userId: USER_ID,
			intentId: INTENT_ID,
			sourceOrderId: ORDER_ID,
			grossAmount: 38000
		});
	});
});
