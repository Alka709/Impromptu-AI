require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('Adding status column to sessions table...');
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' NOT NULL;`);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

run();
