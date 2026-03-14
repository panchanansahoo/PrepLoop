# Modern Interview Components - Integration Guide

This guide explains how to integrate the modern React interview components into your existing Preploop application.

## 📁 Components Created

Five new modern components have been created in `src/components/`:

1. **ModernInterviewContainer.jsx** - Main interview execution interface
2. **RealtimeFeedback.jsx** - Real-time feedback sidebar
3. **AnalyticsDashboard.jsx** - Comprehensive analytics dashboard
4. **InterviewReplay.jsx** - Interview history and replay viewer
5. **LearningPath.jsx** - Personalized learning path builder

## 🔧 Integration Steps

### Step 1: Install Required Dependencies

If not already installed, add these packages:

```bash
npm install recharts lucide-react react-router-dom
```

Verify these are in your `package.json`:
```json
{
  "dependencies": {
    "recharts": "^2.12.0",
    "lucide-react": "^0.408.0",
    "react-router-dom": "^6.0.0"
  }
}
```

### Step 2: Add Routes to App.jsx

Add these import statements at the top of your existing `App.jsx`:

```jsx
// Modern interview components
import ModernInterviewContainer from './components/ModernInterviewContainer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import InterviewReplay from './components/InterviewReplay';
import LearningPath from './components/LearningPath';
```

### Step 3: Add New Routes

Add these routes to your existing Routes component in `App.jsx`:

```jsx
<Routes>
  {/* Existing routes... */}
  
  {/* Modern Interview Routes */}
  <Route
    path="/modern-interview"
    element={<PrivateRoute><ModernInterviewContainer /></PrivateRoute>}
  />
  <Route
    path="/interview-analytics"
    element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>}
  />
  <Route
    path="/interview-replay"
    element={<PrivateRoute><InterviewReplay /></PrivateRoute>}
  />
  <Route
    path="/personalized-learning"
    element={<PrivateRoute><LearningPath /></PrivateRoute>}
  />
  
  {/* Rest of existing routes... */}
</Routes>
```

### Step 4: Update Navigation (Sidebar/Navbar)

Add links to the new components in your `Sidebar.jsx` or `Navbar.jsx`:

```jsx
// In Sidebar component
const navItems = [
  // ... existing items
  {
    icon: <Mic size={20} />,
    label: 'Interview',
    path: '/modern-interview',
  },
  {
    icon: <BarChart3 size={20} />,
    label: 'Analytics',
    path: '/interview-analytics',
  },
  {
    icon: <History size={20} />,
    label: 'Interview History',
    path: '/interview-replay',
  },
  {
    icon: <BookOpen size={20} />,
    label: 'Learning Path',
    path: '/personalized-learning',
  },
];
```

### Step 5: Configure API Base URL

Create or update `.env.local`:

```
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
```

In your components, use this helper:

```jsx
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Usage in fetch calls
fetch(`${API_BASE}/api/ai/interview/v2/start`, {
  method: 'POST',
  // ...
})
```

## 🔌 Backend API Endpoints Required

Ensure your backend has these endpoints:

### Interview Endpoints
```
POST /api/ai/interview/v2/start
POST /api/ai/interview/v2/feedback/realtime
POST /api/ai/interview/v2/next-question
POST /api/ai/interview/v2/analysis/detailed
GET  /api/ai/interview/v2/{interviewId}
```

### Analytics Endpoints
```
GET /api/ai/analytics/dashboard?range={timeRange}
GET /api/ai/analytics/performance-trend
```

### Interview History Endpoints
```
GET  /api/interviews?sort={sortBy}
GET  /api/interviews/{interviewId}
POST /api/interviews/{interviewId}/download
```

### Learning Path Endpoints
```
GET /api/ai/learning-path/personalized
GET /api/ai/learning-path/{pathId}
```

## 📊 Expected Backend Response Formats

### Interview Start Response
```json
{
  "interviewId": "uuid",
  "type": "technical",
  "difficulty": "medium",
  "question": "...",
  "estimatedDuration": 30
}
```

### Feedback Response
```json
{
  "quality_score": 78,
  "structure_score": 82,
  "strengths": ["Clear explanation", "Good technical knowledge"],
  "areas_for_improvement": ["Speak more slowly"],
  "suggestion": "Practice explaining concepts step by step",
  "similar_questions": ["Question about X", "Question about Y"]
}
```

### Analytics Response
```json
{
  "average_score": 75.5,
  "total_interviews": 12,
  "improvement_percentage": 15,
  "current_streak": 5,
  "performance_trend": [...],
  "question_type_scores": [...],
  "category_scores": [...],
  "recommendations": [...]
}
```

## 🎨 Styling Configuration

Ensure your `tailwind.config.js` includes:

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          600: '#4f46e5',
          700: '#4338ca',
        }
      }
    }
  },
  plugins: [],
}
```

## 🧪 Testing Integration

### Test 1: Import Check
```jsx
// In browser console or test file
import ModernInterviewContainer from './components/ModernInterviewContainer';
console.log('Component imported:', ModernInterviewContainer);
```

### Test 2: Route Navigation
1. Navigate to `/modern-interview`
2. Verify component renders without errors
3. Check browser console for API call attempts

### Test 3: Backend Connection
```bash
# Terminal
curl -X POST http://localhost:5000/api/ai/interview/v2/start \
  -H "Content-Type: application/json" \
  -d '{"type":"technical","difficulty":"medium"}'
```

## 📝 Common Integration Issues & Solutions

### Issue 1: Module Not Found Errors
**Solution**: Verify component files exist in `src/components/` directory
```bash
ls src/components/ | grep -E "(Modern|Replay|Analytics|Learning|Realtime)"
```

### Issue 2: API Calls Failing
**Solution**: 
- Check backend is running: `curl http://localhost:5000/health`
- Verify CORS headers in backend
- Check API endpoints match exactly

### Issue 3: Tailwind Classes Not Applying
**Solution**:
- Rebuild Tailwind CSS: `npm run dev`
- Check `tailwind.config.js` includes component files
- Clear browser cache (Ctrl+Shift+Delete)

### Issue 4: Audio Recording Not Working
**Solution**:
- Use HTTPS or localhost (required by browser)
- Check browser permissions for microphone
- Test in Chrome/Firefox (Safari has limitations)

## 🚀 Performance Optimization

### Code Splitting
```jsx
import { lazy, Suspense } from 'react';

const ModernInterview = lazy(() => import('./components/ModernInterviewContainer'));

function Routes() {
  return (
    <Suspense fallback={<Loader />}>
      <Route path="/modern-interview" element={<ModernInterview />} />
    </Suspense>
  );
}
```

### React Query Integration
```jsx
import { useQuery } from '@tanstack/react-query';

// In components
const { data: analytics } = useQuery({
  queryKey: ['analytics', timeRange],
  queryFn: () => fetch(`${API_BASE}/api/ai/analytics/dashboard`).then(r => r.json())
});
```

## 🔐 Authentication Integration

Add auth headers to all API calls:

```jsx
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Usage
const response = await fetchWithAuth(`${API_BASE}/api/ai/interview/v2/start`, {
  method: 'POST',
  body: JSON.stringify({ type: 'technical', difficulty: 'medium' })
});
```

## 📱 Mobile Responsive Testing

Test on these viewport sizes:
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1024px+

Components use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`

## 🔗 Additional Resources

1. **Component Documentation**: See `COMPONENTS_DOCUMENTATION.md`
2. **Backend Setup**: Refer to backend README
3. **Tailwind CSS**: https://tailwindcss.com/
4. **Recharts**: https://recharts.org/
5. **React Router**: https://reactrouter.com/

## 📞 Support & Troubleshooting

For issues:
1. Check browser console (F12 → Console tab)
2. Review network tab for API errors
3. Verify backend is running and accessible
4. Check component imports match file names exactly

## ✅ Verification Checklist

- [ ] All 5 component files copied to `src/components/`
- [ ] Dependencies installed (`recharts`, `lucide-react`)
- [ ] Routes added to App.jsx
- [ ] Navigation links added to Sidebar/Navbar
- [ ] Environment variables configured
- [ ] Backend endpoints verified
- [ ] API base URL configured
- [ ] Components render without errors
- [ ] API calls are being made (check Network tab)
- [ ] Audio recording works (if browser supports)

## 🎉 You're All Set!

Once all steps are complete, your modern interview components are ready to use!

Access them via:
- Interview: `/modern-interview`
- Analytics: `/interview-analytics`
- Replay: `/interview-replay`
- Learning: `/personalized-learning`

