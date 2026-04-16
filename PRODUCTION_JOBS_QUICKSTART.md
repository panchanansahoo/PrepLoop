# Production-Ready Indian Job Updates - Quick Start

## 🚀 What's New

Your PrepLoop platform now has **production-ready real-time Indian job updates** with:

- ✅ **4 Free Job Sources**: Indeed India, Naukri, Foundit, LinkedIn
- ✅ **Real-time Polling**: Auto-refresh every 5 minutes
- ✅ **Smart Caching**: 10-minute cache reduces load
- ✅ **Rate Limiting**: Prevents abuse (10 req/min)
- ✅ **Zero Configuration**: Works immediately, no API keys needed

## 🎯 Quick Test

### 1. Start the Server

```bash
npm run dev
```

### 2. Test Real-Time Jobs API

```bash
# Get live jobs
curl "http://localhost:5000/api/jobs/live?query=software+developer"

# Get jobs with filters
curl "http://localhost:5000/api/jobs?search=react&category=fresher&limit=10"
```

### 3. Frontend Integration

```jsx
import { useRealTimeJobs } from './hooks/useRealTimeJobs';

function JobsPage() {
  const { jobs, loading, lastUpdate, refresh } = useRealTimeJobs('react developer');

  return (
    <div>
      <h1>Live Jobs: {jobs.length}</h1>
      <p>Updated: {lastUpdate?.toLocaleTimeString()}</p>
      <button onClick={refresh}>Refresh</button>
      {jobs.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <p>{job.company} - {job.location}</p>
          <a href={job.apply_link}>Apply</a>
        </div>
      ))}
    </div>
  );
}
```

## 📁 New Files Created

```
backend/
├── utils/
│   ├── indianJobApis.js      # Production scrapers (Indeed, Naukri, Foundit, LinkedIn)
│   ├── jobCache.js           # Caching & rate limiting
│   └── jobWebSocket.js       # WebSocket support (optional)

frontend/
├── src/
│   ├── hooks/
│   │   └── useRealTimeJobs.js        # React hooks
│   └── components/
│       └── RealTimeJobsExample.jsx   # Full example
```

## 🔧 Configuration (Optional)

All features work without configuration. To customize:

### Adjust Cache Duration

```javascript
// backend/utils/jobCache.js
const CACHE_TTL = 15 * 60 * 1000; // Change to 15 minutes
```

### Adjust Rate Limits

```javascript
// backend/utils/jobCache.js
const MAX_REQUESTS_PER_WINDOW = 20; // Change to 20 requests/min
```

### Adjust Polling Interval

```javascript
// Frontend
const { jobs } = useRealTimeJobs('query', {
  pollInterval: 180000 // Change to 3 minutes
});
```

## 📊 API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /api/jobs` | List jobs with filters | `?search=react&category=fresher` |
| `GET /api/jobs/live` | Real-time updates | `?query=python+developer` |
| `POST /api/jobs/ai-search` | AI-powered search | `{"query": "fresher jobs in Bangalore"}` |

## 🎨 Example Response

```json
{
  "jobs": [
    {
      "id": "indeed_12345",
      "title": "Software Developer - Fresher",
      "company": "TCS",
      "location": "Bangalore, India",
      "salary_range": "₹3.5-6 LPA",
      "category": "fresher",
      "type": "full-time",
      "source": "indeed_india",
      "apply_link": "https://in.indeed.com/viewjob?jk=12345"
    }
  ],
  "total": 45,
  "cached": true,
  "rateLimit": {
    "remaining": 8,
    "limit": 10
  }
}
```

## 🔍 Monitoring

Check logs for:

```
✓ Fetched 25 jobs from Indian job portals
✓ Returning 25 cached jobs for: software developer
✓ Broadcasting job updates to 3 clients
```

## 📚 Full Documentation

- **Complete Guide**: `docs/INDIAN_JOB_APIS_PRODUCTION.md`
- **API Reference**: `docs/BACKEND_API_QUICK_REFERENCE.md`

## 🐛 Troubleshooting

**No jobs returned?**
- Check server logs
- Verify internet connection
- Curated jobs always available as fallback

**Rate limited (429)?**
- Wait 60 seconds
- Increase `MAX_REQUESTS_PER_WINDOW`
- Use caching more effectively

**Slow responses?**
- Check cache hit rate in logs
- Increase `CACHE_TTL`
- Reduce concurrent sources

## 🚀 Production Deployment

Works immediately in production! No additional setup needed.

**Optional**: Add paid APIs for more coverage:

```env
# backend/.env
RAPIDAPI_KEY=your_key
ADZUNA_APP_ID=your_id
ADZUNA_APP_KEY=your_key
```

## ✨ Features

- **Deduplication**: Removes duplicate jobs across sources
- **Auto-categorization**: Detects fresher/internship/campus jobs
- **Fallback chain**: Multiple sources ensure availability
- **Production parsing**: Robust HTML extraction
- **Error handling**: Graceful degradation

## 🎯 Next Steps

1. Test the `/api/jobs/live` endpoint
2. Integrate `useRealTimeJobs` hook in your frontend
3. Customize polling interval and cache settings
4. Monitor logs for performance
5. Deploy to production!

---

**Need help?** Check `docs/INDIAN_JOB_APIS_PRODUCTION.md` for detailed documentation.
