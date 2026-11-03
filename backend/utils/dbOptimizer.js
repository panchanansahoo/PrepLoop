import pool from '../config/db.js';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('db-optimizer');

const ALLOWED_ANALYZE_TABLES = new Set([
  'profiles',
  'users',
  'interview_slots',
  'interview_bookings',
  'job_listings',
  'resume_analyses',
  'normalized_profiles',
  'portfolio_sites',
  'study_groups',
  'study_group_members',
  'bookmarks',
  'submissions',
  'mock_interviews',
  'library_books',
  'library_book_reviews',
  'library_user_shelves',
]);

export const dbOptimizer = {
  async analyzeTable(tableName) {
    const normalized = String(tableName || '').trim().toLowerCase();
    if (!ALLOWED_ANALYZE_TABLES.has(normalized)) {
      logger.warn(`Rejected table analyze for non-whitelisted table: ${tableName}`);
      return false;
    }
    try {
      await pool.query(`ANALYZE ${normalized}`);
      logger.info(`Table analyzed: ${normalized}`);
      return true;
    } catch (err) {
      logger.warn(`Analyze table failed for ${normalized}:`, err.message);
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

