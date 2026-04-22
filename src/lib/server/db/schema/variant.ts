import { integer, pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';

import { products } from './product';

export const variants = pgTable('variants', {
	id: uuid('id').defaultRandom().primaryKey(),
	productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
	name: text('name'),
	imgUrl: text('img_url'),
	price: integer('price'),
	stock: integer('stock'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});
