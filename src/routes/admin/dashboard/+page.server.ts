import { and, count, eq, gte, ne, sum } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const windowDays = 7;
	const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

	const [ordersCountRows, paidOrdersCountRows, pendingPaymentCountRows, salesTotalRows] =
		await Promise.all([
			db
				.select({ count: count() })
				.from(orders)
				.where(and(ne(orders.status, 'draft'), gte(orders.createdAt, windowStart))),
			db
				.select({ count: count() })
				.from(orders)
				.where(and(eq(orders.status, 'paid'), gte(orders.createdAt, windowStart))),
			db
				.select({ count: count() })
				.from(orders)
				.where(and(eq(orders.status, 'pending_payment'), gte(orders.createdAt, windowStart))),
			db
				.select({ total: sum(orders.totalPrice) })
				.from(orders)
				.where(and(eq(orders.status, 'paid'), gte(orders.createdAt, windowStart)))
		]);

	const ordersCountRow = ordersCountRows[0];
	const paidOrdersCountRow = paidOrdersCountRows[0];
	const pendingPaymentCountRow = pendingPaymentCountRows[0];
	const salesTotalRow = salesTotalRows[0];

	return {
		windowDays,
		stats: {
			ordersCount: ordersCountRow?.count ?? 0,
			paidOrdersCount: paidOrdersCountRow?.count ?? 0,
			pendingPaymentCount: pendingPaymentCountRow?.count ?? 0,
			salesTotal: Number(salesTotalRow?.total ?? 0)
		}
	};
};
