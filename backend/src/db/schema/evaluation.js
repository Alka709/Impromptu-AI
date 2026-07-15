const { pgTable, uuid, text, timestamp, real, json } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { sessions } = require('./sessions');

const userPrevRecord = pgTable('user_prev_record', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  session_id: uuid('session_id').references(() => sessions.id).notNull(),
  summary: text('summary').notNull(),
  strengths: text('strengths').notNull(),
  weaknesses: text('weaknesses').notNull(),
  improvement_tips: text('improvement_tips').notNull(),
  overall_score: real('overall_score').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

const metricesCalculated = pgTable('metricescalculated', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  session_id: uuid('session_id').references(() => sessions.id).notNull(),
  metrics: json('metrics').notNull(), // Store all the speech metrics as JSON
  created_at: timestamp('created_at').defaultNow().notNull(),
});

module.exports = { userPrevRecord, metricesCalculated };
