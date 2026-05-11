import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

import { load } from './+page.server';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';
const ORDER_ID = '1f879ee0-89f1-4c3d-9df4-5f3299aa9d7f';

const makeEvent = (userId: string | null, orderId = ORDER_ID) =>
	({
		params: { orderId },
		url: new URL(`https://example.com/print/invoice/${orderId}`),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof load>[0];

describe('/print/invoice/[orderId] page server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('redirects guest users to sign-in', async () => {
		await expect(load(makeEvent(null))).rejects.toMatchObject({
			status: 303,
			location: '/sign-in?redirect=/customer/orders'
		});
	});

	it('returns 404 when order is not owned by user', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [])
					}))
				}))
			}))
		}));

		await expect(load(makeEvent(USER_ID))).rejects.toMatchObject({ status: 404 });
	});

	it('maps invoice payload from order data', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn(async () => [
								{
									id: ORDER_ID,
									status: 'pending_payment',
									createdAt: '2026-05-02T10:00:00.000Z',
									shippingCost: 18000,
									totalPrice: 68000,
									customerNote: 'Harap cepat',
									addressRecipientName: 'Alfian'
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
									itemPrice: 20000,
									productName: 'Poster',
									variantName: 'Glossy'
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
							{ orderItemId: 'item-1', optionName: 'Laminasi', optionPrice: 5000 }
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => ({
							limit: vi.fn(async () => [{ status: 'pending', paymentMethod: 'bank_transfer' }])
						}))
					}))
				}))
			}));

		const result = (await load(makeEvent(USER_ID, ORDER_ID))) as {
			invoice: {
				invoiceNumber: string;
				status: string;
				subtotal: number;
				grandTotal: number;
				items: Array<{ lineTotal: number; options: string[] }>;
			};
		};

		expect(result.invoice.invoiceNumber).toBe('INV-1F879EE0');
		expect(result.invoice.status).toBe('Menunggu Pembayaran');
		expect(result.invoice.subtotal).toBe(50000);
		expect(result.invoice.grandTotal).toBe(68000);
		expect(result.invoice.items[0].lineTotal).toBe(50000);
		expect(result.invoice.items[0].options).toEqual(['Laminasi']);
	});
});
