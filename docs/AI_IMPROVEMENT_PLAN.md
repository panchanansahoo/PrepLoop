# AI Interview Improvement Plan

## Overview

The AI Interview Improvement Plan feature analyzes completed interview sessions and generates personalized, actionable improvement plans to help users systematically address their weaknesses and improve interview performance.

## Features

### 1. Automated Weakness Analysis
- Analyzes performance metrics across multiple interview sessions
- Identifies top 3 weakness areas with intensity levels (high/medium/low)
- Tracks performance trends (improving/declining/stable)
- Considers 10 skill areas:
  - Communication
  - Problem Solving
  - Technical Depth
  - Complexity Analysis
  - Edge Case Handling
  - System Design
  - Behavioral Storytelling
  - Code Quality
  - Debugging
  - Confidence

### 2. Personalized Daily Plans
- Generates day-by-day improvement tasks
- Adapts task intensity based on weakness level
- Provides estimated time commitments (30-60 minutes/day)
- Focuses on top weakness areas with rotation

### 3. AI-Powered Recommendations
- Leverages Groq AI for intelligent recommendations
- Provides immediate actions, practice focus areas, and mindset tips
- Suggests relevant resources (courses, books, practice platforms)
- Falls back to heuristic recommendations if AI unavailable

### 4. Progress Tracking
- Track completed tasks
- Add notes and reflections
- Monitor improvement over time
- Set and achieve milestones

### 5. Milestone System
- Checkpoints at 33%, 66%, and 100% of plan duration
- Clear criteria for each milestone
- Helps maintain motivation and track progress

## API Endpoints

### Generate Improvement Plan
```http
POST /api/improvement-plan/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionIds": ["uuid1", "uuid2"],  // Optional: specific sessions to analyze
  "focusAreas": ["communication", "problem_solving"],  // Optional: specific areas to focus on
  "timeframe": 7  // Optional: plan duration in days (default: 7)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "plan-uuid",
    "user_id": "user-uuid",
    "plan_data": {
      "summary": "Based on your recent interviews...",
      "topWeaknesses": [
        {
          "area": "communication",
          "averageScore": 65,
          "weaknessLevel": 35,
          "intensity": "medium",
          "sampleSize": 5
        }
      ],
      "dailyPlan": [
        {
          "day": 1,
          "focusArea": "communication",
          "intensity": "medium",
          "tasks": [
            "Record yourself explaining a solution and review for clarity",
            "Practice the STAR method with 2 behavioral examples"
          ],
          "estimatedTime": 45,
          "goal": "Explain solutions clearly and concisely"
        }
      ],
      "recommendations": {
        "immediate_actions": [...],
        "practice_focus": [...],
        "mindset_tips": [...],
        "resources": [...]
      },
      "resources": [
        {
          "type": "article",
          "title": "How to Explain Technical Concepts",
          "url": "#"
        }
      ],
      "milestones": [
        {
          "day": 2,
          "title": "communication checkpoint",
          "description": "Assess improvement in communication",
          "criteria": [...]
        }
      ],
      "timeframe": 7,
      "overallTrend": "improving"
    },
    "session_ids": ["uuid1", "uuid2"],
    "status": "active",
    "progress": {
      "completedTasks": [],
      "lastUpdated": "2026-04-12T10:00:00Z"
    },
    "created_at": "2026-04-12T10:00:00Z",
    "updated_at": "2026-04-12T10:00:00Z"
  }
}
```

### Get Latest Plan
```http
GET /api/improvement-plan/latest
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "plan-uuid",
    "plan_data": { ... },
    "status": "active",
    "created_at": "2026-04-12T10:00:00Z"
  }
}
```

### Get Plan History
```http
GET /api/improvement-plan/history?limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan-uuid",
      "plan_data": { ... },
      "status": "completed",
      "created_at": "2026-04-05T10:00:00Z"
    }
  ]
}
```

### Update Plan Progress
```http
POST /api/improvement-plan/:planId/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "completedTasks": [
    { "day": 1, "taskIndex": 0, "completedAt": "2026-04-12T15:00:00Z" }
  ],
  "notes": "Completed first task, felt more confident explaining solutions"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "plan-uuid",
    "progress": {
      "completedTasks": [...],
      "lastUpdated": "2026-04-12T15:00:00Z",
      "notes": "..."
    },
    "updated_at": "2026-04-12T15:00:00Z"
  }
}
```

## Database Schema

```sql
CREATE TABLE improvement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  session_ids UUID[],
  status VARCHAR(20) DEFAULT 'active',
  progress JSONB DEFAULT '{"completedTasks": [], "lastUpdated": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

## Usage Examples

### Frontend Integration

```javascript
// Generate improvement plan
const generatePlan = async () => {
  const response = await fetch('/api/improvement-plan/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timeframe: 7,
      focusAreas: ['communication', 'problem_solving']
    })
  });
  
  const { data } = await response.json();
  return data;
};

// Get latest plan
const getLatestPlan = async () => {
  const response = await fetch('/api/improvement-plan/latest', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { data } = await response.json();
  return data;
};

// Update progress
const updateProgress = async (planId, completedTasks, notes) => {
  const response = await fetch(`/api/improvement-plan/${planId}/progress`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      completedTasks,
      notes
    })
  });
  
  const { data } = await response.json();
  return data;
};
```

### React Component Example

```jsx
import { useState, useEffect } from 'react';

function ImprovementPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestPlan();
  }, []);

  const fetchLatestPlan = async () => {
    try {
      const data = await getLatestPlan();
      setPlan(data);
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    setLoading(true);
    try {
      const data = await generatePlan();
      setPlan(data);
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!plan) return <button onClick={generateNewPlan}>Generate Plan</button>;

  return (
    <div>
      <h2>Your Improvement Plan</h2>
      <p>{plan.plan_data.summary}</p>
      
      <h3>Top Weaknesses</h3>
      {plan.plan_data.topWeaknesses.map(w => (
        <div key={w.area}>
          <strong>{w.area}</strong>: {w.weaknessLevel}% ({w.intensity})
        </div>
      ))}
      
      <h3>Daily Plan</h3>
      {plan.plan_data.dailyPlan.map(day => (
        <div key={day.day}>
          <h4>Day {day.day}: {day.focusArea}</h4>
          <ul>
            {day.tasks.map((task, i) => (
              <li key={i}>{task}</li>
            ))}
          </ul>
          <p>Estimated time: {day.estimatedTime} minutes</p>
        </div>
      ))}
    </div>
  );
}
```

## Best Practices

1. **Generate Plans After Multiple Interviews**: Wait until user has completed at least 3-5 interviews for accurate analysis

2. **Regular Updates**: Encourage users to update progress daily to maintain momentum

3. **Milestone Celebrations**: Celebrate when users reach milestones to maintain motivation

4. **Adaptive Plans**: Allow users to regenerate plans as they improve to focus on new areas

5. **Resource Integration**: Link resources directly to practice problems, courses, or articles

## Error Handling

```javascript
try {
  const plan = await generatePlan();
} catch (error) {
  if (error.message.includes('No interview sessions found')) {
    // Show message: "Complete at least one interview to generate a plan"
  } else if (error.message.includes('Failed to generate')) {
    // Show message: "Unable to generate plan. Please try again."
  } else {
    // Generic error handling
  }
}
```

## Performance Considerations

- Plans are generated on-demand, not automatically
- AI recommendations have fallback to heuristic-based recommendations
- Database queries are optimized with indexes on user_id and created_at
- Plan data is stored as JSONB for flexible querying

## Future Enhancements

1. **Automated Plan Generation**: Trigger plan generation after every N completed interviews
2. **Gamification**: Add points, badges, and streaks for completing daily tasks
3. **Social Features**: Share progress with peers or mentors
4. **Video Resources**: Integrate video tutorials for each skill area
5. **Practice Integration**: Link directly to relevant practice problems
6. **Adaptive Difficulty**: Adjust task difficulty based on progress
7. **Reminder System**: Send notifications for daily tasks
8. **Analytics Dashboard**: Visualize improvement over time with charts

## Migration

To apply the database migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute
psql -h <host> -U <user> -d <database> -f backend/db/migration_improvement_plans.sql
```

## Testing

```bash
# Run service tests
npm test backend/services/improvementPlanService.js

# Test API endpoints
npm run test:api improvement-plan
```

## Support

For issues or questions:
- Check the main documentation: `docs/README.md`
- Review API reference: `docs/BACKEND_API_QUICK_REFERENCE.md`
- Contact: support@preploop.com
