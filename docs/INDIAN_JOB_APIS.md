# Free Indian Job APIs Integration

## Overview

PrepLoop now integrates **free Indian job portals** that don't require API keys, providing real-time job updates for Indian users.

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

### 4. **Remotive** (Fallback)
- **Cost**: Free, no API key required
- **Coverage**: Remote jobs globally
- **Update Frequency**: Daily
- **Job Types**: Remote software development roles

## API Priority Order

The system fetches jobs in this order:

1. **Indian Job Portals** (Indeed India + Naukri + Foundit) - Free, no keys
2. **JSearch via RapidAPI** - Requires `RAPIDAPI_KEY`
3. **Adzuna India** - Requires `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`
4. **Remotive** - Free, no keys
5. **Curated Jobs** - Hardcoded fallback

## Setup

### No Configuration Required!

The Indian job APIs work out of the box without any API keys. Just start the server:

```bash
npm run dev
```

### Optional: Add Paid APIs for More Coverage

If you want additional job sources, add these to `backend/.env`:

```env
# Optional: RapidAPI (JSearch)
RAPIDAPI_KEY=your_rapidapi_key

# Optional: Adzuna India
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
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
  "totalPages": 2
}
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

## Implementation Details

### File Structure

```
backend/
├── routes/
│   └── jobs.js              # Main job routes
├── utils/
│   └── indianJobApis.js     # Indian job portal scrapers
```

### Key Functions

**`fetchAllIndianJobs(query, location)`**
- Fetches jobs from all Indian portals in parallel
- Returns normalized job objects
- Handles errors gracefully with fallbacks

**`fetchIndeedIndiaJobs(query, location)`**
- Scrapes Indeed India job listings
- Extracts job IDs, titles, companies, locations

**`fetchNaukriJobs(query)`**
- Scrapes Naukri.com listings
- Parses job metadata from HTML

**`fetchFounditJobs(query)`**
- Scrapes Foundit (Monster India) listings
- Extracts job details

## Features

✅ **No API Keys Required** - Works immediately  
✅ **Real-time Updates** - Fresh job listings  
✅ **India-Focused** - Naukri, Indeed India, Foundit  
✅ **Smart Fallbacks** - Multiple sources ensure availability  
✅ **AI-Powered Search** - Natural language queries  
✅ **Category Detection** - Auto-categorizes fresher/internship/campus jobs  

## Limitations

- **Rate Limiting**: Job portals may rate-limit requests. The system handles this with fallbacks.
- **HTML Parsing**: Since these are free scrapers, HTML structure changes may affect parsing.
- **Limited Details**: Some job details may be minimal; users click through to the portal for full info.

## Troubleshooting

### No Jobs Returned

Check the server logs:
```bash
# Look for these messages:
Fetched X jobs from Indian job portals
Indeed India error: ...
Naukri fetch error: ...
```

### Slow Response Times

Indian job APIs are fetched in parallel. If one is slow:
- The system will timeout after 10 seconds
- Other sources will still return results
- Curated jobs are always available as fallback

## Future Enhancements

- [ ] Add LinkedIn Jobs scraper
- [ ] Add Freshersworld integration
- [ ] Implement caching layer (Redis)
- [ ] Add job alerts/notifications
- [ ] Support for more Indian job portals

## Support

For issues or questions:
- Check server logs: `npm run dev`
- Review `backend/utils/indianJobApis.js`
- Ensure network connectivity to job portals
