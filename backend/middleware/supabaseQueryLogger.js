/**
 * Supabase Query Logger Middleware
 * Intercepts Supabase database operations and logs query timing
 */

import queryAnalyzer from '../utils/queryAnalyzer.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('SupabaseQueryLogger');

/**
 * Extract table name from Supabase operation
 */
function extractTableName(operation) {
  if (!operation) return 'unknown';
  
  // Extract from "from('table_name')" pattern
  const match = operation.match(/from\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : 'unknown';
}

/**
 * Extract filters/columns from operation
 */
function extractFilters(operation) {
  const filters = [];
  
  if (!operation) return filters;
  
  // Look for eq/gte/lte/ilike patterns
  const eqMatches = operation.match(/\.eq\(['"]([^'"]+)['"]/g);
  if (eqMatches) {
    eqMatches.forEach(match => {
      const col = match.match(/\.eq\(['"]([^'"]+)['"]/)[1];
      if (col) filters.push(col);
    });
  }
  
  // Look for order patterns
  const orderMatches = operation.match(/\.order\(['"]([^'"]+)['"]/g);
  if (orderMatches) {
    orderMatches.forEach(match => {
      const col = match.match(/\.order\(['"]([^'"]+)['"]/)[1];
      if (col) filters.push(col + ' (ordering)');
    });
  }
  
  return filters;
}

/**
 * Log a Supabase query execution
 */
export function logSupabaseQuery(operationString, durationMs) {
  try {
    const table = extractTableName(operationString);
    const filters = extractFilters(operationString);
    
    // Determine operation type
    let operation = 'select';
    if (operationString.includes('.insert(')) operation = 'insert';
    if (operationString.includes('.update(')) operation = 'update';
    if (operationString.includes('.delete()')) operation = 'delete';
    
    queryAnalyzer.recordQuery({
      table,
      operation,
      filters,
      durationMs,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to log query', { error: error.message });
  }
}

/**
 * Middleware for timing Supabase operations
 * Usage: Apply to individual routes that use Supabase
 */
export function supabaseQueryTimer(label = '') {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const startTime = Date.now();
    
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Log if slow
      if (duration > 1000) {
        logger.warn(`SLOW SUPABASE OPERATION: ${label}`, {
          durationMs: duration,
          threshold: 1000,
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

export default {
  logSupabaseQuery,
  supabaseQueryTimer,
};
