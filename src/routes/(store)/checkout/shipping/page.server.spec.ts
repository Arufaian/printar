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
const ORDER_ID = '2a09da97-dfda-4a9f-8315-a52a8f53ba9a';
const ADDRESS_ID = 'f72c73e0-8c29-4d8b-93fd-b48afb9dfc1f';

const makeLoadEvent = (userId: string | null) =>
	({
		url: new URL(
			'http://localhost/checkout/shipping?intentId=82de0b36-c581-4f4b-ae17-a23979878c5f'
		),
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

	return new Request('http://localhost/checkout/shipping', {
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
	}) as unknown as Parameters<NonNullable<typeof actions.selectAddress>>[0];

type ActionFailureResult = {
	status: number;
	data: {
		message?: string;
	};
};

const asActionFailureResult = (value: unknown) => value as ActionFailureResult;

describe('checkout shipping page server (address-only)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getCheckoutIntentSummaryRealtimeMock.mockResolvedValue({
			intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
			orderId: ORDER_ID,
			selectedItemIds: ['item-id'],
			selectedCount: 1,
			selectedSubtotal: 10000,
			shippingCost: 0,
			grandTotal: 10000
		});
	});

	it('redirects unauthenticated users on load', async () => {
		await expect(load(makeLoadEvent(null))).rejects.toMatchObject({
			status: 303,
			location:
				'/sign-in?redirect=%2Fcheckout%2Fshipping%3FintentId%3D82de0b36-c581-4f4b-ae17-a23979878c5f'
		});
	});

	it('rejects load when draft order is not found', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [])
				}))
			}))
		}));

		await expect(load(makeLoadEvent(USER_ID))).rejects.toMatchObject({ status: 404 });
	});

	it('returns draft order and addresses on successful load', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{
								id: ORDER_ID,
								addressId: ADDRESS_ID,
								deliveryMethod: 'courier',
								shippingCost: 18000
							}
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: 'item-id' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [
						{
							id: ADDRESS_ID,
							recipientName: 'Alfian Pratama',
							label: 'Rumah',
							isDefault: true,
							addressLine: 'Jl. Melati No. 12',
							city: 'Tangerang',
							postalCode: '15111',
							phone: '081212341234'
						}
					])
				}))
			}));

		const result = (await load(makeLoadEvent(USER_ID))) as {
			intentId: string;
			orderId: string;
			selectedAddressId: string | null;
			selectedDeliveryMethod: string | null;
			shippingCost: number | null;
			deliveryMethods: Array<{ id: string; label: string }>;
			addresses: Array<{ id: string }>;
			manageAddressUrl: string;
		};

		expect(result.intentId).toBe('82de0b36-c581-4f4b-ae17-a23979878c5f');
		expect(result.orderId).toBe(ORDER_ID);
		expect(result.selectedAddressId).toBe(ADDRESS_ID);
		expect(result.selectedDeliveryMethod).toBe('courier');
		expect(result.shippingCost).toBe(18000);
		expect(result.deliveryMethods).toHaveLength(2);
		expect(result.addresses).toHaveLength(1);
		expect(result.manageAddressUrl).toContain('/customer/addresses');
	});

	it('rejects unauthenticated selectAddress action', async () => {
		const result = await actions.selectAddress(
			makeActionEvent(
				{
					intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
					orderId: ORDER_ID,
					addressId: ADDRESS_ID
				},
				null
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
	});

	it('rejects selectAddress when payload is incomplete', async () => {
		const result = await actions.selectAddress(
			makeActionEvent(
				{ intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f', orderId: '', addressId: ADDRESS_ID },
				USER_ID
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Data alamat tidak lengkap');
	});

	it('rejects selectAddress when address is not owned by user', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [])
				}))
			}))
		}));

		const result = await actions.selectAddress(
			makeActionEvent(
				{
					intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
					orderId: ORDER_ID,
					addressId: ADDRESS_ID
				},
				USER_ID
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(404);
		expect(output.data.message).toContain('Alamat tidak ditemukan');
	});

	it('rejects selectAddress when draft order is not owned by user', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ADDRESS_ID }])
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

		const result = await actions.selectAddress(
			makeActionEvent(
				{
					intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
					orderId: ORDER_ID,
					addressId: ADDRESS_ID
				},
				USER_ID
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(404);
		expect(output.data.message).toContain('Keranjang draft tidak ditemukan');
	});

	it('updates order address and redirects on successful selectAddress', async () => {
		const whereUpdateMock = vi.fn(async () => [{ id: ORDER_ID }]);
		const setUpdateMock = vi.fn(() => ({ where: whereUpdateMock }));

		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ADDRESS_ID }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID }])
					}))
				}))
			}));

		updateMock.mockImplementationOnce(() => ({ set: setUpdateMock }));

		await expect(
			actions.selectAddress(
				makeActionEvent(
					{
						intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
						orderId: ORDER_ID,
						addressId: ADDRESS_ID
					},
					USER_ID
				)
			)
		).rejects.toMatchObject({
			status: 303,
			location: '/checkout/shipping?intentId=82de0b36-c581-4f4b-ae17-a23979878c5f'
		});

		expect(updateMock).toHaveBeenCalledTimes(1);
		expect(setUpdateMock).toHaveBeenCalledWith({ addressId: ADDRESS_ID });
	});

	it('rejects selectDeliveryMethod when payload is incomplete', async () => {
		const result = await actions.selectDeliveryMethod(
			makeActionEvent(
				{ intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f', orderId: ORDER_ID, deliveryMethod: '' },
				USER_ID
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Data metode pengiriman tidak lengkap');
	});

	it('rejects selectDeliveryMethod when method is invalid', async () => {
		const result = await actions.selectDeliveryMethod(
			makeActionEvent(
				{
					intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
					orderId: ORDER_ID,
					deliveryMethod: 'same-day'
				},
				USER_ID
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Metode pengiriman tidak valid');
	});

	it('rejects selectDeliveryMethod when draft order is not owned by user', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [])
				}))
			}))
		}));

		const result = await actions.selectDeliveryMethod(
			makeActionEvent(
				{
					intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
					orderId: ORDER_ID,
					deliveryMethod: 'courier'
				},
				USER_ID
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(404);
		expect(output.data.message).toContain('Keranjang draft tidak ditemukan');
	});

	it('updates delivery method and redirects on successful selectDeliveryMethod', async () => {
		const whereUpdateMock = vi.fn(async () => [{ id: ORDER_ID }]);
		const setUpdateMock = vi.fn(() => ({ where: whereUpdateMock }));

		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [{ id: ORDER_ID }])
				}))
			}))
		}));

		updateMock.mockImplementationOnce(() => ({ set: setUpdateMock }));

		await expect(
			actions.selectDeliveryMethod(
				makeActionEvent(
					{
						intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
						orderId: ORDER_ID,
						deliveryMethod: 'pickup'
					},
					USER_ID
				)
			)
		).rejects.toMatchObject({
			status: 303,
			location: '/checkout/shipping?intentId=82de0b36-c581-4f4b-ae17-a23979878c5f'
		});

		expect(updateMock).toHaveBeenCalledTimes(1);
		expect(setUpdateMock).toHaveBeenCalledWith({ deliveryMethod: 'pickup', shippingCost: 0 });
	});

	it('sets shippingCost 18000 when selecting courier delivery method', async () => {
		const whereUpdateMock = vi.fn(async () => [{ id: ORDER_ID }]);
		const setUpdateMock = vi.fn(() => ({ where: whereUpdateMock }));

		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [{ id: ORDER_ID }])
				}))
			}))
		}));

		updateMock.mockImplementationOnce(() => ({ set: setUpdateMock }));

		await expect(
			actions.selectDeliveryMethod(
				makeActionEvent(
					{
						intentId: '82de0b36-c581-4f4b-ae17-a23979878c5f',
						orderId: ORDER_ID,
						deliveryMethod: 'courier'
					},
					USER_ID
				)
			)
		).rejects.toMatchObject({
			status: 303,
			location: '/checkout/shipping?intentId=82de0b36-c581-4f4b-ae17-a23979878c5f'
		});

		expect(updateMock).toHaveBeenCalledTimes(1);
		expect(setUpdateMock).toHaveBeenCalledWith({ deliveryMethod: 'courier', shippingCost: 18000 });
	});
});
