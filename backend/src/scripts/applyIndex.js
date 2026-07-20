const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { sql } = require('drizzle-orm');
const { db } = require('../db');

async function main() {
  console.log('Applying case-insensitive unique index to users.email...');
  try {
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_lower_unique" ON "users" (lower("email"));`);
    console.log('✅ Unique index applied successfully!');
  } catch (error) {
    console.error('❌ Failed to apply index:', error);
  } finally {
    process.exit(0);
  }
}

main();
