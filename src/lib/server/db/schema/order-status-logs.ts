import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { orders, orderStatusEnum } from './order';
import { profiles } from './profiles';

export const orderStatusLogs = pgTable('order_status_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	orderItemId: uuid('order_item_id').references(() => orders.id),
	status: orderStatusEnum(),
	changeBy: uuid('change_by').references(() => profiles.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});
