import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { categories } from './category';

export const products = pgTable('products', {
	id: uuid('id').defaultRandom().primaryKey(),
	categoryId: uuid('category_id').references(() => categories.id),
	name: text('name'),
	slug: text('slug').unique(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
});
