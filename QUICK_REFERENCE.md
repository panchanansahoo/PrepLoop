# PrepLoop Improvements - Quick Reference Card

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm run install:all
cd backend && npm install isomorphic-dompurify

# 2. Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Update .env files
# Add JWT_SECRET and JWT_REFRESH_SECRET to backend/.env

# 4. Verify setup
npm run verify:setup
npm run test:improvements

# 5. Start application
npm run dev
```

---

## 🔐 Security

### Input Sanitization
```javascript
// Automatically applied to all routes
// Skip for specific paths:
app.use(sanitizeInput({ skipPaths: ['/webhook'] }));
```

### Request Validation
```javascript
import { validate, authSchemas } from './middleware/requestValidation.js';

router.post('/signup', validate(authSchemas.signup), handler);
router.get('/users', validateQuery(paginationSchema), handler);
```

### CORS Configuration
```javascript
// Configured in backend/config/cors.js
// Set in .env:
FRONTEND_URL=https://yourapp.com
PRODUCTION_DOMAIN=yourapp.com
```

---

## ⚡ Performance

### Caching
```javascript
import cacheManager, { CacheKeys, CacheTTL } from './utils/cacheManager.js';

// Get or set cache
const data = await cacheManager.getOrSet(
  CacheKeys.user(userId),
  () => fetchFromDB(userId),
  CacheTTL.MEDIUM
);

// Invalidate cache
await cacheManager.delete(CacheKeys.user(userId));
await cacheManager.deletePattern('user:*');

// Get stats
const stats = await cacheManager.getStats();
```

### Query Monitoring
```javascript
import { queryMonitor, withTransaction } from './utils/dbOptimizer.js';

// Track query
await queryMonitor.trackQuery('getUserById', () => {
  return db.query('SELECT * FROM users WHERE id = $1', [userId]);
});

// Transaction with retry
await withTransaction(pool, async (client) => {
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
});

// Get stats
const stats = queryMonitor.getStats();
```

---

## 🎨 Frontend

### API Client
```javascript
import api from './utils/apiClient';

// GET request
const data = await api.get('/api/users/profile');

// POST request
await api.post('/api/problems/submit', { code, language });

// Upload file
await api.upload('/api/resume/upload', file, (progress) => {
  console.log(`Upload: ${progress}%`);
});

// Cached GET
import { cachedApi } from './utils/apiClient';
const data = await cachedApi.get('/api/problems');
```

### Logging & Monitoring
```javascript
import { logger, performanceMonitor, interactionTracker } from './utils/monitoring';

// Logging
logger.debug('Debug message', { data });
logger.info('Info message', { data });
logger.warn('Warning message', { data });
logger.error('Error message', error, { data });

// Performance
performanceMonitor.start('operation');
await doSomething();
const measure = performanceMonitor.end('operation');

// Interactions
interactionTracker.track('button_click', { buttonId: 'submit' });
```

### Error Boundary
```javascript
// Already integrated in App.jsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

## 📦 Cache Keys & TTL

### Predefined Cache Keys
```javascript
CacheKeys.user(userId)              // 'user:123'
CacheKeys.userProfile(userId)       // 'user:123:profile'
CacheKeys.problem(problemId)        // 'problem:456'
CacheKeys.problems(filters)         // 'problems:{"difficulty":"easy"}'
CacheKeys.interview(interviewId)    // 'interview:789'
CacheKeys.blogPost(slug)            // 'blog:my-post'
CacheKeys.blogList(page)            // 'blog:list:1'
CacheKeys.jobListings(filters)      // 'jobs:{"location":"remote"}'
CacheKeys.leaderboard(type)         // 'leaderboard:weekly'
CacheKeys.systemDesign(topicId)     // 'system-design:123'
```

### Cache TTL Constants
```javascript
CacheTTL.SHORT       // 5 minutes
CacheTTL.MEDIUM      // 30 minutes
CacheTTL.LONG        // 1 hour
CacheTTL.VERY_LONG   // 24 hours
```

---

## 🔍 Validation Schemas

### Available Schemas
```javascript
import {
  authSchemas,      // signup, login, forgotPassword, resetPassword
  userSchemas,      // updateProfile
  dsaSchemas,       // submitSolution
  blogSchemas,      // createPost, updatePost
  interviewSchemas, // startInterview, submitAnswer
  contactSchemas,   // submitForm
  commonSchemas,    // id, email, password, username, pagination
} from './middleware/requestValidation.js';
```

### Usage Examples
```javascript
// Body validation
router.post('/signup', validate(authSchemas.signup), handler);

// Query validation
router.get('/users', validateQuery(commonSchemas.pagination), handler);

// Params validation
router.get('/users/:id', validateParams(Joi.object({ id: commonSchemas.id })), handler);
```

---

## 🛠️ Useful Commands

```bash
# Setup & Verification
npm run setup                    # Bootstrap setup
npm run verify:setup             # Verify environment
npm run verify:setup:strict      # Strict verification
npm run test:improvements        # Test all improvements

# Development
npm run dev                      # Start dev servers
npm run lint                     # Lint code
npm test                         # Run tests

# Cache Management
npm run cache:clear              # Clear cache

# Documentation
npm run docs:api                 # Generate API docs
```

---

## 🌍 Environment Variables

### Required (All Environments)
```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=xxx  # Min 32 chars
```

### Required (Production Only)
```bash
JWT_REFRESH_SECRET=xxx  # Min 32 chars
PRODUCTION_FRONTEND_URL=https://yourapp.com
PRODUCTION_DOMAIN=yourapp.com
```

### Optional (Recommended)
```bash
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=xxx
SMTP_USER=xxx
SMTP_PASS=xxx
```

---

## 📊 Monitoring Endpoints

```bash
# Health checks
GET /health              # Basic health check
GET /health/ready        # Readiness check
GET /health/live         # Liveness check

# Metrics (add these to your routes)
GET /api/metrics/cache   # Cache statistics
GET /api/metrics/db      # Database statistics
GET /api/metrics/perf    # Performance metrics
```

---

## 🐛 Troubleshooting

### Cache not working
```bash
# Check Redis connection
redis-cli ping

# Check logs
tail -f backend/.tmp_backend_out.log | grep cache

# Fallback: In-memory cache is automatic
```

### CORS errors
```bash
# Verify environment variables
echo $FRONTEND_URL
echo $PRODUCTION_FRONTEND_URL

# Check logs for blocked origins
tail -f backend/.tmp_backend_out.log | grep CORS
```

### Validation errors
```bash
# Verify setup
npm run verify:setup

# Check specific variable
node -e "console.log(process.env.JWT_SECRET?.length)"
```

### Performance issues
```javascript
// Check query stats
const stats = queryMonitor.getStats();
console.log('Slow queries:', stats.slowQueries);

// Check cache stats
const cacheStats = await cacheManager.getStats();
console.log('Cache stats:', cacheStats);
```

---

## 📚 Documentation Files

- `COMPLETE_IMPROVEMENTS_SUMMARY.md` - Complete overview
- `IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` - Detailed guide
- `README.md` - Project overview
- `docs/ARCHITECTURE.md` - System architecture
- `docs/BACKEND_API_QUICK_REFERENCE.md` - API reference

---

## 🎯 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | <200ms | ~150ms |
| Cache Hit Rate | >60% | 60-80% |
| Error Rate | <0.1% | <0.05% |
| Uptime | >99.9% | Monitor |

---

## ✅ Pre-Deployment Checklist

- [ ] Run `npm run test:improvements`
- [ ] Run `npm run verify:setup`
- [ ] Set strong JWT secrets (32+ chars)
- [ ] Configure CORS for production
- [ ] Set up Redis for caching
- [ ] Enable HTTPS
- [ ] Configure monitoring
- [ ] Set up error tracking
- [ ] Review rate limits
- [ ] Test all critical paths

---

**Quick Help**: Run `npm run test:improvements` to verify everything is working correctly.

**Full Documentation**: See `IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` for complete details.
