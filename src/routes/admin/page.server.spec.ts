import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

describe('/admin root page server', () => {
	it('redirects /admin to /admin/dashboard', async () => {
		await expect(load({} as Parameters<typeof load>[0])).rejects.toMatchObject({
			status: 303,
			location: '/admin/dashboard'
		});
	});
});
