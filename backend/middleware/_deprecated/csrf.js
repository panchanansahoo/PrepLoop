import crypto from 'crypto';

const tokenStore = new Map();
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const MAX_TOKENS = 10000;

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokenStore) {
    if (now > data.expiresAt) {
      tokenStore.delete(token);
    }
  }
}

setInterval(cleanExpiredTokens, 10 * 60 * 1000).unref();

export const generateCsrfToken = (req, res, next) => {
  if (req.method === 'GET') {
    const token = crypto.randomBytes(32).toString('hex');
    const userId = req.user?.id || req.ip;
    
    if (tokenStore.size >= MAX_TOKENS) {
      const oldestKey = tokenStore.keys().next().value;
      if (oldestKey) tokenStore.delete(oldestKey);
    }
    
    tokenStore.set(token, {
      userId,
      expiresAt: Date.now() + TOKEN_EXPIRY_MS
    });
    
    res.locals.csrfToken = token;
    res.setHeader('X-CSRF-Token', token);
  }
  next();
};

export const verifyCsrfToken = (req, res, next) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  
  if (!token) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  const tokenData = tokenStore.get(token);
  
  if (!tokenData) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  if (Date.now() > tokenData.expiresAt) {
    tokenStore.delete(token);
    return res.status(403).json({ error: 'CSRF token expired' });
  }

  const userId = req.user?.id || req.ip;
  if (tokenData.userId !== userId) {
    return res.status(403).json({ error: 'CSRF token mismatch' });
  }

  // Token is valid, remove it (one-time use)
  tokenStore.delete(token);
  next();
};
