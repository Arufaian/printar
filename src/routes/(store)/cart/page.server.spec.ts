import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		transaction: transactionMock,
		update: updateMock
	}
}));

import { actions, load } from './+page.server';

const makeEvent = (userId: string | null) =>
	({
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof load>[0];

const buildFormRequest = (payload: Record<string, string | string[]>) => {
	const formData = new URLSearchParams();
	for (const [key, value] of Object.entries(payload)) {
		if (Array.isArray(value)) {
			for (const item of value) formData.append(key, item);
			continue;
		}

		formData.append(key, value);
	}

	return new Request('http://localhost/cart', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: formData.toString()
	});
};

const makeActionEvent = (payload: Record<string, string | string[]>, userId: string | null) =>
	({
		request: buildFormRequest(payload),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<NonNullable<typeof actions.updateQuantity>>[0];

const makeCheckoutEvent = (payload: Record<string, string | string[]>, userId: string | null) =>
	({
		request: buildFormRequest(payload),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<NonNullable<typeof actions.checkout>>[0];

const makeAttachDesignEvent = (payload: Record<string, string | string[]>, userId: string | null) =>
	({
		request: buildFormRequest(payload),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			})),
			supabase: {
				storage: {
					from: vi.fn(() => ({
						remove: vi.fn(async () => ({ error: null }))
					}))
				}
			}
		}
	}) as unknown as Parameters<NonNullable<typeof actions.attachDesignFile>>[0];

type ActionFailureResult = {
	status: number;
	data: {
		message?: string;
	};
};

const asActionFailureResult = (value: unknown) => value as ActionFailureResult;

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
					where: vi.fn(() => ({
						orderBy: vi.fn(async () => rows)
					}))
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

const mockCheckoutSelectionQuery = (rows: Array<Record<string, unknown>>) => {
	selectMock.mockImplementationOnce(() => ({
		from: vi.fn(() => ({
			innerJoin: vi.fn(() => ({
				where: vi.fn(async () => rows)
			}))
		}))
	}));
};

const mockOwnershipQuery = (rows: Array<Record<string, unknown>>) => {
	selectMock.mockImplementationOnce(() => ({
		from: vi.fn(() => ({
			innerJoin: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => rows)
					}))
				}))
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
				filePath: 'customer-design/user-1/design-a.pdf',
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
			designFilePath: 'customer-design/user-1/design-a.pdf',
			hasDesignFile: true,
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

	it('maps item without design file as missing design status', async () => {
		mockDraftOrderQuery([{ id: 'order-2', shippingCost: 0, totalPrice: null }]);
		mockOrderItemsQuery([
			{
				id: 'item-2',
				quantity: 1,
				itemPrice: 8000,
				filePath: null,
				variantName: 'Varian B',
				variantStock: 4,
				variantImage: null,
				productName: 'Produk B'
			}
		]);
		mockItemOptionsQuery([]);

		const result = (await load(makeEvent('b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'))) as {
			cartItems: Array<Record<string, unknown>>;
		};

		expect(result.cartItems).toHaveLength(1);
		expect(result.cartItems[0]).toMatchObject({
			id: 'item-2',
			designFilePath: null,
			hasDesignFile: false
		});
	});

	it('updateQuantity rejects unauthenticated users', async () => {
		const result = await actions.updateQuantity(
			makeActionEvent({ itemId: 'item-1', quantity: '2' }, null)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('updateQuantity rejects invalid quantity before DB query', async () => {
		const result = await actions.updateQuantity(
			makeActionEvent({ itemId: 'item-1', quantity: '0' }, 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b')
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Jumlah minimal 1');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('removeItem rejects missing item id before DB query', async () => {
		const actionEvent = {
			request: buildFormRequest({ itemId: '' }),
			locals: {
				safeGetSession: vi.fn(async () => ({
					user: { id: 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b' }
				}))
			}
		} as unknown as Parameters<NonNullable<typeof actions.removeItem>>[0];

		const result = await actions.removeItem(actionEvent);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Item keranjang wajib diisi');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('checkout rejects unauthenticated users', async () => {
		const result = await actions.checkout(makeCheckoutEvent({ selectedItemIds: ['item-1'] }, null));
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('checkout rejects empty selection before DB query', async () => {
		const result = await actions.checkout(
			makeCheckoutEvent({ selectedItemIds: [] }, 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b')
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Pilih minimal satu item');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('checkout rejects when selected item is not found', async () => {
		mockCheckoutSelectionQuery([]);

		const result = await actions.checkout(
			makeCheckoutEvent({ selectedItemIds: ['item-1'] }, 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b')
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(404);
		expect(output.data.message).toContain('tidak ditemukan');
	});

	it('checkout rejects when selected item has no design file', async () => {
		mockCheckoutSelectionQuery([
			{
				itemId: 'item-1',
				orderId: 'order-1',
				filePath: null
			}
		]);

		const result = await actions.checkout(
			makeCheckoutEvent({ selectedItemIds: ['item-1'] }, 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b')
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('belum memiliki file desain');
	});

	it('checkout redirects to /checkout with selected item ids', async () => {
		mockCheckoutSelectionQuery([
			{
				itemId: 'item-1',
				orderId: 'order-1',
				filePath: 'customer-design/user-1/design-1.pdf'
			},
			{
				itemId: 'item-2',
				orderId: 'order-1',
				filePath: 'customer-design/user-1/design-2.pdf'
			}
		]);

		await expect(
			actions.checkout(
				makeCheckoutEvent(
					{ selectedItemIds: ['item-1', 'item-2'] },
					'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'
				)
			)
		).rejects.toMatchObject({
			status: 303,
			location: '/checkout?itemId=item-1&itemId=item-2'
		});
	});

	it('attachDesignFile rejects unauthenticated users', async () => {
		const result = await actions.attachDesignFile(
			makeAttachDesignEvent(
				{ itemId: 'item-1', designFilePath: 'customer-design/user-1/design.pdf' },
				null
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
	});

	it('attachDesignFile rejects invalid design file path', async () => {
		const result = await actions.attachDesignFile(
			makeAttachDesignEvent(
				{ itemId: 'item-1', designFilePath: 'https://example.com/design.pdf' },
				'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Path file desain tidak valid');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('attachDesignFile updates selected cart item', async () => {
		mockOwnershipQuery([
			{
				orderId: 'order-1',
				itemId: 'item-1',
				variantStock: 4,
				filePath: null
			}
		]);

		const whereMock = vi.fn(async () => [{ id: 'item-1' }]);
		const setMock = vi.fn(() => ({
			where: whereMock
		}));

		updateMock.mockImplementationOnce(() => ({
			set: setMock
		}));

		const result = (await actions.attachDesignFile(
			makeAttachDesignEvent(
				{ itemId: 'item-1', designFilePath: 'customer-design/user-1/design.pdf' },
				'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'
			)
		)) as {
			type: string;
			text: string;
		};

		expect(updateMock).toHaveBeenCalledTimes(1);
		expect(setMock).toHaveBeenCalledWith({
			filePath: 'customer-design/user-1/design.pdf'
		});
		expect(result.type).toBe('success');
		expect(result.text).toContain('berhasil dilampirkan');
	});
});
