import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock
	}
}));

import { load } from './+page.server';

const makeEvent = (categorySlug = 'cards') =>
	({ params: { categorySlug } }) as unknown as Parameters<typeof load>[0];

describe('category products page server load', () => {
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

	it('throws 404 when category is not found', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [])
				}))
			}))
		}));

		await expect(load(makeEvent())).rejects.toMatchObject({
			status: 404
		});
	});

	it('returns mapped in-stock products for existing category', async () => {
		selectMock
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn(async () => [{ id: 'cat-1', name: 'Cards', slug: 'cards' }])
					}))
				}))
			}))
			.mockImplementationOnce(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: vi.fn(async () => [
							{
								id: 'product-1',
								name: 'Business Card',
								slug: 'business-card',
								description: 'Desc'
							}
						])
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
						{ productId: 'product-1', price: 25000, imgUrl: 'https://example.com/a.jpg' },
						{ productId: 'product-1', price: 22000, imgUrl: 'https://example.com/b.jpg' }
					])
				}))
			}));

		const result = (await load(makeEvent())) as {
			category: { slug: string };
			products: Array<{ id: string; title: string; price: number; image: string }>;
		};

		expect(result.category.slug).toBe('cards');
		expect(result.products).toHaveLength(1);
		expect(result.products[0]).toMatchObject({
			id: 'product-1',
			title: 'Business Card',
			price: 22000,
			image: 'https://example.com/b.jpg'
		});
	});
});
