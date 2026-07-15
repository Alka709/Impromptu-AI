const { pgTable, uuid, varchar, text, timestamp, json } = require('drizzle-orm/pg-core');
const { users } = require('./users');

const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  topic: text('topic').notNull(),
  hints: json('hints').default([]).notNull(),
  audio_url: text('audio_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

module.exports = { sessions };
