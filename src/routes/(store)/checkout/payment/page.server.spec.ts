import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const getCheckoutIntentSummaryRealtimeMock = vi.hoisted(() => vi.fn());

vi.mock('$env/static/public', () => ({
	PUBLIC_MIDTRANS_CLIENT_KEY: 'Mid-client-sandbox-key'
}));

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
	url = `http://localhost/checkout/payment?intentId=${INTENT_ID}`
) =>
	({
		url: new URL(url),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof load>[0];

describe('checkout payment page server', () => {
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
									status: 'draft',
									addressId: 'addr-1',
									deliveryMethod: 'courier',
									customerNote: 'Catatan test',
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
									quantity: 1,
									itemPrice: 20000,
									variantName: 'Merah',
									variantImage: 'https://example.com/variant.jpg',
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
							{ orderItemId: 'item-1', optionPrice: 5000, optionName: 'Extra Cheese' }
						])
					}))
				}))
			}));
	});

	it('redirects unauthenticated user to sign-in', async () => {
		await expect(load(makeEvent(null))).rejects.toMatchObject({
			status: 303,
			location:
				'/sign-in?redirect=%2Fcheckout%2Fpayment%3FintentId%3D82de0b36-c581-4f4b-ae17-a23979878c5f'
		});
	});

	it('redirects to cart when intentId is missing', async () => {
		await expect(
			load(makeEvent(USER_ID, 'http://localhost/checkout/payment'))
		).rejects.toMatchObject({
			status: 303,
			location: '/cart'
		});
	});

	it('redirects to home when result=finish is present', async () => {
		await expect(
			load(
				makeEvent(USER_ID, `http://localhost/checkout/payment?intentId=${INTENT_ID}&result=finish`)
			)
		).rejects.toMatchObject({
			status: 303,
			location: '/'
		});
	});

	it('redirects to cart when intent is invalid', async () => {
		await expect(
			load(makeEvent(USER_ID, 'http://localhost/checkout/payment?intentId=invalid-id'))
		).rejects.toMatchObject({
			status: 303,
			location: '/cart'
		});
	});

	it('returns payment page data when intent is valid', async () => {
		const result = (await load(makeEvent(USER_ID))) as {
			intentId: string;
			orderId: string;
			grandTotal: number;
			selectedDeliveryMethodLabel: string | null;
			customerNote: string | null;
			items: Array<{ name: string; lineTotal: number; image: string | null }>;
			midtransClientKey: string;
			midtransScriptUrl: string;
		};

		expect(result.intentId).toBe(INTENT_ID);
		expect(result.orderId).toBe(ORDER_ID);
		expect(result.grandTotal).toBe(38000);
		expect(result.selectedDeliveryMethodLabel).toBe('Diantar ke alamat');
		expect(result.customerNote).toBe('Catatan test');
		expect(result.items).toHaveLength(1);
		expect(result.items[0].name).toBe('Produk A');
		expect(result.items[0].lineTotal).toBe(25000);
		expect(result.items[0].image).toBe('https://example.com/variant.jpg');
		expect(result.midtransClientKey).toBe('Mid-client-sandbox-key');
		expect(result.midtransScriptUrl).toContain('sandbox.midtrans.com');
	});
});
