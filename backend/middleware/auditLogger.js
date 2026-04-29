/**
 * Audit Logger Middleware
 *
 * Logs security-relevant actions to the audit_logs table for compliance
 * and forensic analysis. Non-blocking — writes are fire-and-forget.
 *
 * Usage:
 *   import { auditLog, auditMiddleware } from './middleware/auditLogger.js';
 *
 *   // As middleware on a route
 *   router.post('/settings', authenticateToken, auditMiddleware('user_settings_update'), handler);
 *
 *   // Direct logging in a handler
 *   await auditLog(req, 'password_change', 'user', userId);
 */

import { createLogger } from '../utils/structuredLogger.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const logger = createLogger('audit-logger');

// Actions that should be audited
const AUDIT_ACTIONS = new Set([
  // Auth
  'login', 'logout', 'signup', 'password_change', 'password_reset',
  'mfa_enroll', 'mfa_verify', 'mfa_unenroll',
  'token_refresh', 'failed_login',

  // Data access
  'data_export', 'data_delete', 'consent_update',

  // Admin
  'admin_access', 'role_change', 'user_ban', 'user_unban',
  'content_moderate', 'system_config_change',

  // Financial
  'payment_initiate', 'payment_complete', 'subscription_change',
  'coin_purchase', 'coin_transfer',

  // Profile
  'profile_update', 'resume_upload', 'email_change',
  'user_settings_update',

  // Interview
  'interview_start', 'interview_complete',
]);

/**
 * Write an audit log entry to the database (non-blocking).
 *
 * @param {import('express').Request} req - Express request object
 * @param {string} action - Action identifier (e.g., 'login', 'password_change')
 * @param {string} resource - Resource type (e.g., 'user', 'payment', 'interview')
 * @param {string} [resourceId] - Specific resource ID
 * @param {Object} [details] - Additional context (will be stored as JSONB)
 */
export async function auditLog(req, action, resource, resourceId = null, details = null) {
  try {
    const entry = {
      user_id: req.user?.id || null,
      action,
      resource,
      resource_id: resourceId,
      details: details ? JSON.stringify(details) : null,
      ip_address: req.ip || req.connection?.remoteAddress || null,
      user_agent: req.headers?.['user-agent']?.slice(0, 500) || null,
      request_id: req.requestId || req.headers?.['x-request-id'] || null,
    };

    // Fire-and-forget write to database
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert(entry);

    if (error) {
      // Log to structured logger as fallback — never lose audit data
      logger.error('Failed to write audit log to database', {
        ...entry,
        dbError: error.message,
      });
    } else {
      logger.debug('Audit log written', { action, resource, resourceId });
    }
  } catch (error) {
    // Audit logging should NEVER crash the request
    logger.error('Audit logging exception', {
      action,
      resource,
      error: error.message,
    });
  }
}

/**
 * Express middleware factory for automatic audit logging.
 * Logs after the response is sent (non-blocking).
 *
 * @param {string} action - Action to log
 * @param {string} [resource] - Resource type (auto-detected from URL if not provided)
 * @returns {Function} Express middleware
 */
export function auditMiddleware(action, resource = null) {
  return (req, res, next) => {
    // Log after response completes
    res.on('finish', () => {
      // Only log successful mutations (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const detectedResource = resource || req.baseUrl?.split('/').pop() || 'unknown';
        const resourceId = req.params?.id || req.body?.id || null;

        // Fire-and-forget
        auditLog(req, action, detectedResource, resourceId, {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
        }).catch(() => {}); // Swallow errors — audit logging is best-effort
      }
    });

    next();
  };
}

/**
 * Query audit logs (admin-only utility).
 *
 * @param {Object} filters
 * @param {string} [filters.userId]
 * @param {string} [filters.action]
 * @param {string} [filters.resource]
 * @param {string} [filters.startDate] - ISO date string
 * @param {string} [filters.endDate] - ISO date string
 * @param {number} [filters.limit=50]
 * @param {number} [filters.offset=0]
 * @returns {Promise<{data: Array, count: number}>}
 */
export async function queryAuditLogs(filters = {}) {
  try {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.resource) query = query.eq('resource', filters.resource);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    query = query.range(
      filters.offset || 0,
      (filters.offset || 0) + (filters.limit || 50) - 1
    );

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (error) {
    logger.error('Failed to query audit logs', { error: error.message, filters });
    throw error;
  }
}

export default { auditLog, auditMiddleware, queryAuditLogs };
