import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCheckoutIntentSummaryRealtimeMock = vi.hoisted(() => vi.fn());

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

import { load } from './+layout.server';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';
const INTENT_ID = '82de0b36-c581-4f4b-ae17-a23979878c5f';

const makeEvent = (
	userId: string | null,
	url = `http://localhost/checkout/shipping?intentId=${INTENT_ID}`
) =>
	({
		url: new URL(url),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof load>[0];

describe('checkout layout server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getCheckoutIntentSummaryRealtimeMock.mockResolvedValue({
			intentId: INTENT_ID,
			orderId: 'order-1',
			selectedItemIds: ['item-1'],
			selectedCount: 1,
			selectedSubtotal: 20000,
			shippingCost: 18000,
			grandTotal: 38000
		});
	});

	it('redirects unauthenticated users to sign in', async () => {
		await expect(load(makeEvent(null))).rejects.toMatchObject({
			status: 303,
			location:
				'/sign-in?redirect=%2Fcheckout%2Fshipping%3FintentId%3D82de0b36-c581-4f4b-ae17-a23979878c5f'
		});
	});

	it('redirects to cart when intentId is missing', async () => {
		await expect(
			load(makeEvent(USER_ID, 'http://localhost/checkout/shipping'))
		).rejects.toMatchObject({
			status: 303,
			location: '/cart'
		});
	});

	it('returns checkout summary when intent is valid', async () => {
		const result = (await load(makeEvent(USER_ID))) as {
			intentId: string;
			selectedSubtotal: number;
			shippingCost: number;
			grandTotal: number;
		};

		expect(result.intentId).toBe(INTENT_ID);
		expect(result.selectedSubtotal).toBe(20000);
		expect(result.shippingCost).toBe(18000);
		expect(result.grandTotal).toBe(38000);
		expect(getCheckoutIntentSummaryRealtimeMock).toHaveBeenCalledWith(USER_ID, INTENT_ID);
	});
});
