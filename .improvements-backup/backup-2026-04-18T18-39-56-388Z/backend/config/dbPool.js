import pg from 'pg';
import { createLogger } from '../utils/structuredLogger.js';

const { Pool } = pg;
const logger = createLogger('db-pool');

const poolConfig = {
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_URL,
  max: Number.parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: Number.parseInt(process.env.DB_POOL_MIN || '2', 10),
  idleTimeoutMillis: Number.parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  maxUses: Number.parseInt(process.env.DB_MAX_USES || '7500', 10),
  allowExitOnIdle: process.env.DB_ALLOW_EXIT_ON_IDLE === 'true',
  
  // SSL configuration
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

export const pool = new Pool(poolConfig);

pool.on('connect', (client) => {
  logger.debug('New client connected to pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('acquire', (client) => {
  logger.debug('Client acquired from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('remove', (client) => {
  logger.debug('Client removed from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('error', (err, client) => {
  logger.error('Unexpected pool error', {
    error: err.message,
    stack: err.stack
  });
});

export const query = async (text, params) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Query executed', {
      duration: `${duration}ms`,
      rows: result.rowCount,
      command: result.command
    });
    
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    
    logger.error('Query failed', {
      duration: `${duration}ms`,
      error: err.message,
      query: text.substring(0, 100)
    });
    
    throw err;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);
  
  let released = false;
  
  client.release = () => {
    if (released) {
      logger.warn('Client already released');
      return;
    }
    released = true;
    originalRelease();
  };
  
  const timeout = setTimeout(() => {
    if (!released) {
      logger.error('Client held for too long', {
        stack: new Error().stack
      });
    }
  }, 30000);
  
  client.release = () => {
    clearTimeout(timeout);
    if (released) return;
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
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    max: poolConfig.max,
    min: poolConfig.min
  };
};

export const closePool = async () => {
  logger.info('Closing database pool');
  await pool.end();
};

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

logger.info('Database pool initialized', {
  max: poolConfig.max,
  min: poolConfig.min,
  idleTimeout: poolConfig.idleTimeoutMillis
});
