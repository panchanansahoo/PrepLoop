import pg from 'pg';
import { createLogger } from '../utils/structuredLogger.js';

const { Pool } = pg;
const logger = createLogger('db-pool');

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: toPositiveInt(process.env.DB_POOL_MAX || process.env.PG_POOL_MAX, 20),
  min: toPositiveInt(process.env.DB_POOL_MIN || process.env.PG_POOL_MIN, 2),
  idleTimeoutMillis: toPositiveInt(process.env.DB_IDLE_TIMEOUT || process.env.PG_POOL_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: toPositiveInt(process.env.DB_CONNECTION_TIMEOUT || process.env.PG_POOL_CONNECTION_TIMEOUT_MS, 10000),
  maxUses: toPositiveInt(process.env.DB_MAX_USES || process.env.PG_POOL_MAX_USES, 7500),
  allowExitOnIdle: process.env.DB_ALLOW_EXIT_ON_IDLE !== 'false',
  ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
};

let pool = null;

const getPool = () => {
  if (pool) return pool;
  
  if (!poolConfig.connectionString) {
    logger.warn('DATABASE_URL not configured - PostgreSQL features disabled');
    return null;
  }

  pool = new Pool(poolConfig);

  pool.on('connect', () => {
    logger.debug('Client connected', {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    });
  });

  pool.on('error', (err) => {
    logger.error('Pool error', { error: err.message, stack: err.stack });
  });

  logger.info('Database pool initialized', {
    max: poolConfig.max,
    min: poolConfig.min,
    idleTimeout: poolConfig.idleTimeoutMillis
  });

  return pool;
};

export const query = async (text, params = []) => {
  const instance = getPool();
  if (!instance) {
    throw new Error('DATABASE_URL is not configured');
  }

  const start = Date.now();
  try {
    const result = await instance.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        duration: `${duration}ms`,
        query: text.substring(0, 100)
      });
    }
    
    return result;
  } catch (err) {
    logger.error('Query failed', {
      duration: `${Date.now() - start}ms`,
      error: err.message,
      query: text.substring(0, 100)
    });
    throw err;
  }
};

export const getClient = async () => {
  const instance = getPool();
  if (!instance) {
    throw new Error('DATABASE_URL is not configured');
  }

  const client = await instance.connect();
  const originalRelease = client.release.bind(client);
  let released = false;

  const timeout = setTimeout(() => {
    if (!released) {
      logger.error('Client held for >30s', { stack: new Error().stack });
    }
  }, 30000);

  client.release = () => {
    clearTimeout(timeout);
    if (released) {
      logger.warn('Client already released');
      return;
    }
    released = true;
    originalRelease();
  };

  return client;
};

export const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getPoolStats = () => {
  const instance = getPool();
  if (!instance) return null;
  
  return {
    total: instance.totalCount,
    idle: instance.idleCount,
    waiting: instance.waitingCount,
    max: poolConfig.max,
    min: poolConfig.min
  };
};

export const closePool = async () => {
  if (!pool) return;
  logger.info('Closing database pool');
  await pool.end();
  pool = null;
};

process.on('SIGTERM', async () => {
  await closePool();
});

process.on('SIGINT', async () => {
  await closePool();
});

export default { query, getClient, transaction, getPoolStats, closePool };
