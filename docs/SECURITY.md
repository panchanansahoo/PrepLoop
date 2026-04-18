# Security Guide

## Critical Security Fixes Implemented

### 1. Environment Variable Security
- ✅ JWT_SECRET and JWT_REFRESH_SECRET added to .env.example with minimum 32 character requirement
- ✅ Environment validation at startup to prevent missing critical variables
- ✅ Pattern validation for sensitive variables (JWT secrets, Supabase URLs)

### 2. Input Sanitization
- ✅ Global sanitization middleware applied to all routes
- ✅ DOMPurify integration to prevent XSS attacks
- ✅ Webhook paths excluded from sanitization
- ✅ HTML sanitization for rich text content (blogs, notes)

### 3. CORS Security
- ✅ Fixed wildcard localhost vulnerability - now only allows specific ports (5173, 5174, 4173)
- ✅ Production domain pattern matching
- ✅ Explicit origin validation with logging

### 4. Rate Limiting
- ✅ Global rate limiter: 250 requests per 15 minutes
- ✅ Auth endpoints: 30 requests per 15 minutes
- ✅ AI endpoints: 20 requests per minute
- ✅ Payment endpoints: 10 requests per minute
- ✅ Jobs endpoints: 30 requests per minute
- ✅ Admin endpoints: 50 requests per minute

### 5. Production Logging
- ✅ Console.log statements disabled in production
- ✅ Structured logging with Winston
- ✅ Request ID tracing for debugging

### 6. Caching Strategy
- ✅ In-memory cache service with TTL support
- ✅ Cache middleware for GET requests
- ✅ Automatic cleanup of expired entries
- ✅ Max size limit to prevent memory issues

### 7. Code Quality
- ✅ ESLint configuration for backend and frontend
- ✅ Prettier configuration for consistent formatting
- ✅ Lint and format scripts added to package.json

### 8. Security Scanning
- ✅ Secrets scanner to detect exposed credentials
- ✅ GitHub Actions workflow for automated security checks
- ✅ Dependency audit in CI/CD pipeline

### 9. Monitoring & Alerting
- ✅ Health check monitoring script
- ✅ Webhook integration for alerts
- ✅ Database backup script

## Environment Variables Required

### Production (Critical)
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
JWT_SECRET=<min-32-chars>
JWT_REFRESH_SECRET=<min-32-chars>
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
```

### Development (Minimum)
```env
NODE_ENV=development
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=<key>
```

## Security Best Practices

### 1. Never Commit Secrets
- Use .env files (already in .gitignore)
- Run `npm run scan:secrets` before commits
- Use environment variables in CI/CD

### 2. Regular Security Audits
```bash
npm run audit
npm run scan:secrets
```

### 3. Database Backups
```bash
npm run backup:db
```

### 4. Health Monitoring
```bash
npm run monitor:health
```

### 5. Code Quality
```bash
npm run lint
npm run format
```

## Rate Limiting Configuration

Adjust rate limits in environment variables:
```env
GLOBAL_RATE_LIMIT_MAX=250
AUTH_RATE_LIMIT_MAX=30
```

## CORS Configuration

Add allowed origins:
```env
FRONTEND_URL=http://localhost:5173
PRODUCTION_FRONTEND_URL=https://your-domain.com
STAGING_FRONTEND_URL=https://staging.your-domain.com
PRODUCTION_DOMAIN=your-domain.com
```

## Incident Response

1. Check health endpoints: `/health`, `/health/ready`, `/health/live`
2. Review structured logs with request IDs
3. Check rate limit headers: `X-RateLimit-Remaining`
4. Monitor cache hit rates in logs

## Security Contacts

Report security vulnerabilities to: security@preploop.com
