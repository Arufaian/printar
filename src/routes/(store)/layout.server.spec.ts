import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const getDraftCartCountMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

vi.mock('$lib/server/services/cart', () => ({
	getDraftCartCount: getDraftCartCountMock
}));

import { load } from './+layout.server';

const makeEvent = ({ user }: { user: { id: string; email?: string | null } | null }) =>
	({
		locals: {
			supabase: {
				auth: {
					getUser: vi.fn(async () => ({
						data: { user }
					}))
				}
			}
		}
	}) as unknown as Parameters<typeof load>[0];

describe('store layout server load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns empty profile and cart count for guest', async () => {
		const result = await load(makeEvent({ user: null }));

		expect(result).toEqual({
			profile: null,
			cartCount: 0
		});
		expect(selectMock).not.toHaveBeenCalled();
		expect(getDraftCartCountMock).not.toHaveBeenCalled();
	});

	it('returns profile and draft cart count for signed-in user', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [{ name: 'Alfian', role: 'customer' }])
				}))
			}))
		}));
		getDraftCartCountMock.mockResolvedValueOnce(5);

		const result = await load(
			makeEvent({
				user: {
					id: 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b',
					email: 'alfian@example.com'
				}
			})
		);

		expect(result).toEqual({
			profile: {
				name: 'Alfian',
				role: 'customer',
				email: 'alfian@example.com'
			},
			cartCount: 5
		});
		expect(getDraftCartCountMock).toHaveBeenCalledWith('b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b');
	});

	it('returns null profile but keeps cart count when profile row is missing', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [])
				}))
			}))
		}));
		getDraftCartCountMock.mockResolvedValueOnce(2);

		const result = await load(
			makeEvent({
				user: {
					id: 'd0fb3ac9-a7d9-4bd5-b9a4-d9ca716d0e8b',
					email: 'unknown@example.com'
				}
			})
		);

		expect(result).toEqual({
			profile: null,
			cartCount: 2
		});
	});
});
