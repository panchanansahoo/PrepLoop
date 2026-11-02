/**
 * Platform API Key Authentication Middleware
 * Validates incoming `Authorization: Bearer pl_live_...` or `x-api-key: pl_live_...` headers
 */
import crypto from 'crypto';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('api-key-auth');

export async function authenticateApiKey(req, res, next) {
  try {
    const rawHeader = req.headers['authorization'] || req.headers['x-api-key'];
    if (!rawHeader) {
      return res.status(401).json({ error: 'API key required', code: 'API_KEY_REQUIRED' });
    }

    let rawKey = rawHeader;
    if (rawKey.startsWith('Bearer ')) {
      rawKey = rawKey.slice(7).trim();
    }

    if (!rawKey.startsWith('pl_live_')) {
      return res.status(401).json({ error: 'Invalid API key format', code: 'INVALID_API_KEY' });
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const { data: keyRecord, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, user_id, name, scopes, is_active')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !keyRecord) {
      logger.warn('Failed API key authentication attempt', { prefix: rawKey.slice(0, 10) });
      return res.status(401).json({ error: 'Invalid or revoked API key', code: 'INVALID_API_KEY' });
    }

    // Attach identity to request
    req.apiKey = keyRecord;
    req.user = {
      id: keyRecord.user_id,
      isApiKey: true,
      scopes: keyRecord.scopes || [],
    };

    // Update last_used_at asynchronously without blocking
    supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)
      .then(() => {})
      .catch((err) => logger.debug('Failed to touch last_used_at for api_key', { error: err.message }));

    return next();
  } catch (err) {
    logger.error('Error in authenticateApiKey middleware', { error: err.message });
    return res.status(500).json({ error: 'Internal API authentication error' });
  }
}

/**
 * Enforce required scope on API key request
 * @param {string} requiredScope - e.g. 'interviews:read', 'candidates:export'
 */
export function requireApiKeyScope(requiredScope) {
  return (req, res, next) => {
    if (!req.user?.isApiKey) {
      return next(); // If request is from interactive session, defer to user session auth
    }

    const scopes = req.user.scopes || [];
    if (!scopes.includes(requiredScope) && !scopes.includes('*')) {
      return res.status(403).json({
        error: `Insufficient permissions. Scope '${requiredScope}' required.`,
        code: 'FORBIDDEN_SCOPE',
      });
    }

    return next();
  };
}

