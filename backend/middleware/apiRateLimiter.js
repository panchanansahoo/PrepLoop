import rateLimit from 'express-rate-limit';

/**
 * Key generator that prefers authenticated user ID over IP.
 * Falls back to IP for unauthenticated requests.
 * NOTE: authenticateToken must run before these limiters for user-keying to work.
 * For routes where auth runs first (e.g. via router-level middleware), this
 * provides per-user budgets. For unauthenticated hits it degrades to IP.
 */
const userOrIpKey = (req) => req.user?.id ?? req.ip;

export const aiEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: userOrIpKey,
  message: { error: 'Too many AI requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKey,
  message: { error: 'Too many payment requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const jobsEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userOrIpKey,
  message: { error: 'Too many job requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminEndpointsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  keyGenerator: userOrIpKey,
  message: { error: 'Too many admin requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
