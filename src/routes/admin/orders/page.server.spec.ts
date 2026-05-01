import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

import { load } from './+page.server';

const makeEvent = (query = '') =>
	({
		url: new URL(`http://localhost/admin/orders${query}`)
	}) as unknown as Parameters<typeof load>[0];

describe('/admin/orders page server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns non-draft orders with latest payment status mapping', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(async () => [
								{
									id: 'order-1',
									status: 'paid',
									totalPrice: 120000,
									createdAt: '2026-05-01T10:00:00.000Z',
									customerName: 'Alfian'
								},
								{
									id: 'order-2',
									status: 'pending_payment',
									totalPrice: 45000,
									createdAt: '2026-05-01T10:10:00.000Z',
									customerName: null
								}
							])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(async () => [
							{ orderId: 'order-1', status: 'settlement', createdAt: '2026-05-01T10:20:00.000Z' },
							{ orderId: 'order-2', status: 'pending', createdAt: '2026-05-01T10:15:00.000Z' }
						])
					}))
				}))
			}));

		const result = (await load(makeEvent())) as {
			orders: Array<{
				id: string;
				customerName: string;
				latestPaymentStatus: string | null;
			}>;
			filters: { status: string; payment: string };
		};

		expect(result.orders).toHaveLength(2);
		expect(result.orders[0]).toMatchObject({
			id: 'order-1',
			customerName: 'Alfian',
			latestPaymentStatus: 'settlement'
		});
		expect(result.orders[1]).toMatchObject({
			id: 'order-2',
			customerName: 'Pelanggan',
			latestPaymentStatus: 'pending'
		});
		expect(result.filters).toEqual({ status: 'all', payment: 'all' });
	});

	it('filters by order status from query params', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(async () => [
								{
									id: 'order-1',
									status: 'paid',
									totalPrice: 120000,
									createdAt: '2026-05-01T10:00:00.000Z',
									customerName: 'Alfian'
								},
								{
									id: 'order-2',
									status: 'pending_payment',
									totalPrice: 45000,
									customerName: 'Budi',
									createdAt: '2026-05-01T10:10:00.000Z'
								}
							])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({ orderBy: vi.fn(async () => []) }))
				}))
			}));

		const result = (await load(makeEvent('?status=paid'))) as {
			orders: Array<{ status: string }>;
			filters: { status: string };
		};

		expect(result.orders).toHaveLength(1);
		expect(result.orders[0].status).toBe('paid');
		expect(result.filters.status).toBe('paid');
	});

	it('filters by latest payment status from query params', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(async () => [
								{
									id: 'order-1',
									status: 'paid',
									totalPrice: 120000,
									createdAt: '2026-05-01T10:00:00.000Z',
									customerName: 'Alfian'
								},
								{
									id: 'order-2',
									status: 'paid',
									totalPrice: 45000,
									createdAt: '2026-05-01T10:10:00.000Z',
									customerName: 'Budi'
								}
							])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(async () => [
							{ orderId: 'order-1', status: 'settlement', createdAt: '2026-05-01T10:20:00.000Z' },
							{ orderId: 'order-2', status: 'pending', createdAt: '2026-05-01T10:15:00.000Z' }
						])
					}))
				}))
			}));

		const result = (await load(makeEvent('?payment=pending'))) as {
			orders: Array<{ latestPaymentStatus: string | null }>;
			filters: { payment: string };
		};

		expect(result.orders).toHaveLength(1);
		expect(result.orders[0].latestPaymentStatus).toBe('pending');
		expect(result.filters.payment).toBe('pending');
	});
});
