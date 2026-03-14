# Modern React Components Documentation

This document provides comprehensive overview of all modern React components created for the Preploop interview platform.

## 📋 Table of Contents

1. [ModernInterviewContainer](#moderninterviewcontainer)
2. [RealtimeFeedback](#realtimefeedback)
3. [AnalyticsDashboard](#analyticsdashboard)
4. [InterviewReplay](#interviewreplay)
5. [LearningPath](#learningpath)
6. [Integration Guide](#integration-guide)

---

## ModernInterviewContainer

### Purpose
Main interactive interview component that handles the complete interview flow from setup to completion.

### Features
- **Interview Type Selection**: Technical, Behavioral, System Design, Coding
- **Difficulty Selection**: Easy, Medium, Hard
- **Real-time Recording**: Audio/video recording capabilities
- **Live Feedback**: Integration with RealtimeFeedback component
- **Progress Tracking**: Visual progress bar and timer
- **Multiple States**: Intro, Recording, Completed

### Props
- None (uses internal state and API calls)

### Key Methods

#### `startInterview()`
Initiates interview with selected type and difficulty
```javascript
// Calls: POST /api/ai/interview/v2/start
```

#### `startRecording()` / `stopRecording()`
Handles microphone recording
- Uses Web Audio API for capturing audio
- Stores audio chunks for submission

#### `getRealtimeFeedback()`
Gets immediate feedback on current answer
```javascript
// Calls: POST /api/ai/interview/v2/feedback/realtime
```

#### `submitAnswer()`
Submits answer and fetches next question
```javascript
// Calls: POST /api/ai/interview/v2/next-question
```

#### `completeInterview()`
Finalizes interview and generates analysis
```javascript
// Calls: POST /api/ai/interview/v2/analysis/detailed
```

### State Variables
```javascript
{
  interviewState: 'intro' | 'recording' | 'answered' | 'completed',
  currentQuestion: Question,
  answers: Answer[],
  currentAnswer: string,
  realtimeFeedback: Feedback,
  isRecording: boolean,
  score: number,
  timer: number, // in seconds
  selectedType: string,
  selectedDifficulty: string
}
```

### Usage Example
```jsx
import ModernInterviewContainer from './components/ModernInterviewContainer';

function App() {
  return <ModernInterviewContainer />;
}
```

---

## RealtimeFeedback

### Purpose
Sidebar component displaying real-time feedback on user's answer quality during interview.

### Features
- **Quality Score**: Normalized 0-100 score with color coding
- **Strengths Display**: Highlights positive aspects
- **Areas for Improvement**: Lists gaps
- **Expert Tips**: Actionable suggestions
- **Audio Playback**: Text-to-speech feedback narration
- **Similar Questions**: Progression recommendations

### Props
```typescript
interface Props {
  feedback: {
    quality_score: number,        // 0-100
    structure_score?: number,     // 0-100
    strengths: string[],
    areas_for_improvement: string[],
    suggestion: string,
    similar_questions: string[],
    [key: string]: any
  } | null
}
```

### Key Methods

#### `getScoreColor(score)`
Returns Tailwind color class based on score
- Green (≥80), Yellow (≥60), Red (<60)

#### `playFeedback()`
Uses Web Speech API to narrate feedback

### Usage Example
```jsx
import RealtimeFeedback from './components/RealtimeFeedback';

function InterviewSidebar() {
  return <RealtimeFeedback feedback={feedbackData} />;
}
```

---

## AnalyticsDashboard

### Purpose
Comprehensive dashboard showing interview performance metrics, trends, and insights.

### Features
- **Performance Trends**: Line chart showing score progression
- **Category Breakdown**: Scores by question type
- **Difficulty Distribution**: Pie chart of difficulty levels
- **Key Metrics Cards**: Average score, interviews completed, improvement %, streak
- **Strengths & Weaknesses**: Categorized visualizations
- **Personalized Recommendations**: AI-driven next steps

### Props
- None (fetches data directly from API)

### State Variables
```javascript
{
  analyticsData: AnalyticsData,
  loading: boolean,
  timeRange: 'week' | 'month' | 'all'
}
```

### API Endpoints Used
```
GET /api/ai/analytics/dashboard?range={timeRange}
```

### Data Structure
```typescript
interface AnalyticsData {
  average_score: number,
  total_interviews: number,
  improvement_percentage: number,
  current_streak: number,
  performance_trend: Array<{ date: string, score: number }>,
  question_type_scores: Array<{ type: string, score: number }>,
  difficulty_distribution: Array<{ name: string, value: number }>,
  category_scores: Array<{ name: string, score: number }>,
  top_strengths: Array<{ name: string, score: number }>,
  areas_to_improve: Array<{ name: string, score: number }>,
  recommendations: Array<{
    title: string,
    description: string,
    action_url?: string
  }>
}
```

### Chart Components
Uses Recharts library for visualizations:
- `LineChart`: Performance trends
- `BarChart`: Category/Type breakdown
- `PieChart`: Difficulty distribution

### Usage Example
```jsx
import AnalyticsDashboard from './components/AnalyticsDashboard';

function Dashboard() {
  return <AnalyticsDashboard />;
}
```

---

## InterviewReplay

### Purpose
Allows users to review past interviews with detailed Q&A playback, audio playback, and sharing features.

### Features
- **Interview List View**: Sortable list of past interviews
- **Detailed Replay View**: Full review of questions, answers, and feedback
- **Score Display**: Visual score representation with breakdown
- **Audio Playback**: Re-listen to recorded answers
- **Performance Metrics**: Communication, Technical, Problem-Solving, Confidence scores
- **Download/Share**: Export or share interview results
- **Feedback Review**: See historical feedback and strengths/areas

### Props
- None (manages own state)

### State Variables
```javascript
{
  interviews: Interview[],
  selectedInterview: Interview | null,
  isPlaying: boolean,
  loading: boolean,
  sortBy: 'recent' | 'score' | 'oldest'
}
```

### API Endpoints Used
```
GET /api/interviews?sort={sortBy}
GET /api/interviews/{interviewId}/download
```

### Data Structure
```typescript
interface Interview {
  id: string,
  type: string,
  difficulty: string,
  created_at: Date,
  duration: number, // minutes
  score: number,
  communication_score: number,
  technical_score: number,
  problem_solving_score: number,
  confidence_score: number,
  improvement: number, // percentage
  questions: Array<{
    question: string,
    answer: string,
    score: number,
    feedback: string,
    audio_url?: string
  }>,
  strengths: string[],
  areas_to_improve: string[]
}
```

### Key Methods

#### `downloadInterview(interviewId)`
Triggers download of interview PDF/report

#### `shareInterview(interview)`
Uses Web Share API or clipboard for sharing results

### Usage Example
```jsx
import InterviewReplay from './components/InterviewReplay';

function ReplayPage() {
  return <InterviewReplay />;
}
```

---

## LearningPath

### Purpose
Displays personalized learning paths based on interview performance with module tracking and recommendations.

### Features
- **Multiple Paths**: Choose between different learning tracks
- **Module Tracking**: Visual progress indicators
- **Lesson Details**: Expandable lessons with descriptions
- **Progress Tracking**: Overall and per-module progress
- **Recommendations**: AI-suggested next steps
- **Statistics**: Learning stats and achievements

### Props
- None (fetches personalized data)

### State Variables
```javascript
{
  learningPath: LearningPath,
  selectedPath: Path | null,
  loading: boolean,
  expandedTopic: number | null
}
```

### API Endpoints Used
```
GET /api/ai/learning-path/personalized
```

### Data Structure
```typescript
interface LearningPath {
  paths: Array<{
    id: string,
    name: string,
    icon: string,
    duration: string,
    progress: number,
    description: string,
    total_hours: number,
    difficulty: string,
    modules: Array<{
      id: string,
      title: string,
      lessons: number,
      duration: number,
      progress: number,
      completed: boolean,
      in_progress: boolean,
      recommendation: string,
      lessons_list: Array<{
        title: string,
        description: string,
        duration: number,
        completed: boolean,
        resource_type: string
      }>
    }>
  }>,
  recommendations: Array<{
    title: string,
    description: string
  }>,
  total_modules_completed: number,
  total_hours_learned: number,
  current_streak: number,
  average_score: number
}
```

### Key Methods

#### `startTopic(topicId)`
Navigates to learning module
```javascript
window.location.href = `/learn/${topicId}`;
```

### Usage Example
```jsx
import LearningPath from './components/LearningPath';

function LearningPage() {
  return <LearningPath />;
}
```

---

## Integration Guide

### Setup Instructions

1. **Install Dependencies**
```bash
npm install recharts lucide-react
```

2. **Add to Router**
```jsx
import { Routes, Route } from 'react-router-dom';
import ModernInterviewContainer from './components/ModernInterviewContainer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import InterviewReplay from './components/InterviewReplay';
import LearningPath from './components/LearningPath';

function App() {
  return (
    <Routes>
      <Route path="/interview" element={<ModernInterviewContainer />} />
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      <Route path="/replay" element={<InterviewReplay />} />
      <Route path="/learning-path" element={<LearningPath />} />
    </Routes>
  );
}
```

3. **API Integration**
All components expect backend endpoints at:
- `/api/ai/interview/v2/*` - Interview endpoints
- `/api/ai/analytics/dashboard` - Analytics data
- `/api/interviews` - Interview history
- `/api/ai/learning-path/personalized` - Learning path

### Environment Configuration

Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
```

### Error Handling

Each component includes basic error handling. For production, add:

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ModernInterviewContainer />
    </ErrorBoundary>
  );
}
```

### Performance Optimization

1. **Code Splitting**
```jsx
import { lazy, Suspense } from 'react';

const ModernInterview = lazy(() => import('./components/ModernInterviewContainer'));

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <ModernInterview />
    </Suspense>
  );
}
```

2. **Memoization**
```jsx
const RealtimeFeedback = React.memo(({ feedback }) => {
  // Component code
});
```

3. **API Caching**
Implement React Query for better state management:
```jsx
import { useQuery } from '@tanstack/react-query';

const { data: analytics } = useQuery({
  queryKey: ['analytics', timeRange],
  queryFn: () => fetch(`/api/ai/analytics/dashboard?range=${timeRange}`)
});
```

---

## Styling

All components use Tailwind CSS v3 classes. Ensure `tailwind.config.js` includes:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors if needed
      }
    }
  }
}
```

---

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (except some audio features)
- Mobile: ✅ Responsive design

---

## Accessibility (a11y)

All components follow WCAG 2.1 guidelines:
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast compliance
- Screen reader friendly

---

## Testing

Example test cases:

```jsx
import { render, screen } from '@testing-library/react';
import ModernInterviewContainer from './ModernInterviewContainer';

test('renders interview setup screen', () => {
  render(<ModernInterviewContainer />);
  expect(screen.getByText(/Modern AI Interview/i)).toBeInTheDocument();
});

test('starts interview on button click', () => {
  render(<ModernInterviewContainer />);
  const startButton = screen.getByText(/Start Interview/i);
  fireEvent.click(startButton);
  // Assert state changed
});
```

---

## Troubleshooting

### Common Issues

1. **Microphone not working**
   - Check browser permissions
   - Ensure HTTPS or localhost
   - Verify getUserMedia support

2. **Charts not rendering**
   - Check Recharts installation
   - Verify responsive container parent has height

3. **API timeout errors**
   - Check backend is running
   - Verify CORS configuration
   - Increase timeout in settings

---

## Future Enhancements

1. **Video Recording**: Add video support alongside audio
2. **Real-time Transcription**: Integrate speech-to-text API
3. **AI Coach**: Add interactive AI coaching during interviews
4. **Cross-device Sync**: Cloud sync across devices
5. **Social Features**: Leaderboards and peer comparison
6. **Advanced Analytics**: ML-powered insight generation

---

## License

This code is part of the Preploop platform. All rights reserved.

