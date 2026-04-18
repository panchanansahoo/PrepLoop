import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('auth-advanced');

// Session store with Redis-like interface (in-memory for now, can be replaced with Redis)
class SessionStore {
  constructor(ttl = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    this.sessions = new Map();
    this.ttl = ttl;
    this.maxSessions = 10000;
  }

  set(sessionId, data) {
    // Evict oldest if at capacity
    if (this.sessions.size >= this.maxSessions) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) this.sessions.delete(oldestKey);
    }

    this.sessions.set(sessionId, {
      data,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + this.ttl,
    });
  }

  get(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed
    session.lastAccessed = Date.now();
    return session.data;
  }

  delete(sessionId) {
    return this.sessions.delete(sessionId);
  }

  deleteByUserId(userId) {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.data.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  getUserSessions(userId) {
    const sessions = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.data.userId === userId) {
        sessions.push({
          sessionId,
          ...session.data,
          createdAt: session.createdAt,
          lastAccessed: session.lastAccessed,
        });
      }
    }
    return sessions;
  }

  getOldestKey() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, session] of this.sessions.entries()) {
      if (session.lastAccessed < oldestTime) {
        oldestTime = session.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Session cleanup completed', { cleaned, remaining: this.sessions.size });
    }
  }

  getStats() {
    return {
      totalSessions: this.sessions.size,
      maxSessions: this.maxSessions,
      ttl: this.ttl,
    };
  }
}

const sessionStore = new SessionStore();

// Cleanup expired sessions every 10 minutes
setInterval(() => sessionStore.cleanup(), 10 * 60 * 1000);

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user',
    type: 'access',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'preploop',
    audience: 'preploop-api',
  });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(user, deviceInfo = {}) {
  const sessionId = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const payload = {
    userId: user.id,
    sessionId,
    type: 'refresh',
  };

  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'preploop',
    audience: 'preploop-api',
  });

  // Store session info
  sessionStore.set(sessionId, {
    userId: user.id,
    email: user.email,
    role: user.role || 'user',
    deviceInfo: {
      userAgent: deviceInfo.userAgent || 'unknown',
      ip: deviceInfo.ip || 'unknown',
      platform: deviceInfo.platform || 'unknown',
    },
  });

  return { token, sessionId };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'preploop',
      audience: 'preploop-api',
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    logger.error('Access token verification failed', { error: error.message });
    throw error;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        issuer: 'preploop',
        audience: 'preploop-api',
      }
    );

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if session exists
    const session = sessionStore.get(decoded.sessionId);
    if (!session) {
      throw new Error('Session expired or invalid');
    }

    return { decoded, session };
  } catch (error) {
    logger.error('Refresh token verification failed', { error: error.message });
    throw error;
  }
}

/**
 * Enhanced authentication middleware with JWT
 */
export const authenticateTokenAdvanced = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    // Try JWT first (faster)
    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      req.authMethod = 'jwt';
      return next();
    } catch (jwtError) {
      // JWT failed, try Supabase token (fallback)
      logger.debug('JWT verification failed, trying Supabase', { error: jwtError.message });
    }

    // Fallback to Supabase auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    // Get user role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    req.user = { 
      id: user.id, 
      email: user.email, 
      role: profile?.role || 'user',
      user_metadata: user.user_metadata || {}
    };
    req.authMethod = 'supabase';
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error.message });
    return res.status(403).json({ 
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Refresh token endpoint handler
 */
export async function handleRefreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ 
      error: 'Refresh token required',
      code: 'REFRESH_TOKEN_MISSING'
    });
  }

  try {
    const { decoded, session } = verifyRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = generateAccessToken({
      id: session.userId,
      email: session.email,
      role: session.role,
    });

    logger.info('Token refreshed', { userId: session.userId });

    res.json({
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      tokenType: 'Bearer',
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(401).json({ 
      error: 'Invalid or expired refresh token',
      code: 'REFRESH_TOKEN_INVALID'
    });
  }
}

/**
 * Logout handler (invalidate session)
 */
export async function handleLogout(req, res) {
  const { refreshToken, allDevices } = req.body;

  try {
    if (allDevices && req.user) {
      // Logout from all devices
      const count = sessionStore.deleteByUserId(req.user.id);
      logger.info('User logged out from all devices', { userId: req.user.id, count });
      return res.json({ 
        message: 'Logged out from all devices',
        sessionsInvalidated: count
      });
    }

    if (refreshToken) {
      // Logout from specific device
      const { decoded } = verifyRefreshToken(refreshToken);
      sessionStore.delete(decoded.sessionId);
      logger.info('User logged out', { userId: decoded.userId, sessionId: decoded.sessionId });
      return res.json({ message: 'Logged out successfully' });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    res.status(500).json({ error: 'Logout failed' });
  }
}

/**
 * Get user sessions
 */
export async function getUserSessions(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const sessions = sessionStore.getUserSessions(req.user.id);
    
    // Sort by last accessed (most recent first)
    sessions.sort((a, b) => b.lastAccessed - a.lastAccessed);

    res.json({
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        deviceInfo: s.deviceInfo,
        createdAt: new Date(s.createdAt).toISOString(),
        lastAccessed: new Date(s.lastAccessed).toISOString(),
        isCurrent: req.sessionId === s.sessionId,
      })),
      total: sessions.length,
    });
  } catch (error) {
    logger.error('Failed to get user sessions', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
}

/**
 * Revoke specific session
 */
export async function revokeSession(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { sessionId } = req.params;

  try {
    const session = sessionStore.get(sessionId);
    
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ error: 'Session not found' });
    }

    sessionStore.delete(sessionId);
    logger.info('Session revoked', { userId: req.user.id, sessionId });

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    logger.error('Failed to revoke session', { error: error.message });
    res.status(500).json({ error: 'Failed to revoke session' });
  }
}

/**
 * Get session statistics (admin only)
 */
export function getSessionStats(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const stats = sessionStore.getStats();
  res.json(stats);
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticateTokenAdvanced,
  handleRefreshToken,
  handleLogout,
  getUserSessions,
  revokeSession,
  getSessionStats,
  sessionStore,
};
