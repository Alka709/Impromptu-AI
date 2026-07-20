'use strict';

const { pgTable, uuid, text, timestamp, uniqueIndex, boolean } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');

const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  photo: text('photo'),
  // nullable so Google-OAuth users don't need a password
  password_hash: text('password_hash'),
  // google_id for OAuth-linked accounts
  google_id: text('google_id').unique(),
  verified: boolean('verified').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  users_email_lower_unique: uniqueIndex('users_email_lower_unique').on(sql`lower(${table.email})`),
}));

module.exports = { users };
