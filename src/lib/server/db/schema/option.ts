import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { optionGroups } from './option-group';

export const options = pgTable('options', {
	id: uuid('id').primaryKey().defaultRandom(),
	optionGroupId: uuid('option_group_id').references(() => optionGroups.id),
	name: text('name'),
	additionalPrice: integer('additional_price')
});
