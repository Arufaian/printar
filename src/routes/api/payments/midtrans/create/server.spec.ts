import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const getCheckoutIntentSummaryRealtimeMock = vi.hoisted(() => vi.fn());
const createSnapTransactionMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		update: updateMock,
		insert: insertMock
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
		getCheckoutIntentSummaryRealtime: getCheckoutIntentSummaryRealtimeMock
	};
});

vi.mock('$lib/server/services/payment', () => ({
	createSnapTransaction: createSnapTransactionMock
}));

import { POST } from './+server';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';
const INTENT_ID = '82de0b36-c581-4f4b-ae17-a23979878c5f';
const ORDER_ID = '1f879ee0-89f1-4c3d-9df4-5f3299aa9d7f';

const makeOrderRow = (status: 'draft' | 'pending_payment' = 'draft') => ({
	id: ORDER_ID,
	status,
	profileId: USER_ID,
	totalPrice: 38000,
	customerNote: null,
	deliveryMethod: 'courier',
	profileName: 'Alfian'
});

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

		createSnapTransactionMock.mockResolvedValue({
			token: 'snap-token',
			redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/token',
			rawResponse: { token: 'snap-token', payment_type: 'bank_transfer' }
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

	it('returns 404 when draft order is not found', async () => {
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

	it('creates payment transaction and persists pending status', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(async () => [makeOrderRow()])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [])
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

		const insertWhereMock = vi.fn(async () => [{ id: 'log-id' }]);
		const insertValuesMock = vi.fn(() => ({ where: insertWhereMock }));
		insertMock.mockImplementation(() => ({ values: insertValuesMock }));

		const updateWhereMock = vi.fn(async () => [{ id: ORDER_ID }]);
		const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
		updateMock.mockImplementation(() => ({ set: updateSetMock }));

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			snapToken: string;
			redirectUrl: string;
			orderId: string;
			reused: boolean;
		};

		expect(body.snapToken).toBe('snap-token');
		expect(body.orderId).toBe(ORDER_ID);
		expect(body.reused).toBe(false);
		expect(createSnapTransactionMock).toHaveBeenCalledTimes(1);
		expect(insertMock).toHaveBeenCalled();
		expect(updateMock).toHaveBeenCalled();
	});

	it('returns reused snap token when Midtrans reports duplicate order_id (EN)', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(async () => [makeOrderRow()])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								rawResponse: {
									token: 'existing-token',
									redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/existing'
								}
							}
						])
					}))
				}))
			}));

		createSnapTransactionMock.mockRejectedValueOnce({
			midtransErrorMessages: ['transaction_details.order_id has already been taken']
		});

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			snapToken: string;
			redirectUrl: string | null;
			orderId: string;
			reused: boolean;
		};

		expect(body.snapToken).toBe('existing-token');
		expect(body.redirectUrl).toBe('https://app.sandbox.midtrans.com/snap/v2/vtweb/existing');
		expect(body.reused).toBe(true);
		expect(body.orderId).toBe(ORDER_ID);
		expect(updateMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
	});

	it('returns reused snap token when Midtrans reports duplicate order_id (ID)', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(async () => [makeOrderRow()])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ rawResponse: { token: 'existing-token-id' } }])
					}))
				}))
			}));

		createSnapTransactionMock.mockRejectedValueOnce({
			midtransErrorMessages: ['transaction_details.order_id sudah digunakan']
		});

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(200);
		const body = (await response.json()) as { snapToken: string; reused: boolean };
		expect(body.snapToken).toBe('existing-token-id');
		expect(body.reused).toBe(true);
	});

	it('keeps duplicate retry reachable when order is pending_payment', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(async () => [makeOrderRow('pending_payment')])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ rawResponse: { token: 'existing-token-pending' } }])
					}))
				}))
			}));

		createSnapTransactionMock.mockRejectedValueOnce({
			midtransErrorMessages: ['transaction_details.order_id has already been taken']
		});

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(200);
		expect(getCheckoutIntentSummaryRealtimeMock).toHaveBeenCalledWith(USER_ID, INTENT_ID, {
			allowedOrderStatuses: ['draft', 'pending_payment']
		});
		const body = (await response.json()) as { snapToken: string; reused: boolean };
		expect(body.snapToken).toBe('existing-token-pending');
		expect(body.reused).toBe(true);
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
						limit: vi.fn(async () => [
							{
								id: ORDER_ID,
								status: 'draft',
								profileId: USER_ID,
								totalPrice: 0,
								customerNote: null,
								deliveryMethod: 'courier',
								profileName: 'Alfian'
							}
						])
					}))
				}))
			}))
		}));

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(400);
		expect(createSnapTransactionMock).not.toHaveBeenCalled();
	});

	it('returns 409 when duplicate order_id has no reusable token', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(async () => [makeOrderRow()])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ rawResponse: {} }])
					}))
				}))
			}));

		createSnapTransactionMock.mockRejectedValueOnce({
			midtransErrorMessages: ['transaction_details.order_id has already been taken']
		});

		const response = await POST(makeEvent({ intentId: INTENT_ID }, USER_ID));
		expect(response.status).toBe(409);
		const body = (await response.json()) as { message: string; code: string };
		expect(body.code).toBe('MIDTRANS_DUPLICATE_NO_REUSABLE_TOKEN');
	});
});
