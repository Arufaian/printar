import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { orders } from './order';
import { variants } from './variant';

export const orderItems = pgTable('order_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	orderId: uuid('order_id').references(() => orders.id),
	variantId: uuid('variant_id').references(() => variants.id),
	quantity: integer('quantity'),
	price: integer('price'),
	filePath: text('file_path')
});
