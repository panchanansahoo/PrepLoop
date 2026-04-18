# Performance Optimization Guide

## Implemented Optimizations

### 1. Caching Strategy
- ✅ In-memory cache service with TTL
- ✅ Cache middleware for GET endpoints
- ✅ Automatic cleanup every 5 minutes
- ✅ Max 1000 entries to prevent memory issues

**Usage:**
```javascript
import { cacheMiddleware } from './middleware/cache.js';

// Cache for 5 minutes
router.get('/api/data', cacheMiddleware({ ttl: 300 }), handler);

// Custom key generator
router.get('/api/user/:id', cacheMiddleware({
  ttl: 600,
  keyGenerator: (req) => `user:${req.params.id}`
}), handler);
```

### 2. Response Compression
- ✅ Gzip compression enabled
- ✅ Level 6 compression (balanced)
- ✅ Opt-out via `x-no-compression` header

### 3. Database Connection Management
- ✅ Supabase client with connection pooling
- ✅ Single client instance (no duplicate connections)

### 4. Rate Limiting
- ✅ Prevents abuse and resource exhaustion
- ✅ Protects against DDoS attacks
- ✅ Per-endpoint limits for critical paths

## Recommended Optimizations

### Frontend Bundle Size
```bash
# Analyze bundle
npm run build --prefix frontend
# Check dist/ folder size
```

**Recommendations:**
- Implement code splitting for routes
- Lazy load heavy components
- Use dynamic imports for Monaco Editor
- Optimize images and assets

### Database Indexes
Review and apply performance indexes:
```sql
-- Check migration_performance_indexes.sql
-- Apply missing indexes for frequently queried columns
```

### CDN for Static Assets
Move voice binary files to CDN:
- Upload to S3/CloudFront
- Update voice service to use CDN URLs
- Reduce backend load

### Redis Integration
For production, replace in-memory cache with Redis:
```javascript
import Redis from 'redis';
const redis = Redis.createClient({
  url: process.env.REDIS_URL
});
```

## Performance Monitoring

### Response Times
Monitor via structured logs:
```javascript
logger.info('Request completed', {
  requestId,
  path: req.path,
  durationMs: Date.now() - startTime
});
```

### Cache Hit Rate
Check logs for cache performance:
```bash
grep "Cache hit" logs/*.log | wc -l
grep "Cache miss" logs/*.log | wc -l
```

### Database Query Performance
Use Supabase dashboard to monitor:
- Slow queries
- Connection pool usage
- Query execution plans

## Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test endpoint
ab -n 1000 -c 10 http://localhost:5000/api/health

# With authentication
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" http://localhost:5000/api/user/profile
```

## Optimization Checklist

- [ ] Enable Redis for production caching
- [ ] Move static assets to CDN
- [ ] Implement frontend code splitting
- [ ] Add database indexes for slow queries
- [ ] Enable HTTP/2 in production
- [ ] Implement service worker for offline support
- [ ] Optimize images (WebP format)
- [ ] Lazy load non-critical components
- [ ] Implement virtual scrolling for long lists
- [ ] Use React.memo for expensive components

## Performance Targets

- API response time: < 200ms (p95)
- Frontend initial load: < 3s
- Time to interactive: < 5s
- Cache hit rate: > 80%
- Database query time: < 100ms (p95)
