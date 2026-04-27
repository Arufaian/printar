import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const addItemToDraftCartMock = vi.hoisted(() => vi.fn());
const resolveStoreProductByParamsMock = vi.hoisted(() => vi.fn());
const normalizeOptionIdsMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		transaction: vi.fn()
	}
}));

vi.mock('$lib/server/services/cart', async () => {
	const actual = await vi.importActual<typeof import('$lib/server/services/cart')>(
		'$lib/server/services/cart'
	);

	return {
		...actual,
		addItemToDraftCart: addItemToDraftCartMock
	};
});

vi.mock('$lib/server/services/store-product', async () => {
	const actual = await vi.importActual<typeof import('$lib/server/services/store-product')>(
		'$lib/server/services/store-product'
	);

	return {
		...actual,
		resolveStoreProductByParams: resolveStoreProductByParamsMock,
		normalizeOptionIds: normalizeOptionIdsMock
	};
});

import { actions } from './+page.server';

type ActionFailureResult = {
	status: number;
	data: {
		message?: string;
	};
};

const asActionFailureResult = (value: unknown) => value as ActionFailureResult;

const buildFormRequest = (payload: Record<string, string | string[]>) => {
	const formData = new URLSearchParams();

	for (const [key, value] of Object.entries(payload)) {
		if (Array.isArray(value)) {
			for (const item of value) formData.append(key, item);
			continue;
		}

		formData.append(key, value);
	}

	return new Request('http://localhost/products/add-to-cart', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded'
		},
		body: formData.toString()
	});
};

const makeEvent = (payload: Record<string, string | string[]>, userId: string | null) =>
	({
		params: {
			categorySlug: 'business-cards',
			productSlug: 'business-card-premium'
		},
		request: buildFormRequest(payload),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<NonNullable<typeof actions.addToCart>>[0];

describe('store product addToCart action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		normalizeOptionIdsMock.mockImplementation((values: FormDataEntryValue[]) =>
			values
				.filter((value): value is string => typeof value === 'string')
				.map((value) => value.trim())
				.filter((value) => value.length > 0)
		);
	});

	it('returns 401 when user is not authenticated', async () => {
		const event = makeEvent(
			{
				variantId: 'd4db2b09-047e-4adf-a152-50a2955140e1',
				quantity: '1'
			},
			null
		);

		const result = await actions.addToCart(event);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('returns 400 when variantId is missing', async () => {
		const event = makeEvent(
			{
				quantity: '1'
			},
			'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'
		);

		const result = await actions.addToCart(event);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Varian wajib dipilih');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('returns 400 when quantity is invalid', async () => {
		const event = makeEvent(
			{
				variantId: 'd4db2b09-047e-4adf-a152-50a2955140e1',
				quantity: '0'
			},
			'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'
		);

		const result = await actions.addToCart(event);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Jumlah minimal 1');
		expect(selectMock).not.toHaveBeenCalled();
	});

	it('returns 400 when design file path is invalid', async () => {
		const event = makeEvent(
			{
				variantId: 'd4db2b09-047e-4adf-a152-50a2955140e1',
				quantity: '1',
				designFilePath: 'https://example.com/file.pdf'
			},
			'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'
		);

		const result = await actions.addToCart(event);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('Path file desain tidak valid');
		expect(resolveStoreProductByParamsMock).not.toHaveBeenCalled();
		expect(addItemToDraftCartMock).not.toHaveBeenCalled();
	});

	it('passes design file path into add to cart service', async () => {
		resolveStoreProductByParamsMock.mockResolvedValueOnce({
			productRow: { id: '0fa96495-100c-4920-8427-c5ebafec882e' }
		});

		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [
							{ id: 'd4db2b09-047e-4adf-a152-50a2955140e1', price: 12000, stock: 10 }
						])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [])
				}))
			}));

		addItemToDraftCartMock.mockResolvedValueOnce(undefined);

		const event = makeEvent(
			{
				variantId: 'd4db2b09-047e-4adf-a152-50a2955140e1',
				quantity: '1',
				designFilePath: 'customer-design/b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b/design-file.pdf'
			},
			'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b'
		);

		await actions.addToCart(event);

		expect(addItemToDraftCartMock).toHaveBeenCalledWith(
			expect.objectContaining({
				designFilePath: 'customer-design/b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b/design-file.pdf'
			})
		);
	});
});
