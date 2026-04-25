import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { products } from './product';

export const optionGroups = pgTable('option_groups', {
	id: uuid('id').defaultRandom().primaryKey(),
	productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
	name: text('name')
});
