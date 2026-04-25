import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		transaction: vi.fn()
	}
}));

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
		expect(output.data.message).toContain('Please sign in first');
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
		expect(output.data.message).toContain('Variant is required');
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
		expect(output.data.message).toContain('Quantity must be at least 1');
		expect(selectMock).not.toHaveBeenCalled();
	});
});
