/**
 * Secure CORS configuration middleware
 */

const ALLOWED_ORIGINS = [
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

/**
 * Validate origin against allowed list
 */
function isOriginAllowed(origin) {
  // Allow server-side requests (no origin header)
  if (!origin) return true;

  // Check explicit allowed origins
  if (ALL_ALLOWED_ORIGINS.includes(origin)) return true;

  // In development only, allow localhost with specific ports only
  if (process.env.NODE_ENV === 'development') {
    const allowedPorts = [5173, 5174, 5175, 4173];
    const match = origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):(\d+)$/i);
    if (match && allowedPorts.includes(parseInt(match[2], 10))) {
      return true;
    }
  }

  // In production, check if origin matches production domain pattern
  if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_DOMAIN) {
    const productionPattern = new RegExp(
      `^https://(.*\\.)?${process.env.PRODUCTION_DOMAIN.replace('.', '\\.')}$`
    );
    if (productionPattern.test(origin)) return true;
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
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

export { isOriginAllowed, ALL_ALLOWED_ORIGINS };
