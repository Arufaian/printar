import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name'),
	slug: text('slug').unique()
});
