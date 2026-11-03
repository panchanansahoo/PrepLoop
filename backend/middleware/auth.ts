import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import type { AuthUser, UserRole } from '../types/auth.js';

interface RoleCacheEntry {
  role: UserRole;
  expiresAt: number;
  lastAccessed: number;
}

const ROLE_CACHE_TTL_MS = Number.parseInt(process.env.AUTH_ROLE_CACHE_TTL_MS || '300000', 10);
const ROLE_CACHE_MAX_ENTRIES = Number.parseInt(process.env.AUTH_ROLE_CACHE_MAX_ENTRIES || '10000', 10);
const roleCache = new Map<string, RoleCacheEntry>();

const parseCookies = (header = ''): Record<string, string> => {
  const cookies: Record<string, string> = {};
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

export const getAccessToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  if (bearerToken) return bearerToken;
  return parseCookies(req.headers.cookie || '').preploop_access || null;
};

const getRoleFromCache = (userId: string): UserRole | null => {
  const cached = roleCache.get(userId);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    roleCache.delete(userId);
    return null;
  }

  // LRU eviction update
  cached.lastAccessed = Date.now();
  return cached.role;
};

const setRoleCache = (userId: string, role: UserRole): void => {
  if (roleCache.size >= ROLE_CACHE_MAX_ENTRIES) {
    let lruKey: string | null = null;
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

export const DEFAULT_ADMIN_EMAILS: string[] = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  : [];

export const getAdminEmails = (): Set<string> => {
  return new Set(DEFAULT_ADMIN_EMAILS);
};

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email || typeof email !== 'string') return false;
  return getAdminEmails().has(email.trim().toLowerCase());
};

const resolveUserRole = async (userId: string, userEmail: string | null = null): Promise<UserRole> => {
  if (userEmail && isAdminEmail(userEmail)) {
    setRoleCache(userId, 'admin');
    return 'admin';
  }

  const cachedRole = getRoleFromCache(userId);
  if (cachedRole) {
    return cachedRole;
  }

  let role: UserRole = 'user';
  try {
    const { data: profile } = await (supabaseAdmin as any)
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.role) {
      role = profile.role as UserRole;
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

const isTokenExpired = (errorMessage?: string): boolean => {
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

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const token = getAccessToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await (supabaseAdmin as any).auth.getUser(token);

    if (error || !user) {
      const errorMsg = error?.message || '';
      if (isTokenExpired(errorMsg)) {
        console.warn(`[auth] JWT token expired, instructing client to refresh`);
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          details: 'Please refresh your token',
        });
      }

      console.warn(`[auth] JWT validation failed for token (403):`, error || 'User not found in token');
      return res.status(403).json({ error: 'Invalid or expired token', details: error?.message || 'User not found' });
    }

    const role = await resolveUserRole(user.id, user.email);

    req.user = {
      id: user.id,
      email: user.email,
      role,
      user_metadata: user.user_metadata || {},
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (!req.user || req.user.role !== 'admin') {
    console.warn(`[auth] 403 Forbidden: Admin access required for user ${req.user?.id} (role: ${req.user?.role}) on ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireHR = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (!req.user || (req.user.role !== 'hr' && req.user.role !== 'admin')) {
    console.warn(`[auth] 403 Forbidden: HR access required for user ${req.user?.id} (role: ${req.user?.role}) on ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: 'HR or Admin access required' });
  }
  next();
};

export const requireEmployerOrAdmin = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (!req.user || (req.user.role !== 'employer' && req.user.role !== 'hr' && req.user.role !== 'admin')) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[auth] 403 Forbidden: Employer or Admin access required for user ${req.user?.id} (role: ${req.user?.role}) on ${req.method} ${req.originalUrl}`);
    }
    return res.status(403).json({ error: 'Employer or Admin access required' });
  }
  next();
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = getAccessToken(req);

  if (token) {
    try {
      const { data: { user }, error } = await (supabaseAdmin as any).auth.getUser(token);
      if (!error && user) {
        const role = await resolveUserRole(user.id, user.email);
        req.user = {
          id: user.id,
          email: user.email,
          role,
          user_metadata: user.user_metadata || {},
        };
      }
    } catch (error: any) {
      console.warn(`[auth] Optional auth JWT validation failed, continuing anonymously:`, error?.message);
    }
  }
  next();
};

// Backwards-compatible aliases
export const _authenticateToken = authenticateToken;
export const _optionalAuth = optionalAuth;
export const _requireAdmin = requireAdmin;
export const _requireHR = requireHR;
export const _requireEmployerOrAdmin = requireEmployerOrAdmin;

