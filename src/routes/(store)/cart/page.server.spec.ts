import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

import { load } from './+page.server';

const makeEvent = (userId: string | null) =>
	({
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof load>[0];

const mockDraftOrderQuery = (
	rows: Array<{ id: string; shippingCost: number | null; totalPrice: number | null }>
) => {
	selectMock.mockImplementationOnce(() => ({
		from: vi.fn(() => ({
			where: vi.fn(() => ({
				orderBy: vi.fn(() => ({
					limit: vi.fn(async () => rows)
				}))
			}))
		}))
	}));
};

const mockOrderItemsQuery = (rows: Array<Record<string, unknown>>) => {
	selectMock.mockImplementationOnce(() => ({
		from: vi.fn(() => ({
			leftJoin: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(async () => rows)
				}))
			}))
		}))
	}));
};

const mockItemOptionsQuery = (rows: Array<Record<string, unknown>>) => {
	selectMock.mockImplementationOnce(() => ({
		from: vi.fn(() => ({
			leftJoin: vi.fn(() => ({
				where: vi.fn(async () => rows)
			}))
		}))
	}));
};

describe('store cart page server load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('redirects unauthenticated users to sign-in', async () => {
		const event = makeEvent(null);

		await expect(load(event)).rejects.toMatchObject({
			status: 303,
			location: '/sign-in?redirect=/cart'
		});
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('returns empty cart when no draft order exists', async () => {
		mockDraftOrderQuery([]);

		const result = (await load(makeEvent('b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'))) as {
			cartItems: unknown[];
			summary: Record<string, unknown>;
		};

		expect(result.cartItems).toEqual([]);
		expect(result.summary).toEqual({
			orderId: null,
			subtotal: 0,
			shippingCost: 0,
			total: 0
		});
	});

	it('maps draft order data into cart items and summary', async () => {
		mockDraftOrderQuery([{ id: 'order-1', shippingCost: 1000, totalPrice: null }]);
		mockOrderItemsQuery([
			{
				id: 'item-1',
				quantity: 2,
				itemPrice: 10000,
				variantName: 'Varian A',
				variantStock: 9,
				variantImage: null,
				productName: 'Produk A'
			}
		]);
		mockItemOptionsQuery([
			{
				orderItemId: 'item-1',
				optionPrice: 500,
				optionName: 'Laminasi Doff'
			}
		]);

		const result = (await load(makeEvent('b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'))) as {
			cartItems: Array<Record<string, unknown>>;
			summary: Record<string, unknown>;
		};

		expect(result.cartItems).toHaveLength(1);
		expect(result.cartItems[0]).toMatchObject({
			id: 'item-1',
			title: 'Produk A',
			variant: 'Varian A',
			options: ['Laminasi Doff'],
			unitPrice: 10500,
			quantity: 2,
			stock: 9
		});
		expect(result.summary).toEqual({
			orderId: 'order-1',
			subtotal: 21000,
			shippingCost: 1000,
			total: 22000
		});
	});
});
