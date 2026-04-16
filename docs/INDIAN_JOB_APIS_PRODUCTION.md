# Free Indian Job APIs Integration - Production Ready

## Overview

PrepLoop now integrates **production-ready free Indian job portals** with real-time updates, caching, rate limiting, and WebSocket support.

## ✨ Production Features

- ✅ **Real-time Updates** - Live job feeds via polling or WebSocket
- ✅ **Smart Caching** - 10-minute cache to reduce API calls
- ✅ **Rate Limiting** - 10 requests per minute per user
- ✅ **Deduplication** - Removes duplicate jobs across sources
- ✅ **Multi-source** - Indeed, Naukri, Foundit, LinkedIn
- ✅ **Fallback Chain** - Multiple sources ensure availability
- ✅ **Production Parsing** - Robust HTML extraction with error handling
- ✅ **Zero Cost** - No API keys required

## Supported Job Portals

### 1. **Indeed India** (in.indeed.com)
- **Cost**: Free, no API key required
- **Coverage**: Pan-India jobs across all sectors
- **Update Frequency**: Real-time
- **Job Types**: Full-time, Part-time, Internships, Contract

### 2. **Naukri.com**
- **Cost**: Free, no API key required
- **Coverage**: India's largest job portal
- **Update Frequency**: Real-time
- **Job Types**: All categories including fresher, experienced

### 3. **Foundit (Monster India)**
- **Cost**: Free, no API key required
- **Coverage**: India-focused with MNC listings
- **Update Frequency**: Real-time
- **Job Types**: Full-time, Contract, Remote

### 4. **LinkedIn Jobs**
- **Cost**: Free, no API key required
- **Coverage**: Professional network jobs
- **Update Frequency**: Real-time
- **Job Types**: All levels from entry to senior

### 5. **Remotive** (Fallback)
- **Cost**: Free, no API key required
- **Coverage**: Remote jobs globally
- **Update Frequency**: Daily
- **Job Types**: Remote software development roles

## Real-Time Updates

### Polling Endpoint (Recommended)

**GET /api/jobs/live**

Polls for new jobs every 5 minutes:

```javascript
// Frontend usage
import { useRealTimeJobs } from './hooks/useRealTimeJobs';

function JobsPage() {
  const { jobs, loading, lastUpdate, refresh } = useRealTimeJobs('react developer', {
    enabled: true,
    pollInterval: 300000 // 5 minutes
  });

  return (
    <div>
      <h1>Live Jobs ({jobs.length})</h1>
      <p>Last updated: {lastUpdate?.toLocaleTimeString()}</p>
      <button onClick={refresh}>Refresh Now</button>
      {jobs.map(job => <JobCard key={job.id} job={job} />)}
    </div>
  );
}
```

**Query Parameters:**
- `query` - Search query (default: 'software developer')
- `lastUpdate` - ISO timestamp of last fetch (optional)

**Response:**
```json
{
  "jobs": [...],
  "hasUpdates": true,
  "timestamp": "2025-01-15T10:30:00Z",
  "nextPoll": 300,
  "query": "react developer"
}
```

### WebSocket Support (Optional)

For real-time push updates:

```javascript
const { jobs, isConnected } = useRealTimeJobs('python developer', {
  useWebSocket: true
});
```

**WebSocket URL:** `ws://localhost:5000/jobs`

**Subscribe Message:**
```json
{
  "type": "subscribe",
  "query": "data analyst"
}
```

**Update Message:**
```json
{
  "type": "job_update",
  "query": "data analyst",
  "jobs": [...],
  "timestamp": "2025-01-15T10:30:00Z",
  "cached": false
}
```

## Performance & Caching

### In-Memory Cache

- **TTL**: 10 minutes
- **Key Format**: `jobs_{query}_{page}`
- **Benefits**: Reduces API calls, faster response times

### Rate Limiting

- **Limit**: 10 requests per minute per user
- **Window**: 60 seconds rolling
- **Headers**: `X-RateLimit-Remaining`

**Rate Limit Response (429):**
```json
{
  "error": "Too many requests. Please try again in 45 seconds.",
  "retryAfter": 45
}
```

## API Endpoints

### GET /api/jobs
Fetch jobs with optional filters:

```bash
curl "http://localhost:5000/api/jobs?search=react+developer&category=fresher"
```

**Query Parameters:**
- `search` - Job title or keyword
- `category` - fresher | internship | campus | off-campus
- `company` - Company name filter
- `type` - full-time | part-time | internship | contract
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)
- `source` - admin | external (filter by source)

**Response:**
```json
{
  "jobs": [
    {
      "id": "indeed_abc123",
      "title": "Software Developer",
      "company": "TCS",
      "category": "fresher",
      "type": "full-time",
      "location": "Bangalore, India",
      "salary_range": "₹3-6 LPA",
      "description": "View full details on Indeed India",
      "apply_link": "https://in.indeed.com/viewjob?jk=abc123",
      "source": "indeed_india",
      "tags": ["TCS", "indeed_india"],
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 2,
  "cached": true,
  "rateLimit": {
    "remaining": 8,
    "limit": 10
  }
}
```

### GET /api/jobs/live
Real-time job updates with polling:

```bash
curl "http://localhost:5000/api/jobs/live?query=python+developer"
```

### POST /api/jobs/ai-search
AI-powered natural language job search:

```bash
curl -X POST http://localhost:5000/api/jobs/ai-search \
  -H "Content-Type: application/json" \
  -d '{"query": "fresher react developer jobs in Bangalore"}'
```

**Response:**
```json
{
  "jobs": [...],
  "total": 15,
  "ai_parsed": {
    "role": "react developer",
    "location": "Bangalore",
    "experience_level": "fresher"
  },
  "ai_suggestions": [
    "Frontend developer jobs in Bangalore",
    "JavaScript developer fresher positions",
    "React Native developer roles"
  ],
  "ai_powered": true
}
```

## Frontend Integration

### Installation

No additional packages needed! Uses native fetch and WebSocket APIs.

### Basic Usage

```jsx
import { useRealTimeJobs } from './hooks/useRealTimeJobs';

function JobBoard() {
  const { jobs, loading, error, refresh } = useRealTimeJobs('software engineer');

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <div>
      {jobs.map(job => (
        <JobCard key={job.id} {...job} />
      ))}
    </div>
  );
}
```

### Advanced Usage with Filters

```jsx
import { useJobs } from './hooks/useRealTimeJobs';

function FilteredJobs() {
  const [filters, setFilters] = useState({
    search: 'react',
    category: 'fresher',
    type: 'full-time',
    page: 1
  });

  const { jobs, pagination, loading } = useJobs(filters);

  return (
    <div>
      <SearchBar onSearch={(q) => setFilters({...filters, search: q})} />
      <JobList jobs={jobs} />
      <Pagination {...pagination} onChange={(p) => setFilters({...filters, page: p})} />
    </div>
  );
}
```

### Complete Example Component

See `frontend/src/components/RealTimeJobsExample.jsx` for a full implementation.

## File Structure

```
backend/
├── routes/
│   └── jobs.js                    # Main job routes with caching & rate limiting
├── utils/
│   ├── indianJobApis.js           # Production-ready scrapers
│   ├── jobCache.js                # In-memory cache & rate limiting
│   └── jobWebSocket.js            # WebSocket handler (optional)

frontend/
├── src/
│   ├── hooks/
│   │   └── useRealTimeJobs.js     # React hooks for job fetching
│   └── components/
│       └── RealTimeJobsExample.jsx # Example implementation
```

## API Endpoints Summary

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/jobs` | GET | List all jobs with filters | Optional |
| `/api/jobs/live` | GET | Real-time job updates (polling) | No |
| `/api/jobs/ai-search` | POST | AI-powered natural language search | No |
| `/api/jobs/:id` | GET | Single job details | Optional |
| `/api/jobs` | POST | Create job (admin) | Required |
| `/api/jobs/:id` | PUT | Update job (admin) | Required |
| `/api/jobs/:id` | DELETE | Delete job (admin) | Required |
| `/api/jobs/career-ops/evaluate` | POST | Job fit evaluation | Required |

## Production Deployment

### Environment Variables

No additional env vars needed for Indian job APIs! They work out of the box.

**Optional enhancements:**
```env
# Optional: Add more job sources
RAPIDAPI_KEY=your_key
ADZUNA_APP_ID=your_id
ADZUNA_APP_KEY=your_key
```

### Performance Tuning

**Adjust cache TTL:**
```javascript
// backend/utils/jobCache.js
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
```

**Adjust rate limits:**
```javascript
// backend/utils/jobCache.js
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute
```

**Adjust polling interval:**
```javascript
// Frontend
const { jobs } = useRealTimeJobs('query', {
  pollInterval: 180000 // 3 minutes
});
```

### Monitoring

Check server logs for:
```
Fetched X jobs from Indian job portals
Returning X cached jobs for: query
Broadcasting job updates to X clients
```

## Troubleshooting

### No Jobs Returned

1. Check server logs for API errors
2. Verify network connectivity
3. Check if job portals are accessible
4. Fallback to curated jobs should always work

### Slow Response Times

1. Check cache hit rate in logs
2. Reduce number of concurrent sources
3. Increase cache TTL
4. Use pagination (limit results)

### Rate Limit Errors (429)

1. Increase `MAX_REQUESTS_PER_WINDOW`
2. Implement user-specific rate limits
3. Use caching more aggressively
4. Increase polling interval on frontend

### WebSocket Connection Issues

1. Fallback to polling automatically
2. Check firewall/proxy settings
3. Verify WebSocket support in deployment environment
4. Use polling for production (more reliable)

## Future Enhancements

- [ ] Redis caching for distributed systems
- [ ] Job alerts/notifications via email
- [ ] Saved searches and job bookmarks
- [ ] More Indian job portals (Freshersworld, TimesJobs)
- [ ] Machine learning for job recommendations
- [ ] Company reviews integration

## Support

For issues or questions:
- Check server logs: `npm run dev`
- Review `backend/utils/indianJobApis.js`
- Ensure network connectivity to job portals
- Test with: `curl http://localhost:5000/api/jobs/live`
