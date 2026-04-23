# AI Interview Improvement Plan - Quick Start Guide

## For Backend Developers

### 1. Apply Database Migration

```bash
# Using Supabase CLI
cd backend
supabase db push

# Or manually with psql
psql -h your-host -U your-user -d your-database -f db/migration_improvement_plans.sql
```

### 2. Verify Installation

```bash
# Test the service
node backend/scripts/testImprovementPlan.js

# Expected output:
# ✅ All tests passed!
```

### 3. Start the Server

```bash
# From project root
npm run dev

# Server should log:
# 📦 Loading routes...
# ✅ Routes loaded successfully
# 🚀 Server running on http://localhost:5000
```

### 4. Test API Endpoints

```bash
# Generate a plan (requires auth token)
curl -X POST http://localhost:5000/api/improvement-plan/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timeframe": 7,
    "focusAreas": ["communication", "problem_solving"]
  }'

# Get latest plan
curl http://localhost:5000/api/improvement-plan/latest \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get plan history
curl http://localhost:5000/api/improvement-plan/history?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## For Frontend Developers

### 1. Create API Service

```javascript
// src/api/improvementPlan.js
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL;

export const improvementPlanAPI = {
  async generate(options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/improvement-plan/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    return response.json();
  },

  async getLatest() {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/improvement-plan/latest`, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    });
    return response.json();
  },

  async getHistory(limit = 10) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${API_URL}/api/improvement-plan/history?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      }
    );
    return response.json();
  },

  async updateProgress(planId, completedTasks, notes) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${API_URL}/api/improvement-plan/${planId}/progress`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completedTasks, notes })
      }
    );
    return response.json();
  }
};
```

### 2. Create React Component

```jsx
// src/pages/ImprovementPlan.jsx
import { useState, useEffect } from 'react';
import { improvementPlanAPI } from '../api/improvementPlan';

export default function ImprovementPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadLatestPlan();
  }, []);

  const loadLatestPlan = async () => {
    try {
      const { data } = await improvementPlanAPI.getLatest();
      setPlan(data);
    } catch (error) {
      console.error('Failed to load plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    setGenerating(true);
    try {
      const { data } = await improvementPlanAPI.generate({
        timeframe: 7
      });
      setPlan(data);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!plan) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          AI Interview Improvement Plan
        </h1>
        <p className="mb-4">
          Generate a personalized improvement plan based on your interview performance.
        </p>
        <button
          onClick={generateNewPlan}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>
    );
  }

  const { plan_data } = plan;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Improvement Plan</h1>
      
      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-gray-700">{plan_data.summary}</p>
      </div>

      {/* Top Weaknesses */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Top Areas to Improve</h2>
        <div className="grid gap-4">
          {plan_data.topWeaknesses.map((weakness) => (
            <div
              key={weakness.area}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold capitalize">
                  {weakness.area.replace(/_/g, ' ')}
                </h3>
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    weakness.intensity === 'high'
                      ? 'bg-red-100 text-red-800'
                      : weakness.intensity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {weakness.intensity}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${weakness.averageScore}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {weakness.averageScore}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Plan */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Daily Plan</h2>
        <div className="space-y-4">
          {plan_data.dailyPlan.map((day) => (
            <div
              key={day.day}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">Day {day.day}</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    Focus: {day.focusArea.replace(/_/g, ' ')}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  ~{day.estimatedTime} min
                </span>
              </div>
              <ul className="space-y-2">
                {day.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      id={`task-${day.day}-${i}`}
                    />
                    <label
                      htmlFor={`task-${day.day}-${i}`}
                      className="text-sm"
                    >
                      {task}
                    </label>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-600 mt-3 italic">
                Goal: {day.goal}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      {plan_data.recommendations && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Recommendations</h2>
          <div className="grid gap-4">
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-semibold mb-2">Immediate Actions</h3>
              <ul className="list-disc list-inside space-y-1">
                {plan_data.recommendations.immediate_actions?.map((action, i) => (
                  <li key={i} className="text-sm">{action}</li>
                ))}
              </ul>
            </div>
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-semibold mb-2">Practice Focus</h3>
              <ul className="list-disc list-inside space-y-1">
                {plan_data.recommendations.practice_focus?.map((focus, i) => (
                  <li key={i} className="text-sm">{focus}</li>
                ))}
              </ul>
            </div>
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-semibold mb-2">Mindset Tips</h3>
              <ul className="list-disc list-inside space-y-1">
                {plan_data.recommendations.mindset_tips?.map((tip, i) => (
                  <li key={i} className="text-sm">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Generate New Plan Button */}
      <button
        onClick={generateNewPlan}
        disabled={generating}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {generating ? 'Generating...' : 'Generate New Plan'}
      </button>
    </div>
  );
}
```

### 3. Add Route

```jsx
// src/App.jsx or router config
import ImprovementPlan from './pages/ImprovementPlan';

// Add to your routes
<Route path="/improvement-plan" element={<ImprovementPlan />} />
```

## Common Issues & Solutions

### Issue: "No interview sessions found"
**Solution**: User needs to complete at least one interview before generating a plan.

```javascript
// Add check before generating
const { data: sessions } = await supabase
  .from('interview_sessions')
  .select('id')
  .eq('user_id', userId)
  .eq('status', 'completed');

if (sessions.length === 0) {
  alert('Complete at least one interview to generate a plan');
  return;
}
```

### Issue: AI recommendations failing
**Solution**: The system automatically falls back to heuristic recommendations. Check logs for AI service errors.

```javascript
// Check if AI is available
if (!process.env.GROQ_API_KEY) {
  console.warn('Groq API key not configured, using fallback recommendations');
}
```

### Issue: Slow plan generation
**Solution**: Plan generation can take 5-15 seconds due to AI processing. Show loading state.

```jsx
{generating && (
  <div className="flex items-center gap-2">
    <Spinner />
    <span>Analyzing your interviews...</span>
  </div>
)}
```

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Backend server starts without errors
- [ ] API endpoints respond correctly
- [ ] Authentication works properly
- [ ] Plans generate with valid data
- [ ] Progress updates save correctly
- [ ] Frontend displays plans correctly
- [ ] Loading states work properly
- [ ] Error handling works as expected

## Next Steps

1. **Customize UI**: Adapt the component to match your design system
2. **Add Analytics**: Track plan generation and completion rates
3. **Implement Notifications**: Remind users about daily tasks
4. **Add Gamification**: Points, badges, or streaks for motivation
5. **Integrate Practice**: Link tasks to actual practice problems

## Support

- Documentation: `docs/AI_IMPROVEMENT_PLAN.md`
- Implementation Summary: `AI_IMPROVEMENT_PLAN_IMPLEMENTATION.md`
- API Reference: `docs/BACKEND_API_QUICK_REFERENCE.md`

## Resources

- Groq AI Documentation: https://console.groq.com/docs
- Supabase Documentation: https://supabase.com/docs
- React Documentation: https://react.dev
