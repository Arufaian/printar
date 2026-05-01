import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

import { load } from './+page.server';

const ORDER_ID = 'e6cb12ee-7792-4dd9-b00e-4d1d6fcbf0bc';

const makeEvent = (orderId = ORDER_ID) =>
	({
		params: { orderId }
	}) as unknown as Parameters<typeof load>[0];

describe('/admin/orders/[orderId] page server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('throws 404 when order does not exist', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({ limit: vi.fn(async () => []) }))
					}))
				}))
			}))
		}));

		await expect(load(makeEvent())).rejects.toMatchObject({ status: 404 });
	});

	it('maps order detail with items, payment and timeline', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						leftJoin: vi.fn(() => ({
							where: vi.fn(() => ({
								limit: vi.fn(async () => [
									{
										id: ORDER_ID,
										status: 'paid',
										createdAt: '2026-05-01T09:00:00.000Z',
										updatedAt: '2026-05-01T10:00:00.000Z',
										deliveryMethod: 'courier',
										shippingCost: 18000,
										totalPrice: 58000,
										customerNote: 'Catatan admin',
										customerName: 'Alfian',
										customerEmail: 'alfian@mail.com',
										addressRecipientName: 'Alfian',
										addressLabel: 'Rumah',
										addressLine: 'Jl. Mawar No. 1',
										addressCity: 'Bandung',
										addressPostalCode: '40123',
										addressPhone: '08123456789'
									}
								])
							}))
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
									itemPrice: 40000,
									filePath: '/uploads/design.pdf',
									productName: 'Poster',
									variantName: 'A3',
									variantImage: 'https://img'
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
									orderItemId: 'item-1',
									optionName: 'Laminasi',
									optionPrice: 0,
									groupName: 'Finishing'
								}
							])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => ({
							limit: vi.fn(async () => [{ status: 'settlement', paymentMethod: 'bank_transfer' }])
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(async () => [
								{
									status: 'pending_payment',
									createdAt: '2026-05-01T09:00:00.000Z',
									changedByName: null
								},
								{
									status: 'paid',
									createdAt: '2026-05-01T09:30:00.000Z',
									changedByName: 'Admin A'
								}
							])
						}))
					}))
				}))
			}));

		const result = (await load(makeEvent())) as {
			order: {
				status: string;
				latestPaymentStatus: string | null;
				subtotal: number;
				grandTotal: number;
				items: Array<{ options: string[]; filePath: string | null }>;
				timeline: Array<{ status: string; changedByName: string | null }>;
			};
		};

		expect(result.order.status).toBe('paid');
		expect(result.order.latestPaymentStatus).toBe('settlement');
		expect(result.order.subtotal).toBe(40000);
		expect(result.order.grandTotal).toBe(58000);
		expect(result.order.items[0].options).toEqual(['Finishing: Laminasi']);
		expect(result.order.items[0].filePath).toBe('/uploads/design.pdf');
		expect(result.order.timeline).toHaveLength(2);
		expect(result.order.timeline[1]).toMatchObject({ status: 'paid', changedByName: 'Admin A' });
	});
});
