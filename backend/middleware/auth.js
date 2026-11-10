import { supabaseAdmin } from '../db/supabaseClient.js';

const ROLE_CACHE_TTL_MS = Number.parseInt(process.env.AUTH_ROLE_CACHE_TTL_MS || '300000', 10);
const ROLE_CACHE_MAX_ENTRIES = Number.parseInt(process.env.AUTH_ROLE_CACHE_MAX_ENTRIES || '10000', 10);
const roleCache = new Map();

const parseCookies = (header = '') => {
  const cookies = {};
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try {
      cookies[decodeURIComponent(key)] = decodeURIComponent(value);
    } catch {
      // Ignore malformed cookie pairs and continue with header authentication.
    }
  }
  return cookies;
};

export const getAccessToken = (req) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  if (bearerToken) return bearerToken;
  return parseCookies(req.headers.cookie || '').preploop_access || null;
};

const getRoleFromCache = (userId) => {
  const cached = roleCache.get(userId);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    roleCache.delete(userId);
    return null;
  }

  // Fix #18: update lastAccessed for LRU eviction
  cached.lastAccessed = Date.now();
  return cached.role;
};

const setRoleCache = (userId, role) => {
  if (roleCache.size >= ROLE_CACHE_MAX_ENTRIES) {
    // Fix #18: evict least-recently-used entry instead of oldest-inserted
    let lruKey = null;
    let lruTime = Infinity;
    for (const [key, entry] of roleCache) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    if (lruKey) roleCache.delete(lruKey);
  }

  roleCache.set(userId, {
    role,
    expiresAt: Date.now() + ROLE_CACHE_TTL_MS,
    lastAccessed: Date.now(),
  });
};

export const DEFAULT_ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  : [];

export const getAdminEmails = () => {
  return new Set(DEFAULT_ADMIN_EMAILS);
};

export const isAdminEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return getAdminEmails().has(email.trim().toLowerCase());
};

const resolveUserRole = async (userId, userEmail = null) => {
  if (userEmail && isAdminEmail(userEmail)) {
    setRoleCache(userId, 'admin');
    return 'admin';
  }

  const cachedRole = getRoleFromCache(userId);
  if (cachedRole) {
    return cachedRole;
  }

  let role = 'user';
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.role) {
      role = profile.role;
    }
  } catch (_e) {
    // Default to user if profile fetch fails
  }

  if (role !== 'admin' && userEmail && isAdminEmail(userEmail)) {
    role = 'admin';
  }

  setRoleCache(userId, role);
  return role;
};

const isTokenExpired = (errorMessage) => {
  if (!errorMessage) return false;
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes('token is expired') ||
    lower.includes('exp') ||
    lower.includes('expired') ||
    lower.includes('token exp') ||
    lower.includes('exp claim')
  );
};

/**
 * Verifies a candidate JWT against Supabase Auth.
 * Note: Custom HR tokens are issued with JWT_SECRET and are not Supabase tokens;
 * HR endpoints use hrAuth middleware (see middleware/hrAuth.js).
 */
export const verifySupabaseToken = async (token) => {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    const errorMsg = error?.message || '';
    if (isTokenExpired(errorMsg)) {
      const err = new Error('Token expired');
      err.code = 'TOKEN_EXPIRED';
      err.statusCode = 401;
      throw err;
    }
    const err = new Error(error?.message || 'Invalid token');
    err.code = 'INVALID_TOKEN';
    err.statusCode = 401;
    throw err;
  }
  const role = await resolveUserRole(user.id, user.email);
  return {
    id: user.id,
    email: user.email,
    role,
    user_metadata: user.user_metadata || {},
  };
};

export const authenticateToken = async (req, res, next) => {
  const token = getAccessToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const principal = await verifySupabaseToken(token);
    req.user = principal;
    next();
  } catch (error) {
    if (error.code === 'TOKEN_EXPIRED') {
      console.warn(`[auth] JWT token expired, instructing client to refresh`);
      return res.status(401).json({ 
        error: 'Token expired', 
        code: 'TOKEN_EXPIRED',
        details: 'Please refresh your token'
      });
    }

    console.warn(`[auth] JWT validation failed:`, error.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Authentication failed. Please log in again.',
    });
  }
};

// Middleware to require admin role — must be used after authenticateToken
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    console.warn(`[auth] 403 Forbidden: Admin access required for user ${req.user?.id} (role: ${req.user?.role}) on ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireHR = (req, res, next) => {
  if (!req.user || (req.user.role !== 'hr' && req.user.role !== 'admin')) {
    console.warn(`[auth] 403 Forbidden: HR access required for user ${req.user?.id} (role: ${req.user?.role}) on ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: 'HR or Admin access required' });
  }
  next();
};

export const requireEmployerOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'employer' && req.user.role !== 'hr' && req.user.role !== 'admin')) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[auth] 403 Forbidden: Employer or Admin access required for user ${req.user?.id} (role: ${req.user?.role}) on ${req.method} ${req.originalUrl}`);
    }
    return res.status(403).json({ error: 'Employer or Admin access required' });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  const token = getAccessToken(req);

  if (token) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        const role = await resolveUserRole(user.id, user.email);
        req.user = { 
          id: user.id, 
          email: user.email, 
          role,
          user_metadata: user.user_metadata || {}
        };
      }
    } catch (error) {
      // Token invalid but continue anyway
      console.warn(`[auth] Optional auth JWT validation failed, continuing anonymously:`, error.message);
    }
  }
  next();
};

// Backwards-compatible underscore-prefixed aliases
export const _authenticateToken = authenticateToken;
export const _optionalAuth = optionalAuth;
export const _requireAdmin = requireAdmin;
export const _requireHR = requireHR;
