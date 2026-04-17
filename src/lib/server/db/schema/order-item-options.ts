import { integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { orderItems } from './order-items';
import { options } from './option';

export const orderItemOptions = pgTable('order_item_options', {
	id: uuid('id').primaryKey().defaultRandom(),
	orderItemId: uuid('order_item_id').references(() => orderItems.id),
	optionId: uuid('option_id').references(() => options.id),
	price: integer('price')
});
