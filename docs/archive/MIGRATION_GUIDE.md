# Migration Guide - Upgrading to Enhanced PrepLoop

## Overview
This guide helps you migrate from the previous version to the enhanced version with all improvements.

## Pre-Migration Checklist

- [ ] Backup database
- [ ] Backup environment variables
- [ ] Document current configuration
- [ ] Test in staging environment first
- [ ] Schedule maintenance window
- [ ] Notify users of downtime

## Step-by-Step Migration

### 1. Backup Current System

```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup environment files
cp backend/.env backend/.env.backup
cp frontend/.env frontend/.env.backup

# Backup current deployment
git tag pre-migration-$(date +%Y%m%d)
git push --tags
```

### 2. Update Dependencies

```bash
# Backend
cd backend
npm install joi helmet express-rate-limit winston compression ws redis

# Frontend
cd ../frontend
npm install dompurify zod @playwright/test
```

### 3. Update Environment Variables

Add new variables to `backend/.env`:

```env
# Database Pool
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000

# Redis (Optional)
USE_REDIS=false
REDIS_URL=redis://localhost:6379

# Cache
CACHE_MAX_SIZE=1000
CACHE_TTL_MS=300000

# Rate Limiting
GLOBAL_RATE_LIMIT_MAX=250
AUTH_RATE_LIMIT_MAX=30

# Monitoring
ENABLE_PERFORMANCE_MONITORING=true
SLOW_REQUEST_THRESHOLD_MS=1000

# Request Timeout
REQUEST_TIMEOUT_MS=30000

# WebSocket
ENABLE_WEBSOCKET=true

# Security
ENABLE_CSRF_PROTECTION=true
```

### 4. Update Backend Code

The main server file has been updated. Review changes in:
- `backend/index.js` - New middleware integration
- `backend/middleware/` - New middleware files
- `backend/utils/` - New utility files
- `backend/services/` - WebSocket service

### 5. Update Frontend Code

Review changes in:
- `frontend/src/main.jsx` - ErrorBoundary and service worker
- `frontend/src/utils/` - New utility files
- `frontend/src/hooks/` - New hooks
- `frontend/src/components/` - ErrorBoundary component

### 6. Database Migration (if needed)

```bash
# No schema changes required for this upgrade
# Existing tables remain unchanged
```

### 7. Test New Features

```bash
# Run tests
npm run test
npm run test:e2e

# Test health endpoints
curl http://localhost:5000/health
curl http://localhost:5000/health/ready
curl http://localhost:5000/health/live

# Test monitoring endpoints (requires admin auth)
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/monitoring/stats
```

### 8. Deploy to Staging

```bash
# Using Docker
docker-compose -f docker-compose.staging.yml up -d

# Or manual deployment
npm run build
# Deploy to your staging environment
```

### 9. Verify Staging

- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Authentication working
- [ ] WebSocket connections working
- [ ] Cache functioning
- [ ] Monitoring endpoints accessible
- [ ] Error handling working
- [ ] Performance metrics collecting

### 10. Deploy to Production

```bash
# Using Docker
docker-compose up -d

# Using Kubernetes
kubectl apply -f k8s/deployment.yaml

# Monitor deployment
kubectl rollout status deployment/preploop-backend -n preploop
kubectl rollout status deployment/preploop-frontend -n preploop
```

## Feature-by-Feature Migration

### Caching

**Before:**
```javascript
const problems = await db.getProblems();
```

**After:**
```javascript
import { cacheWrapper } from './utils/unifiedCache.js';

const problems = await cacheWrapper(
  'problems',
  'all',
  () => db.getProblems()
);
```

### Error Handling

**Before:**
```javascript
router.get('/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**After:**
```javascript
import { asyncHandler, AppError } from './middleware/errorHandler.js';

router.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  if (!data) throw new AppError('Not found', 404);
  res.json(data);
}));
```

### Input Validation

**Before:**
```javascript
router.post('/submit', async (req, res) => {
  const { code, language } = req.body;
  // Manual validation
  if (!code || !language) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // Process...
});
```

**After:**
```javascript
import { validate, schemas } from './middleware/validation.js';

router.post('/submit', validate(schemas.codeSubmission), async (req, res) => {
  // req.body is already validated
  // Process...
});
```

### Frontend Error Handling

**Before:**
```javascript
// No error boundary
<App />
```

**After:**
```javascript
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Frontend Sanitization

**Before:**
```javascript
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

**After:**
```javascript
import { sanitizeHtml } from './utils/sanitize';

<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

## Rollback Plan

If issues occur during migration:

### 1. Immediate Rollback

```bash
# Stop new version
docker-compose down

# Restore previous version
git checkout pre-migration-$(date +%Y%m%d)
docker-compose up -d
```

### 2. Database Rollback (if needed)

```bash
# Restore database backup
psql $DATABASE_URL < backup_$(date +%Y%m%d).sql
```

### 3. Environment Rollback

```bash
# Restore environment files
cp backend/.env.backup backend/.env
cp frontend/.env.backup frontend/.env
```

## Post-Migration Tasks

### 1. Monitor System

- [ ] Check error logs
- [ ] Monitor response times
- [ ] Verify cache hit rates
- [ ] Check WebSocket connections
- [ ] Review performance metrics

### 2. Configure Monitoring

```bash
# Set up monitoring dashboards
# Configure alerts
# Set up log aggregation
```

### 3. Optimize Configuration

Based on monitoring data:
- Adjust cache sizes
- Tune rate limits
- Optimize database pool
- Configure Redis (if using)

### 4. Update Documentation

- [ ] Update internal docs
- [ ] Update API documentation
- [ ] Update runbooks
- [ ] Train team on new features

## Common Issues & Solutions

### Issue: High Memory Usage

**Solution:**
```env
# Reduce cache sizes
CACHE_MAX_SIZE=500
DB_POOL_MAX=10
```

### Issue: Redis Connection Errors

**Solution:**
```env
# Disable Redis temporarily
USE_REDIS=false
```

### Issue: WebSocket Not Connecting

**Solution:**
```env
# Check WebSocket is enabled
ENABLE_WEBSOCKET=true

# Verify proxy configuration
# Ensure /ws path is proxied correctly
```

### Issue: Rate Limiting Too Strict

**Solution:**
```env
# Increase limits
GLOBAL_RATE_LIMIT_MAX=500
AUTH_RATE_LIMIT_MAX=50
```

### Issue: Slow Performance

**Solution:**
```bash
# Enable Redis caching
USE_REDIS=true
REDIS_URL=redis://localhost:6379

# Increase database pool
DB_POOL_MAX=30
```

## Verification Checklist

After migration, verify:

- [ ] All API endpoints responding
- [ ] Authentication working
- [ ] Database queries executing
- [ ] Cache functioning (check hit rates)
- [ ] WebSocket connections stable
- [ ] Error handling working
- [ ] Monitoring collecting data
- [ ] Health checks passing
- [ ] Performance acceptable
- [ ] No error spikes in logs

## Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Review health endpoints: `/health`, `/health/ready`, `/health/live`
3. Check monitoring dashboard: `/api/monitoring/stats`
4. Review this guide's troubleshooting section
5. Rollback if necessary

## Timeline Recommendation

- **Week 1**: Test in development
- **Week 2**: Deploy to staging
- **Week 3**: Monitor staging, fix issues
- **Week 4**: Deploy to production

## Success Criteria

Migration is successful when:

- ✅ All tests passing
- ✅ Zero downtime achieved
- ✅ Performance improved or maintained
- ✅ No increase in error rates
- ✅ Monitoring data collecting
- ✅ Team trained on new features
- ✅ Documentation updated
