const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { sql } = require('drizzle-orm');
const { db } = require('../db');

async function main() {
  console.log('Verifying index existence in pg_indexes...');
  try {
    const result = await db.execute(sql`SELECT * FROM pg_indexes WHERE indexname = 'users_email_lower_unique';`);
    console.log('QueryResult:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error verifying index:', error);
  } finally {
    process.exit(0);
  }
}

main();
