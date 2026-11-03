import pool from '../config/db.js';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('db-optimizer');

export const dbOptimizer = {
  async analyzeTable(tableName) {
    try {
      await pool.query(`ANALYZE ${tableName}`);
      logger.info(`Table analyzed: ${tableName}`);
      return true;
    } catch (err) {
      logger.warn(`Analyze table failed for ${tableName}:`, err.message);
      return false;
    }
  },

  async getSlowQueries(thresholdMs = 500) {
    try {
      const result = await pool.query(
        `SELECT query, calls, total_exec_time, mean_exec_time
         FROM pg_stat_statements
         WHERE mean_exec_time > $1
         ORDER BY total_exec_time DESC
         LIMIT 10`,
        [thresholdMs]
      );
      return result.rows;
    } catch (_err) {
      return [];
    }
  },
};

export default dbOptimizer;

