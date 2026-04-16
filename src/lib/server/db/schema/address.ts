import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

import { profiles } from './profiles';

export const addresses = pgTable('addresses', {
	id: uuid('id').defaultRandom().primaryKey(),
	profileId: uuid('profile_id').references(() => profiles.id),
	addressLine: text('address_line'),
	city: text('city'),
	postalCode: text('postal_code'),
	phone: text('phone'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});
