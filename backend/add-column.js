require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT;', (err, res) => {
  if (err) console.error(err);
  else console.log('Column added successfully');
  pool.end();
});
