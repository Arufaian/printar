import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

import { load } from './+page.server';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';

const makeEvent = (userId: string | null) =>
	({
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof load>[0];

describe('/customer/orders page server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('redirects to sign-in when unauthenticated', async () => {
		await expect(load(makeEvent(null))).rejects.toMatchObject({
			status: 303,
			location: '/sign-in?redirect=/customer/orders'
		});
	});

	it('returns empty orders when no non-draft order exists', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					orderBy: vi.fn(async () => [])
				}))
			}))
		}));

		const result = (await load(makeEvent(USER_ID))) as { orders: unknown[] };
		expect(result.orders).toEqual([]);
	});

	it('maps non-draft orders with preview thumbnails and payment status', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(async () => [
							{
								id: 'order-1',
								status: 'pending_payment',
								createdAt: '2026-05-01T10:00:00.000Z',
								totalPrice: 120000,
								deliveryMethod: 'courier'
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(async () => [
							{
								orderId: 'order-1',
								status: 'pending',
								createdAt: '2026-05-01T10:01:00.000Z'
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						leftJoin: vi.fn(() => ({
							where: vi.fn(async () => [
								{
									id: 'item-1',
									orderId: 'order-1',
									quantity: 2,
									productName: 'Poster A3',
									variantName: 'Glossy',
									variantImage: 'https://example.com/poster.jpg'
								},
								{
									id: 'item-2',
									orderId: 'order-1',
									quantity: 1,
									productName: 'Sticker',
									variantName: 'Matte',
									variantImage: null
								}
							])
						}))
					}))
				}))
			}));

		const result = (await load(makeEvent(USER_ID))) as {
			orders: Array<{
				status: string;
				latestPaymentStatus: string | null;
				previewItems: Array<{ image: string | null }>;
				itemCount: number;
				remainingItemCount: number;
			}>;
		};

		expect(result.orders).toHaveLength(1);
		expect(result.orders[0].status).toBe('pending_payment');
		expect(result.orders[0].latestPaymentStatus).toBe('pending');
		expect(result.orders[0].itemCount).toBe(2);
		expect(result.orders[0].remainingItemCount).toBe(0);
		expect(result.orders[0].previewItems[0].image).toBe('https://example.com/poster.jpg');
		expect(result.orders[0].previewItems[1].image).toBeNull();
	});
});
