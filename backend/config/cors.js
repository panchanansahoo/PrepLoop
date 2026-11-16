/**
 * Secure CORS configuration middleware
 */

const ALLOWED_ORIGINS = [
  'https://www.preploop.me',
  'https://preploop.me',
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_FRONTEND_URL,
  process.env.STAGING_FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

// Only allow localhost in development
const DEVELOPMENT_ORIGINS = process.env.NODE_ENV === 'development' 
  ? [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:4173',
    ]
  : [];

const ALL_ALLOWED_ORIGINS = [...ALLOWED_ORIGINS, ...DEVELOPMENT_ORIGINS];

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Validate origin against allowed list
 */
function isOriginAllowed(origin) {
  // Allow server-side requests (no origin header)
  if (!origin || typeof origin !== 'string') return true;

  // Reject malformed origins
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  } catch {
    return false;
  }

  // Check explicit allowed origins
  if (ALL_ALLOWED_ORIGINS.includes(origin)) return true;

  // In development, allow localhost (IPv4, IPv6) and local network IP addresses on standard web/dev ports
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    const devPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/i;
    if (devPattern.test(origin)) {
      return true;
    }
  }

  // In production, check if origin matches production domain pattern
  if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_DOMAIN) {
    try {
      const cleanDomain = process.env.PRODUCTION_DOMAIN.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const escapedDomain = escapeRegex(cleanDomain);
      const productionPattern = new RegExp(
        `^https://([a-zA-Z0-9-]+\\.)*${escapedDomain}$`,
        'i'
      );
      if (productionPattern.test(origin)) return true;
    } catch {
      return false;
    }
  }

  // Allow official preploop.me subdomains (HTTPS enforced in production)
  const preploopPattern = process.env.NODE_ENV === 'production'
    ? /^https:\/\/([a-zA-Z0-9-]+\.)*preploop\.me(:\d+)?$/i
    : /^https?:\/\/([a-zA-Z0-9-]+\.)*preploop\.me(:\d+)?$/i;
  if (preploopPattern.test(origin)) {
    return true;
  }

  // In non-production/staging, allow explicit PrepLoop team Vercel preview deployments (e.g. preploop-*.vercel.app)
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_VERCEL_PREVIEWS === 'true') {
    if (/^https:\/\/preploop(-[a-zA-Z0-9-]+)?\.vercel\.app$/i.test(origin)) {
      return true;
    }
  }

  return false;
}

/**
 * CORS configuration object
 */
export const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

export { isOriginAllowed, ALL_ALLOWED_ORIGINS };
