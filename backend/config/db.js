import pg from 'pg';

const { Pool } = pg;

let pool = null;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getPool = () => {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: toPositiveInt(process.env.PG_POOL_MAX, 20),
    min: toPositiveInt(process.env.PG_POOL_MIN, 2),
    idleTimeoutMillis: toPositiveInt(process.env.PG_POOL_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: toPositiveInt(process.env.PG_POOL_CONNECTION_TIMEOUT_MS, 10000),
    maxUses: toPositiveInt(process.env.PG_POOL_MAX_USES, 7500),
    allowExitOnIdle: true,
  });

  pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error.message);
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
