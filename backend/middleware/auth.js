import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('auth');

// JWT utilities
const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Store refresh token in database for rotation
  const { error } = await supabase
    .from('refresh_tokens')
    .insert([{ user_id: userId, token: refreshToken, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }]);

  if (error) {
    throw error;
  }

  return { accessToken, refreshToken };
};

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Access token expired' });
      }
      logger.error('JWT Verification Error:', err);
      return res.status(403).json({ error: 'Invalid access token' });
    }

    // Verify user still exists in the database
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, role, email, username, full_name, avatar_url, coins, is_premium')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(403).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  });
};

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    // Check if refresh token exists in DB
    const { data: tokenRecord, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .single();

    if (error || !tokenRecord) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Verify refresh token hasn't expired
    if (new Date() > new Date(tokenRecord.expires_at)) {
      // Clean up expired token
      await supabase.from('refresh_tokens').delete().eq('token', refreshToken);
      return res.status(403).json({ error: 'Refresh token expired' });
    }

    // Verify the token signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(decoded.userId);
    
    // Revoke old refresh token
    await supabase.from('refresh_tokens').delete().eq('token', refreshToken);

    res.json({ 
      accessToken, 
      refreshToken: newRefreshToken,
      user: req.user // Include user info to reduce API calls
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
};

// Additional auth functions needed by other routes
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    // Verify user still exists in the database
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, role, email, username, full_name, avatar_url, coins, is_premium')
      .eq('id', decoded.userId)
      .single();

    req.user = error || !user ? null : user;
    next();
  });
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireHR = (req, res, next) => {
  if (!req.user || !['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ error: 'HR or Admin access required' });
  }
  next();
};

// Require authentication for mutating requests (non-GET/HEAD/OPTIONS)
export const requireAuthForMutations = async (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  // If optionalAuth has run, req.user may be set; otherwise block
  if (req.user) return next();

  return res.status(401).json({ error: 'Authentication required' });
};