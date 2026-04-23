# Performance Optimization Guide

## Overview
Comprehensive guide to optimize PrepLoop performance across all layers.

## Quick Wins (Immediate Impact)

### 1. Enable Redis Caching
```env
USE_REDIS=true
REDIS_URL=redis://localhost:6379
```
**Impact:** 40-60% reduction in API response time

### 2. Optimize Database Pool
```env
DB_POOL_MAX=30
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=30000
```
**Impact:** Better connection management, reduced latency

### 3. Enable Compression
```env
COMPRESSION_LEVEL=6
COMPRESSION_THRESHOLD=1024
```
**Impact:** 60-80% reduction in response size

### 4. Increase Cache Sizes
```env
CACHE_MAX_SIZE=2000
CACHE_TTL_MS=600000
```
**Impact:** Higher cache hit rates

## Frontend Optimizations

### 1. Code Splitting

**Implement route-based splitting:**
```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Practice = lazy(() => import('./pages/Practice'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice" element={<Practice />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. Image Optimization

```javascript
// Use WebP format with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" loading="lazy" />
</picture>
```

### 3. Memoization

```javascript
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);

  const handleClick = useCallback(() => {
    // Handler logic
  }, []);

  return <div>{/* Render */}</div>;
});
```

### 4. Virtual Scrolling

```javascript
import { FixedSizeList } from 'react-window';

function ProblemList({ problems }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={problems.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ProblemCard problem={problems[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 5. Debounce Search

```javascript
import { useMemo } from 'react';
import { debounce } from 'lodash';

function SearchBar() {
  const debouncedSearch = useMemo(
    () => debounce((query) => {
      api.search(query);
    }, 300),
    []
  );

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

## Backend Optimizations

### 1. Database Query Optimization

**Add indexes:**
```sql
-- Index frequently queried columns
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_problems_difficulty_tags ON problems(difficulty, tags);
```

**Use query optimization:**
```javascript
// Bad: N+1 query
const users = await db.getUsers();
for (const user of users) {
  user.profile = await db.getProfile(user.id);
}

// Good: Single query with join
const users = await db.query(`
  SELECT u.*, p.*
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
`);
```

### 2. Implement Query Result Caching

```javascript
import { cacheWrapper } from './utils/unifiedCache.js';

async function getPopularProblems() {
  return await cacheWrapper(
    'problems',
    'popular',
    async () => {
      return await db.query(`
        SELECT * FROM problems
        ORDER BY attempts DESC
        LIMIT 20
      `);
    },
    300000 // 5 minutes
  );
}
```

### 3. Batch Operations

```javascript
// Bad: Multiple individual inserts
for (const activity of activities) {
  await db.insertActivity(activity);
}

// Good: Batch insert
await db.batchInsert('activities', activities);
```

### 4. Async Processing

```javascript
import { Queue } from 'bull';

const emailQueue = new Queue('emails', process.env.REDIS_URL);

// Add to queue instead of blocking
router.post('/signup', async (req, res) => {
  const user = await createUser(req.body);
  
  // Non-blocking email
  await emailQueue.add({ userId: user.id, type: 'welcome' });
  
  res.json({ success: true });
});

// Process in background
emailQueue.process(async (job) => {
  await sendEmail(job.data);
});
```

### 5. Response Streaming

```javascript
router.get('/large-dataset', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');
  
  const stream = db.streamQuery('SELECT * FROM large_table');
  let first = true;
  
  for await (const row of stream) {
    if (!first) res.write(',');
    res.write(JSON.stringify(row));
    first = false;
  }
  
  res.write(']');
  res.end();
});
```

## Database Optimizations

### 1. Connection Pooling

```javascript
// Already implemented in dbPool.js
// Tune based on load
DB_POOL_MAX=50  // For high traffic
DB_POOL_MIN=10
```

### 2. Query Timeout

```javascript
import { query } from './config/dbPool.js';

async function safeQuery(sql, params, timeoutMs = 5000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });
  
  return Promise.race([
    query(sql, params),
    timeoutPromise
  ]);
}
```

### 3. Read Replicas

```javascript
// Configure read replica
const readPool = new Pool({
  connectionString: process.env.READ_REPLICA_URL,
  max: 20
});

// Use for read operations
async function getProblems() {
  return await readPool.query('SELECT * FROM problems');
}
```

## Caching Strategy

### 1. Multi-Layer Caching

```
Request → L1 (Memory) → L2 (Redis) → Database
```

Already implemented in `unifiedCache.js`

### 2. Cache Warming

```javascript
// Warm cache on startup
async function warmCache() {
  await cacheWrapper('problems', 'popular', () => getPopularProblems());
  await cacheWrapper('problems', 'trending', () => getTrendingProblems());
  await cacheWrapper('companies', 'top', () => getTopCompanies());
}

// Call on server start
warmCache().catch(console.error);
```

### 3. Cache Invalidation

```javascript
// Invalidate on update
router.put('/problems/:id', async (req, res) => {
  await updateProblem(req.params.id, req.body);
  
  // Invalidate related caches
  await invalidateCache('problems', `problem:${req.params.id}`);
  await invalidateCache('problems', 'popular');
  
  res.json({ success: true });
});
```

## Network Optimizations

### 1. HTTP/2

```javascript
// Enable in nginx
http2 on;
```

### 2. CDN for Static Assets

```javascript
// Use CDN URLs in production
const ASSET_URL = process.env.NODE_ENV === 'production'
  ? 'https://cdn.preploop.com'
  : '';
```

### 3. Prefetch/Preload

```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
<link rel="prefetch" href="/api/problems" as="fetch">
```

### 4. Service Worker Caching

Already implemented in `service-worker.js`

## Monitoring & Profiling

### 1. Identify Bottlenecks

```javascript
// Use performance monitoring
import { measureApiCall } from './utils/performance.js';

const data = await measureApiCall('getProblems', () => {
  return api.getProblems();
});
```

### 2. Database Query Analysis

```sql
-- Enable query logging
ALTER DATABASE preploop SET log_min_duration_statement = 100;

-- Analyze slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 3. Memory Profiling

```javascript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  logger.info('Memory usage', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`
  });
}, 60000);
```

## Performance Benchmarks

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p95) | < 200ms | Monitor |
| Page Load Time | < 2s | Monitor |
| Time to Interactive | < 3s | Monitor |
| First Contentful Paint | < 1.5s | Monitor |
| Cache Hit Rate | > 70% | Monitor |
| Database Query Time | < 50ms | Monitor |

### Measuring Performance

```bash
# Backend load testing
npm install -g autocannon
autocannon -c 100 -d 30 http://localhost:5000/api/problems

# Frontend performance
npm install -g lighthouse
lighthouse http://localhost:5173 --view

# Database performance
EXPLAIN ANALYZE SELECT * FROM problems WHERE difficulty = 'hard';
```

## Optimization Checklist

### Frontend
- [ ] Code splitting implemented
- [ ] Images optimized (WebP, lazy loading)
- [ ] Components memoized
- [ ] Virtual scrolling for long lists
- [ ] Debounced search/input
- [ ] Service worker enabled
- [ ] Bundle size < 500KB

### Backend
- [ ] Database indexes created
- [ ] Query optimization done
- [ ] Caching implemented
- [ ] Connection pooling configured
- [ ] Compression enabled
- [ ] Rate limiting tuned
- [ ] Async processing for heavy tasks

### Database
- [ ] Indexes on frequently queried columns
- [ ] Query timeout configured
- [ ] Connection pool optimized
- [ ] Slow query logging enabled
- [ ] Regular VACUUM/ANALYZE

### Infrastructure
- [ ] CDN configured
- [ ] HTTP/2 enabled
- [ ] Gzip compression enabled
- [ ] Redis caching enabled
- [ ] Load balancing configured
- [ ] Auto-scaling enabled

## Continuous Optimization

1. **Monitor regularly** - Check metrics weekly
2. **Profile periodically** - Run performance tests monthly
3. **Optimize iteratively** - Focus on biggest bottlenecks
4. **Test thoroughly** - Verify improvements don't break functionality
5. **Document changes** - Keep track of optimizations

## Tools & Resources

- **Frontend**: Lighthouse, WebPageTest, Chrome DevTools
- **Backend**: New Relic, DataDog, Clinic.js
- **Database**: pg_stat_statements, EXPLAIN ANALYZE
- **Load Testing**: autocannon, k6, Apache JMeter
- **Monitoring**: Prometheus, Grafana, ELK Stack
