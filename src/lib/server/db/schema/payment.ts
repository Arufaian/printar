import { pgTable, uuid, pgEnum, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './order';

export const paymentStatus = pgEnum('payment_status', [
	'pending',
	'settlement',
	'expire',
	'cancel'
]);

export const refundStatusEnum = pgEnum('refund_status_enum', ['none', 'requested', 'refunded']);

export const payments = pgTable('payments', {
	id: uuid('id').primaryKey().defaultRandom(),
	orderId: uuid('order_id').references(() => orders.id),
	status: paymentStatus(),
	paymentMethod: text('payment_method'),
	rawResponse: jsonb('raw_response'),
	refundStatus: refundStatusEnum().default('none'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});
