import { and, desc, eq, ilike, inArray, ne, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { orders, payments, profiles } from '$lib/server/db/schema';
import type {
	AdminOrderListData,
	AdminOrderListFilters,
	AdminOrderListItem
} from '$lib/types/admin-orders';
import type { PageServerLoad } from './$types';

const DEFAULT_FILTERS: AdminOrderListFilters = {
	q: '',
	status: 'all',
	payment: 'all'
};

export const load: PageServerLoad<AdminOrderListData> = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const status = (url.searchParams.get('status') ?? 'all').trim();
	const payment = (url.searchParams.get('payment') ?? 'all').trim();

	const orderRows = await db
		.select({
			id: orders.id,
			status: orders.status,
			totalPrice: orders.totalPrice,
			createdAt: orders.createdAt,
			customerName: profiles.name
		})
		.from(orders)
		.leftJoin(profiles, eq(orders.profileId, profiles.id))
		.where(
			and(
				ne(orders.status, 'draft'),
				q ? or(ilike(orders.id, `%${q}%`), ilike(profiles.name, `%${q}%`)) : undefined
			)
		)
		.orderBy(desc(orders.createdAt));

	const orderIds = orderRows.map((row) => row.id);
	const paymentRows =
		orderIds.length > 0
			? await db
					.select({
						orderId: payments.orderId,
						status: payments.status,
						createdAt: payments.createdAt
					})
					.from(payments)
					.where(inArray(payments.orderId, orderIds))
					.orderBy(desc(payments.createdAt))
			: [];

	const latestPaymentByOrderId = new Map<string, string | null>();
	for (const paymentRow of paymentRows) {
		if (!paymentRow.orderId || latestPaymentByOrderId.has(paymentRow.orderId)) continue;
		latestPaymentByOrderId.set(paymentRow.orderId, paymentRow.status ?? null);
	}

	const mappedOrders: AdminOrderListItem[] = orderRows
		.map((row) => ({
			id: row.id,
			customerName: row.customerName?.trim() || 'Pelanggan',
			status: row.status ?? 'pending_payment',
			latestPaymentStatus: latestPaymentByOrderId.get(row.id) ?? null,
			totalPrice: row.totalPrice ?? 0,
			createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
		}))
		.filter((row) => (status === 'all' ? true : row.status === status))
		.filter((row) => (payment === 'all' ? true : (row.latestPaymentStatus ?? 'none') === payment));

	return {
		orders: mappedOrders,
		filters: {
			...DEFAULT_FILTERS,
			q,
			status,
			payment
		}
	};
};
