import { pgTable, pgEnum, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { addresses } from './address';

export const orderStatusEnum = pgEnum('order_status', [
	'draft',
	'pending_payment',
	'paid',
	'file_review',
	'revision_requested',
	'printing',
	'ready',
	'shipped',
	'completed',
	'canceled'
]);

export const orders = pgTable('orders', {
	id: uuid('id').primaryKey().defaultRandom(),
	profileId: uuid('profile_id').references(() => profiles.id),
	addressId: uuid('address_id').references(() => addresses.id),
	status: orderStatusEnum(),
	deliveryMethod: text('delivery_method'),
	shippingCost: integer('shipping_cost'),
	totalPrice: integer('total_price'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});
