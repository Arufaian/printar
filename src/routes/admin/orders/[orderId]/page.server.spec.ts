import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn(),
		transaction: vi.fn(),
		update: vi.fn(),
		insert: vi.fn()
	}
}));

import { db } from '$lib/server/db';
import { actions, load } from './+page.server';

const selectMock = db.select as unknown as ReturnType<typeof vi.fn>;
const transactionMock = db.transaction as unknown as ReturnType<typeof vi.fn>;

const ORDER_ID = 'e6cb12ee-7792-4dd9-b00e-4d1d6fcbf0bc';
const ADMIN_ID = '701f9dd8-d3f1-4f7a-8f45-8d64f3529a7a';

const makeLoadEvent = (orderId = ORDER_ID) =>
	({
		params: { orderId }
	}) as unknown as Parameters<typeof load>[0];

const makeActionEvent = (
	{
		orderId = ORDER_ID,
		nextStatus = 'paid',
		userId = ADMIN_ID
	}: {
		orderId?: string;
		nextStatus?: string;
		userId?: string | null;
	} = {
		nextStatus: 'paid',
		userId: ADMIN_ID
	}
) =>
	({
		params: { orderId },
		request: {
			formData: async () => {
				const formData = new FormData();
				formData.set('nextStatus', nextStatus);
				return formData;
			}
		} as Request,
		locals: {
			supabase: {
				auth: {
					getUser: async () => ({
						data: {
							user: userId ? { id: userId } : null
						}
					})
				}
			}
		}
	}) as unknown as Parameters<(typeof actions)['updateStatus']>[0];

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

		await expect(load(makeLoadEvent())).rejects.toMatchObject({ status: 404 });
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

		const result = (await load(makeLoadEvent())) as {
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

	it('rejects status update when user is not authenticated', async () => {
		const result = await actions.updateStatus(makeActionEvent({ userId: null }));
		expect(result).toMatchObject({ status: 401 });
	});

	it('rejects status update when user is not admin', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({ limit: vi.fn(async () => [{ id: ADMIN_ID, role: 'customer' }]) }))
			}))
		}));

		const result = await actions.updateStatus(makeActionEvent());
		expect(result).toMatchObject({ status: 403 });
	});

	it('rejects invalid transition', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({ limit: vi.fn(async () => [{ id: ADMIN_ID, role: 'admin' }]) }))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: ORDER_ID, status: 'pending_payment' }])
					}))
				}))
			}));

		const result = await actions.updateStatus(makeActionEvent({ nextStatus: 'shipped' }));
		expect(result).toMatchObject({ status: 400 });
	});

	it('updates order status and inserts status log for valid transition', async () => {
		const txUpdateWhereMock = vi.fn(async () => [{ id: ORDER_ID }]);
		const txInsertValuesMock = vi.fn(async () => [{ id: 'log-1' }]);
		const txUpdateSetMock = vi.fn(() => ({ where: txUpdateWhereMock }));
		const txInsertMock = vi.fn(() => ({ values: txInsertValuesMock }));

		transactionMock.mockImplementationOnce(async (callback) => {
			await callback({
				update: vi.fn(() => ({ set: txUpdateSetMock })),
				insert: txInsertMock
			});
		});

		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({ limit: vi.fn(async () => [{ id: ADMIN_ID, role: 'admin' }]) }))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({ limit: vi.fn(async () => [{ id: ORDER_ID, status: 'paid' }]) }))
				}))
			}));

		const result = await actions.updateStatus(makeActionEvent({ nextStatus: 'file_review' }));

		expect(result).toMatchObject({ type: 'success' });
		expect(transactionMock).toHaveBeenCalledTimes(1);
		expect(txUpdateWhereMock).toHaveBeenCalledTimes(1);
		expect(txInsertValuesMock).toHaveBeenCalledWith({
			orderId: ORDER_ID,
			status: 'file_review',
			changeBy: ADMIN_ID
		});
	});
});
