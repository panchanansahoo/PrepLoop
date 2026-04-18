import pg from 'pg';

const { Pool } = pg;

const poolConfig = {
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20,
  min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
  allowExitOnIdle: false,
};

export const createOptimizedPool = (connectionString) => {
  const pool = new Pool({
    connectionString,
    ...poolConfig,
  });

  pool.on('error', (err) => {
    console.error('Unexpected pool error:', err);
  });

  pool.on('connect', () => {
    console.log('New database connection established');
  });

  return pool;
};
