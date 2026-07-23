const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// Disable prefetch as it is not supported for "Transaction" pool mode in Supabase
const client = postgres(connectionString, { 
  prepare: false, 
  max: 20, 
  idle_timeout: 30 
});
const db = drizzle(client);

module.exports = { db };
