import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const getCheckoutIntentSummaryRealtimeMock = vi.hoisted(() => vi.fn());

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
		getCheckoutIntentSummaryRealtime: getCheckoutIntentSummaryRealtimeMock
	};
});

import { load } from './+page.server';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';
const INTENT_ID = '82de0b36-c581-4f4b-ae17-a23979878c5f';
const ORDER_ID = '1f879ee0-89f1-4c3d-9df4-5f3299aa9d7f';

const makeEvent = (
	userId: string | null,
	url = `http://localhost/checkout/review?intentId=${INTENT_ID}`
) =>
	({
		url: new URL(url),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof load>[0];

describe('checkout review page server', () => {
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

		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(async () => [
								{
									id: ORDER_ID,
									addressId: 'addr-1',
									deliveryMethod: 'courier',
									recipientName: 'Alfian',
									label: 'Rumah',
									addressLine: 'Jl. Mawar 1',
									city: 'Bandung',
									postalCode: '40123',
									phone: '0812'
								}
							])
						}))
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
									quantity: 2,
									itemPrice: 10000,
									variantName: 'Varian A',
									variantImage: 'https://example.com/variant-a.png',
									productName: 'Produk A'
								}
							])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(async () => [
							{
								orderItemId: 'item-1',
								optionPrice: 2000,
								optionName: 'Laminasi'
							}
						])
					}))
				}))
			}));
	});

	it('redirects unauthenticated user to sign-in', async () => {
		await expect(load(makeEvent(null))).rejects.toMatchObject({
			status: 303,
			location:
				'/sign-in?redirect=%2Fcheckout%2Freview%3FintentId%3D82de0b36-c581-4f4b-ae17-a23979878c5f'
		});
	});

	it('redirects to cart when intentId is missing', async () => {
		await expect(
			load(makeEvent(USER_ID, 'http://localhost/checkout/review'))
		).rejects.toMatchObject({
			status: 303,
			location: '/cart'
		});
	});

	it('redirects to cart when intent is invalid', async () => {
		await expect(
			load(makeEvent(USER_ID, 'http://localhost/checkout/review?intentId=invalid-id'))
		).rejects.toMatchObject({
			status: 303,
			location: '/cart'
		});
	});

	it('returns review data for valid intent', async () => {
		const result = (await load(makeEvent(USER_ID))) as {
			intentId: string;
			selectedDeliveryMethodLabel: string | null;
			items: Array<{ id: string; lineTotal: number; options: string[]; image: string | null }>;
		};

		expect(result.intentId).toBe(INTENT_ID);
		expect(result.selectedDeliveryMethodLabel).toBe('Diantar ke alamat');
		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toMatchObject({
			id: 'item-1',
			image: 'https://example.com/variant-a.png',
			lineTotal: 24000,
			options: ['Laminasi']
		});
		expect(getCheckoutIntentSummaryRealtimeMock).toHaveBeenCalledWith(USER_ID, INTENT_ID);
	});
});
