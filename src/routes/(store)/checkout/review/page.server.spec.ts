import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const getCheckoutIntentSummaryRealtimeMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		update: updateMock
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

import { actions, load } from './+page.server';

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

const buildFormRequest = (payload: Record<string, string>) => {
	const formData = new URLSearchParams();
	for (const [key, value] of Object.entries(payload)) {
		formData.append(key, value);
	}

	return new Request('http://localhost/checkout/review', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: formData.toString()
	});
};

const makeActionEvent = (payload: Record<string, string>, userId: string | null) =>
	({
		request: buildFormRequest(payload),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<NonNullable<typeof actions.saveCustomerNote>>[0];

type ActionFailureResult = {
	status: number;
	data: {
		message?: string;
	};
};

const asActionFailureResult = (value: unknown) => value as ActionFailureResult;

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

	it('saveCustomerNote rejects unauthenticated user', async () => {
		const result = await actions.saveCustomerNote(
			makeActionEvent({ intentId: INTENT_ID, customerNote: 'Halo' }, null)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
	});

	it('saveCustomerNote rejects invalid intentId', async () => {
		const result = await actions.saveCustomerNote(
			makeActionEvent({ intentId: 'invalid-id', customerNote: 'Halo' }, USER_ID)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('ID checkout tidak valid');
	});

	it('saveCustomerNote rejects note longer than 200 chars', async () => {
		const result = await actions.saveCustomerNote(
			makeActionEvent({ intentId: INTENT_ID, customerNote: 'a'.repeat(201) }, USER_ID)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Catatan maksimal 200 karakter');
	});

	it('saveCustomerNote stores null when note is emptied', async () => {
		selectMock.mockReset();
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [{ id: ORDER_ID }])
				}))
			}))
		}));

		const whereUpdateMock = vi.fn(async () => [{ id: ORDER_ID }]);
		const setUpdateMock = vi.fn(() => ({ where: whereUpdateMock }));
		updateMock.mockImplementationOnce(() => ({ set: setUpdateMock }));

		const result = (await actions.saveCustomerNote(
			makeActionEvent({ intentId: INTENT_ID, customerNote: '   ' }, USER_ID)
		)) as { type: string; text: string };

		expect(result.type).toBe('success');
		expect(setUpdateMock).toHaveBeenCalledWith({ customerNote: null });
	});

	it('saveCustomerNote updates note when valid', async () => {
		selectMock.mockReset();
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [{ id: ORDER_ID }])
				}))
			}))
		}));

		const whereUpdateMock = vi.fn(async () => [{ id: ORDER_ID }]);
		const setUpdateMock = vi.fn(() => ({ where: whereUpdateMock }));
		updateMock.mockImplementationOnce(() => ({ set: setUpdateMock }));

		const result = (await actions.saveCustomerNote(
			makeActionEvent({ intentId: INTENT_ID, customerNote: 'Kirim sebelum jam 15.00' }, USER_ID)
		)) as { type: string; text: string };

		expect(result.type).toBe('success');
		expect(result.text).toContain('berhasil disimpan');
		expect(setUpdateMock).toHaveBeenCalledWith({ customerNote: 'Kirim sebelum jam 15.00' });
	});
});
