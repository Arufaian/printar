import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

import { load } from './+page.server';

describe('store homepage server load', () => {
	const defaultSelectChain = () => ({
		from: vi.fn(() => ({
			where: vi.fn(() => ({
				limit: vi.fn(() => ({}))
			}))
		}))
	});

	beforeEach(() => {
		vi.clearAllMocks();
		selectMock.mockImplementation(defaultSelectChain);
	});

	it('returns empty list when no in-stock products are selected', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(() => ({
							limit: vi.fn(async () => [])
						}))
					}))
				}))
			}))
		}));

		const result = await load({} as Parameters<typeof load>[0]);
		expect(result).toEqual({ latestProducts: [] });
	});

	it('maps products using lowest in-stock variant data', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					leftJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: vi.fn(() => ({
								limit: vi.fn(async () => [
									{
										id: 'product-1',
										name: 'Business Card',
										description: 'Desc',
										productSlug: 'business-card',
										categorySlug: 'cards'
									}
								])
							}))
						}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(() => ({}))
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(async () => [
						{ productId: 'product-1', price: 20000, imgUrl: 'https://example.com/a.jpg' },
						{ productId: 'product-1', price: 15000, imgUrl: 'https://example.com/b.jpg' }
					])
				}))
			}));

		const result = (await load({} as Parameters<typeof load>[0])) as {
			latestProducts: Array<{ id: string; title: string; price: number; image: string }>;
		};
		expect(result.latestProducts).toHaveLength(1);
		expect(result.latestProducts[0]).toMatchObject({
			id: 'product-1',
			title: 'Business Card',
			price: 15000,
			image: 'https://example.com/b.jpg'
		});
	});
});
