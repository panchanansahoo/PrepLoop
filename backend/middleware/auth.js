import { supabaseAdmin } from '../db/supabaseClient.js';

const ROLE_CACHE_TTL_MS = Number.parseInt(process.env.AUTH_ROLE_CACHE_TTL_MS || '300000', 10);
const ROLE_CACHE_MAX_ENTRIES = Number.parseInt(process.env.AUTH_ROLE_CACHE_MAX_ENTRIES || '10000', 10);
const roleCache = new Map();

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

const resolveUserRole = async (userId) => {
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
  } catch (e) {
    // Default to user if profile fetch fails
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

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      // Check if the error is specifically a token expiration issue
      const errorMsg = error?.message || '';
      if (isTokenExpired(errorMsg)) {
        console.warn(`[auth] JWT token expired, instructing client to refresh`);
        return res.status(401).json({ 
          error: 'Token expired', 
          code: 'TOKEN_EXPIRED',
          details: 'Please refresh your token'
        });
      }

      console.warn(`[auth] JWT validation failed for token (403):`, error || 'User not found in token');
      return res.status(403).json({ error: 'Invalid or expired token', details: error?.message || 'User not found' });
    }

    const role = await resolveUserRole(user.id);

    req.user = { 
      id: user.id, 
      email: user.email, 
      role,
      user_metadata: user.user_metadata || {}
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
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

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        const role = await resolveUserRole(user.id);
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
