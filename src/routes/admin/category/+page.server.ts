export async function load() {
	type Category = {
		id: string;
		amount: number;
		status: 'pending' | 'processing' | 'success' | 'failed';
		email: string;
	};

	const categories: Category[] = [
		{
			id: '728ed52f',
			amount: 100,
			status: 'pending',
			email: 'm@example.com'
		},
		{
			id: '489e1d42',
			amount: 125,
			status: 'processing',
			email: 'example@gmail.com'
		},
		{
			id: 'a1b2c3d4',
			amount: 250,
			status: 'success',
			email: 'johndoe@company.co.id'
		},
		{
			id: 'f47ac10b',
			amount: 89,
			status: 'failed',
			email: 'sarah.w@outlook.com'
		},
		{
			id: '9c8b7a6d',
			amount: 500,
			status: 'pending',
			email: 'contact@startup.net'
		},
		{
			id: 'e5d4c3b2',
			amount: 15,
			status: 'success',
			email: 'user99@yahoo.com'
		},
		{
			id: '3f2e1d0c',
			amount: 1050,
			status: 'processing',
			email: 'admin@tangerang-hub.id'
		},
		{
			id: '8a9b0c1d',
			amount: 75,
			status: 'processing',
			email: 'buyer_one@shop.com'
		},
		{
			id: '1b2c3d4e',
			amount: 320,
			status: 'success',
			email: 'hello@world.org'
		},
		{
			id: '5e6f7a8b',
			amount: 45,
			status: 'failed',
			email: 'test.account@dev.local'
		},
		{
			id: '9f8e7d6c',
			amount: 880,
			status: 'pending',
			email: 'sales@merchant.com'
		},
		{
			id: '2a3b4c5d',
			amount: 210,
			status: 'processing',
			email: 'info@service.id'
		},
		{
			id: '6d7e8f9a',
			amount: 150,
			status: 'success',
			email: 'customer_support@web.com'
		},
		{
			id: '0c1b2a3f',
			amount: 95,
			status: 'failed',
			email: 'bounced@mail.net'
		},
		{
			id: 'b3c4d5e6',
			amount: 430,
			status: 'success',
			email: 'premium_user@gmail.com'
		},
		{
			id: 'd4e5f6a7',
			amount: 177013,
			status: 'success',
			email: 'anomaly@system.xyz'
		}
	];
	return {
		categories
	};
}
