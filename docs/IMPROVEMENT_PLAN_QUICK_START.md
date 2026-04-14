# AI Interview Improvement Plan - Quick Start Guide

## Overview

The AI Interview Improvement Plan analyzes your completed interview sessions and generates personalized, actionable improvement plans to help you systematically improve your interview performance.

## Features

✅ **Automated Weakness Analysis** - Identifies your top 3 weakness areas  
✅ **Personalized Daily Plans** - Day-by-day improvement tasks  
✅ **AI-Powered Recommendations** - Intelligent suggestions from Groq AI  
✅ **Progress Tracking** - Track completed tasks and add notes  
✅ **Milestone System** - Checkpoints to maintain motivation  

## Quick Start

### 1. Import the API Functions

```javascript
import { improvementPlan } from '../api/aiService';
```

### 2. Generate a Plan

```javascript
// Generate a 7-day improvement plan
const plan = await improvementPlan.generate({ 
  timeframe: 7 
});

// Generate with specific focus areas
const focusedPlan = await improvementPlan.generate({
  timeframe: 7,
  focusAreas: ['communication', 'problem_solving']
});

// Generate based on specific interview sessions
const sessionPlan = await improvementPlan.generate({
  sessionIds: ['session-uuid-1', 'session-uuid-2'],
  timeframe: 7
});
```

### 3. Get Latest Plan

```javascript
const latestPlan = await improvementPlan.getLatest();

if (latestPlan) {
  console.log('Plan summary:', latestPlan.plan_data.summary);
  console.log('Top weaknesses:', latestPlan.plan_data.topWeaknesses);
  console.log('Daily plan:', latestPlan.plan_data.dailyPlan);
}
```

### 4. Track Progress

```javascript
// Mark a task as completed
const completedTask = {
  day: 1,
  taskIndex: 0,
  completedAt: new Date().toISOString()
};

const updatedPlan = await improvementPlan.updateProgress(
  planId,
  [completedTask],
  'Completed first task, felt more confident!'
);
```

### 5. View History

```javascript
// Get last 10 plans
const history = await improvementPlan.getHistory(10);

history.forEach(plan => {
  console.log(`Plan from ${plan.created_at}: ${plan.status}`);
});
```

## Using the React Component

### Basic Usage

```jsx
import ImprovementPlan from './components/ImprovementPlan';

function App() {
  return (
    <div>
      <ImprovementPlan />
    </div>
  );
}
```

### Add to Router

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ImprovementPlan from './components/ImprovementPlan';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/improvement-plan" element={<ImprovementPlan />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## API Response Structure

### Plan Object

```javascript
{
  id: "plan-uuid",
  user_id: "user-uuid",
  plan_data: {
    summary: "Based on your recent interviews...",
    topWeaknesses: [
      {
        area: "communication",
        averageScore: 65,
        weaknessLevel: 35,
        intensity: "medium",
        sampleSize: 5
      }
    ],
    dailyPlan: [
      {
        day: 1,
        focusArea: "communication",
        intensity: "medium",
        tasks: [
          "Record yourself explaining a solution",
          "Practice the STAR method"
        ],
        estimatedTime: 45,
        goal: "Explain solutions clearly"
      }
    ],
    recommendations: {
      immediate_actions: [...],
      practice_focus: [...],
      mindset_tips: [...],
      resources: [...]
    },
    milestones: [...],
    timeframe: 7,
    overallTrend: "improving"
  },
  status: "active",
  progress: {
    completedTasks: [],
    lastUpdated: "2026-04-12T10:00:00Z"
  },
  created_at: "2026-04-12T10:00:00Z"
}
```

## Skill Areas Analyzed

The system analyzes 10 skill areas:

1. **Communication** - Clarity and articulation
2. **Problem Solving** - Approach and methodology
3. **Technical Depth** - Fundamentals and knowledge
4. **Complexity Analysis** - Big O and optimization
5. **Edge Case Handling** - Defensive programming
6. **System Design** - Architecture and scalability
7. **Behavioral Storytelling** - STAR method
8. **Code Quality** - Readability and maintainability
9. **Debugging** - Systematic problem resolution
10. **Confidence** - Communication authority

## Best Practices

### 1. Complete Multiple Interviews First

Wait until you have at least 3-5 completed interviews for accurate analysis.

```javascript
// Check if user has enough interviews
const sessions = await getInterviewHistory();
if (sessions.length < 3) {
  alert('Complete at least 3 interviews for better analysis');
}
```

### 2. Update Progress Daily

Encourage users to mark tasks complete and add notes:

```javascript
const updateDaily = async (planId, day, taskIndex, notes) => {
  const task = {
    day,
    taskIndex,
    completedAt: new Date().toISOString()
  };
  
  await improvementPlan.updateProgress(planId, [task], notes);
};
```

### 3. Regenerate Plans as You Improve

After completing a plan, generate a new one to focus on new areas:

```javascript
// After 7 days
if (daysCompleted >= plan.plan_data.timeframe) {
  const newPlan = await improvementPlan.generate({ timeframe: 7 });
}
```

## Error Handling

```javascript
try {
  const plan = await improvementPlan.generate();
} catch (error) {
  if (error.message.includes('No interview sessions found')) {
    // Show: "Complete at least one interview to generate a plan"
  } else if (error.message.includes('Authentication required')) {
    // Redirect to login
  } else {
    // Generic error
    console.error('Failed to generate plan:', error);
  }
}
```

## Customization Examples

### Custom Timeframe

```javascript
// 14-day plan
const extendedPlan = await improvementPlan.generate({ timeframe: 14 });

// 3-day intensive plan
const intensivePlan = await improvementPlan.generate({ timeframe: 3 });
```

### Focus on Specific Areas

```javascript
// Focus only on communication and system design
const focusedPlan = await improvementPlan.generate({
  focusAreas: ['communication', 'system_design'],
  timeframe: 7
});
```

### Analyze Specific Sessions

```javascript
// Analyze only recent failed interviews
const recentSessions = sessions.filter(s => s.score < 70);
const sessionIds = recentSessions.map(s => s.id);

const targetedPlan = await improvementPlan.generate({
  sessionIds,
  timeframe: 7
});
```

## Integration with Other Features

### Link to Practice Problems

```javascript
// After viewing improvement plan, suggest relevant problems
const focusArea = plan.plan_data.topWeaknesses[0].area;
const problems = await fetchProblemsByCategory(focusArea);
```

### Track Progress in Dashboard

```javascript
// Show improvement plan progress in user dashboard
const plan = await improvementPlan.getLatest();
const completionRate = 
  (plan.progress.completedTasks.length / totalTasks) * 100;
```

### Notifications for Daily Tasks

```javascript
// Send reminder for today's tasks
const today = new Date().getDate();
const todaysPlan = plan.plan_data.dailyPlan.find(d => d.day === today);

if (todaysPlan) {
  showNotification(`Today's focus: ${todaysPlan.focusArea}`);
}
```

## Testing

### Test Plan Generation

```javascript
// Test with mock data
const mockPlan = await improvementPlan.generate({
  timeframe: 7
});

console.assert(mockPlan.plan_data.dailyPlan.length === 7);
console.assert(mockPlan.plan_data.topWeaknesses.length <= 3);
```

### Test Progress Updates

```javascript
// Test task completion
const task = { day: 1, taskIndex: 0, completedAt: new Date().toISOString() };
const updated = await improvementPlan.updateProgress(planId, [task]);

console.assert(updated.progress.completedTasks.length === 1);
```

## Troubleshooting

### Issue: "No interview sessions found"

**Solution**: User needs to complete at least one interview session.

```javascript
// Check interview count first
const sessions = await getInterviewHistory();
if (sessions.length === 0) {
  showMessage('Complete your first interview to generate a plan');
}
```

### Issue: Plan generation takes too long

**Solution**: AI recommendations have a 15-second timeout and fallback to heuristic recommendations.

```javascript
// The service automatically handles this
// No action needed from frontend
```

### Issue: Progress not saving

**Solution**: Ensure plan ID is correct and user is authenticated.

```javascript
// Verify plan ownership
const plan = await improvementPlan.getLatest();
if (plan && plan.id === planId) {
  await improvementPlan.updateProgress(planId, tasks, notes);
}
```

## Next Steps

1. ✅ Add the component to your app
2. ✅ Test with completed interview sessions
3. ✅ Customize styling to match your design
4. ✅ Add progress tracking notifications
5. ✅ Integrate with your dashboard

## Support

- Full Documentation: `docs/AI_IMPROVEMENT_PLAN.md`
- API Reference: `docs/BACKEND_API_QUICK_REFERENCE.md`
- Backend Service: `backend/services/improvementPlanService.js`
- Frontend API: `frontend/src/api/aiService.js`
