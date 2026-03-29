import pg from 'pg';

const { Pool } = pg;

let pool = null;

const getPool = () => {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
};

const query = async (text, params = []) => {
  const instance = getPool();
  if (!instance) {
    throw new Error('DATABASE_URL is not configured for PostgreSQL-backed HR routes.');
  }
  return instance.query(text, params);
};

export default { query };
