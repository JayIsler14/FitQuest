const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // 🔹 just reference the env variable
  ssl: { rejectUnauthorized: false }          // required for Neon
});

module.exports = pool;
