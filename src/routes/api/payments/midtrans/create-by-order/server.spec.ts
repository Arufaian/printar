import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const createSnapForOrderMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

vi.mock('$lib/server/services/payment/create-snap-order', () => ({
	createSnapForOrder: createSnapForOrderMock
}));

import { POST } from './+server';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';
const ORDER_ID = '1f879ee0-89f1-4c3d-9df4-5f3299aa9d7f';

const makeEvent = (payload: unknown, userId: string | null) =>
	({
		request: new Request('http://localhost/api/payments/midtrans/create-by-order', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		}),
		url: new URL('http://localhost/api/payments/midtrans/create-by-order'),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof POST>[0];

describe('midtrans create-by-order API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		createSnapForOrderMock.mockResolvedValue({
			status: 200,
			body: {
				snapToken: 'snap-token',
				redirectUrl: 'https://example.com',
				orderId: ORDER_ID,
				reused: false
			}
		});
	});

	it('returns 401 for unauthenticated user', async () => {
		const response = await POST(makeEvent({ orderId: ORDER_ID }, null));
		expect(response.status).toBe(401);
	});

	it('returns 400 for invalid orderId', async () => {
		const response = await POST(makeEvent({ orderId: 'invalid' }, USER_ID));
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

		const response = await POST(makeEvent({ orderId: ORDER_ID }, USER_ID));
		expect(response.status).toBe(404);
	});

	it('returns 409 when order status is not payable', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{ id: ORDER_ID, status: 'paid', totalPrice: 12000, profileName: 'Alfian' }
						])
					}))
				}))
			}))
		}));

		const response = await POST(makeEvent({ orderId: ORDER_ID }, USER_ID));
		expect(response.status).toBe(409);
		expect(createSnapForOrderMock).not.toHaveBeenCalled();
	});

	it('creates transaction for pending_payment order', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								id: ORDER_ID,
								status: 'pending_payment',
								totalPrice: 12000,
								profileName: 'Alfian'
							}
						])
					}))
				}))
			}))
		}));

		const response = await POST(makeEvent({ orderId: ORDER_ID }, USER_ID));
		expect(response.status).toBe(200);
		expect(createSnapForOrderMock).toHaveBeenCalledTimes(1);
	});

	it('returns duplicate non-reusable response from shared service', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								id: ORDER_ID,
								status: 'pending_payment',
								totalPrice: 12000,
								profileName: 'Alfian'
							}
						])
					}))
				}))
			}))
		}));

		createSnapForOrderMock.mockResolvedValueOnce({
			status: 409,
			body: {
				message: 'Transaksi untuk pesanan ini sudah pernah dibuat. Coba beberapa saat lagi.',
				code: 'MIDTRANS_DUPLICATE_NO_REUSABLE_TOKEN'
			}
		});

		const response = await POST(makeEvent({ orderId: ORDER_ID }, USER_ID));
		expect(response.status).toBe(409);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe('MIDTRANS_DUPLICATE_NO_REUSABLE_TOKEN');
	});

	it('returns reused token response from shared service', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								id: ORDER_ID,
								status: 'pending_payment',
								totalPrice: 12000,
								profileName: 'Alfian'
							}
						])
					}))
				}))
			}))
		}));

		createSnapForOrderMock.mockResolvedValueOnce({
			status: 200,
			body: {
				snapToken: 'existing-token',
				redirectUrl: null,
				orderId: ORDER_ID,
				reused: true
			}
		});

		const response = await POST(makeEvent({ orderId: ORDER_ID }, USER_ID));
		expect(response.status).toBe(200);
		const body = (await response.json()) as { reused: boolean };
		expect(body.reused).toBe(true);
	});
});
