# Skill-Match Live Job Recommendations

## Overview

The Skill-Match Live Job Recommendations feature provides personalized job recommendations on the professional dashboard based on the user's profile skills and experience. Jobs are automatically matched and scored, with live updates every 5 minutes.

## Features

- **Automatic Skill Matching**: Analyzes user profile skills and matches them against job descriptions
- **Match Score**: Each job displays a percentage match score based on skill overlap
- **Live Updates**: Automatically refreshes job listings every 5 minutes
- **Manual Refresh**: Users can manually refresh to get the latest jobs
- **Matched Skills Display**: Shows which of the user's skills match each job
- **Direct Apply Links**: One-click access to job application pages

## Architecture

### Backend Endpoint

**Route**: `GET /api/jobs/skill-match`

**Authentication**: Required (uses `authenticateToken` middleware)

**Response**:
```json
{
  "jobs": [
    {
      "id": "string",
      "title": "string",
      "company": "string",
      "location": "string",
      "salary_range": "string",
      "description": "string",
      "apply_link": "string",
      "matchScore": 85,
      "matchedSkills": ["React", "Node.js", "Python"]
    }
  ],
  "userSkills": ["React", "Node.js", "Python", "AWS"],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Frontend Component

**Component**: `SkillMatchJobs.jsx`

**Location**: `frontend/src/components/SkillMatchJobs.jsx`

**Features**:
- Auto-polling every 5 minutes
- Manual refresh button
- Loading states
- Empty state when no jobs found
- Responsive card layout
- Match score badges
- Skill tags display

### Dashboard Integration

The widget is registered in the Dashboard's `WIDGET_REGISTRY`:

```javascript
{
  id: 'skillMatchJobs',
  name: 'Skill-Matched Jobs',
  component: SkillMatchJobs,
  defaultVisible: true,
  premium: false,
  layout: 'full',
  description: 'Live job recommendations based on your skills'
}
```

## How It Works

1. **Profile Analysis**: Backend fetches user's skills and experience from the `profiles` table
2. **Query Building**: Creates a search query from user's experience summary or top 3 skills
3. **Job Fetching**: Retrieves jobs from external APIs (Indian job portals, JSearch, Adzuna, Remotive)
4. **Skill Matching**: Compares user skills against job descriptions and requirements
5. **Score Calculation**: Calculates match percentage: `(matched_skills / total_user_skills) * 100`
6. **Sorting**: Jobs are sorted by match score (highest first)
7. **Display**: Top 5 jobs are displayed in the dashboard widget

## User Experience

### Initial Load
- Widget shows loading spinner with "Finding jobs that match your skills..." message
- Fetches jobs based on user profile

### Job Cards Display
Each job card shows:
- Job title and company
- Match score badge (green, percentage)
- Location and salary range
- Up to 3 matched skills as tags
- "Apply Now" button with external link icon

**Note**: Only the top 3 highest-matching jobs are displayed on the dashboard.

### Empty State
If no jobs are found:
- Briefcase icon
- Message: "No matching jobs found. Complete your profile to get better matches."

### Live Updates
- Auto-refreshes every 5 minutes
- Shows last update timestamp at bottom
- Manual refresh button in header

## Configuration

### Polling Interval
Default: 5 minutes (300,000ms)

To change, modify in `SkillMatchJobs.jsx`:
```javascript
const interval = setInterval(fetchMatchedJobs, 5 * 60 * 1000);
```

### Number of Jobs Displayed
Default: 3 jobs

To change, modify in `SkillMatchJobs.jsx`:
```javascript
{jobs.slice(0, 3).map((job) => (
```

### Match Score Threshold
Currently no threshold - all jobs are shown. To add a minimum threshold:

```javascript
const matchedJobs = jobs
  .map(job => { /* ... */ })
  .filter(job => job.matchScore >= 50); // Only show 50%+ matches
```

## Customization

Users can:
- Toggle the widget on/off via Dashboard Customize panel
- Manually refresh jobs
- Click through to apply directly

## Dependencies

### Backend
- `supabaseAdmin` - Profile data access
- `fetchExternalJobs()` - Job fetching from external APIs
- `authenticateToken` - User authentication

### Frontend
- `useAuth` - User context
- `buildAuthHeaders` - API authentication
- Lucide React icons

## Future Enhancements

1. **Advanced Filtering**: Allow users to filter by location, salary, job type
2. **Save Jobs**: Bookmark jobs for later
3. **Application Tracking**: Track which jobs user has applied to
4. **Email Notifications**: Alert users when new high-match jobs are found
5. **AI-Powered Descriptions**: Use AI to explain why a job is a good match
6. **Skill Gap Analysis**: Show which skills to learn for better matches
7. **Company Insights**: Display company ratings and reviews

## Troubleshooting

### No Jobs Showing
- Ensure user has completed their profile with skills
- Check if external job APIs are responding
- Verify user authentication token is valid

### Low Match Scores
- User should add more relevant skills to their profile
- Skills should match industry standard terms (e.g., "React" not "React.js")

### Slow Loading
- Check network connection
- Verify external API response times
- Consider implementing caching layer

## API Rate Limits

The feature respects existing job API rate limits:
- 10 requests per minute per user (enforced by `checkRateLimit`)
- Cached results for 10 minutes
- Automatic fallback to curated jobs if APIs fail
