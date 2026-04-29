import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';
import { orderItems } from './order-items';
import { orders } from './order';
import { profiles } from './profiles';

export const checkoutIntentSourceEnum = pgEnum('checkout_intent_source', ['cart', 'pdp']);

export const checkoutIntentStatusEnum = pgEnum('checkout_intent_status', [
	'active',
	'expired',
	'converted',
	'cancelled'
]);

export const checkoutIntents = pgTable(
	'checkout_intents',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		profileId: uuid('profile_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		orderId: uuid('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),

		source: checkoutIntentSourceEnum().notNull(),
		status: checkoutIntentStatusEnum().notNull().default('active'),

		sourceRef: text('source_ref'),

		deliveryMethod: text('delivery_method'),
		shippingCost: integer('shipping_cost').notNull().default(0),

		subtotalSnapshot: integer('subtotal_snapshot'),
		totalSnapshot: integer('total_snapshot'),

		expiresAt: timestamp('expires_at', { withTimezone: true }),
		convertedAt: timestamp('converted_at', { withTimezone: true }),
		cancelledAt: timestamp('cancelled_at', { withTimezone: true }),

		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('checkout_intents_profile_status_idx').on(table.profileId, table.status),
		index('checkout_intents_order_idx').on(table.orderId),
		uniqueIndex('checkout_intents_active_profile_order_idx').on(
			table.profileId,
			table.orderId,
			table.status
		)
	]
);

export const checkoutIntentItems = pgTable(
	'checkout_intent_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		intentId: uuid('intent_id')
			.notNull()
			.references(() => checkoutIntents.id, { onDelete: 'cascade' }),
		orderItemId: uuid('order_item_id')
			.notNull()
			.references(() => orderItems.id, { onDelete: 'cascade' }),

		unitPriceSnapshot: integer('unit_price_snapshot'),
		quantitySnapshot: integer('quantity_snapshot'),
		optionTotalSnapshot: integer('option_total_snapshot'),

		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		uniqueIndex('checkout_intent_items_intent_order_item_uidx').on(
			table.intentId,
			table.orderItemId
		),
		index('checkout_intent_items_intent_idx').on(table.intentId),
		index('checkout_intent_items_order_item_idx').on(table.orderItemId)
	]
);
