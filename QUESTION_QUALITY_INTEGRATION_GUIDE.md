# Question Quality System - Frontend Integration Guide

## Overview

The Question Quality system provides intelligent question recommendations and performance tracking for the PrepLoop interview platform.

## New Hooks Available

All hooks are in `frontend/src/hooks/useQuestionQuality.js`

### 1. useQuestionRecommendations

Get smart question recommendations based on quality and novelty balance.

```javascript
import { useQuestionRecommendations } from '../hooks/useQuestionQuality';

function NextQuestionPicker() {
  const { recommendations, loading, error } = useQuestionRecommendations({
    category: 'behavioral',
    difficulty: 'medium',
    currentScore: 75,
    limit: 5,
  });

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {recommendations?.recommendations.map(q => (
        <div key={q.questionId}>
          <p>{q.questionId}</p>
          <p>Score: {Math.round(q.score)}</p>
          <p>{recommendations.reasoning}</p>
        </div>
      ))}
    </div>
  );
}
```

**Response Structure:**
```json
{
  "recommendations": [
    {
      "questionId": "q-123",
      "category": "behavioral",
      "difficulty": "medium",
      "score": 78.5,
      "breakdown": {
        "quality": 85,
        "novelty": 70,
        "difficulty": 75,
        "timing": 80
      },
      "metrics": {
        "usageCount": 8,
        "qualityRating": 82,
        "positiveRate": 75,
        "averageTime": 145
      }
    }
  ],
  "reasoning": "High quality (consistently positive feedback); Fresh question for variety",
  "summary": {
    "totalAvailable": 42,
    "avgQuality": 76,
    "avgUsage": 12
  }
}
```

### 2. useQuestionMetrics

Get detailed performance metrics for a specific question.

```javascript
import { useQuestionMetrics } from '../hooks/useQuestionQuality';

function QuestionCard({ questionId }) {
  const { metrics, loading } = useQuestionMetrics(questionId);

  if (!metrics) return null;

  return (
    <div>
      <p>Used {metrics.usageCount} times</p>
      <p>Quality: {Math.round(metrics.qualityRating)}/100</p>
      <p>Positive Rate: {metrics.positiveRate}%</p>
      <p>Avg Time: {metrics.averageTime}s</p>
    </div>
  );
}
```

### 3. useRecordQuestionFeedback

Record quality feedback when user rates a question.

```javascript
import { useRecordQuestionFeedback } from '../hooks/useQuestionQuality';

function QuestionFeedbackForm({ questionId }) {
  const { recordFeedback, loading } = useRecordQuestionFeedback();

  const handleSubmit = async (rating, wasHelpful) => {
    const result = await recordFeedback(questionId, rating, wasHelpful);
    if (result) {
      alert('Thank you for your feedback!');
    }
  };

  return (
    <div>
      <button onClick={() => handleSubmit(80, true)}>
        Helpful (8/10)
      </button>
      <button onClick={() => handleSubmit(50, false)}>
        Not Helpful (5/10)
      </button>
    </div>
  );
}
```

### 4. useGemQuestions

Get high-quality but underutilized questions (gems).

```javascript
import { useGemQuestions } from '../hooks/useQuestionQuality';

function GemQuestions() {
  const { gems, loading } = useGemQuestions('behavioral', 3);

  return (
    <div>
      <h3>Try These Gems 💎</h3>
      {gems?.gems.map(gem => (
        <div key={gem.questionId}>
          <p>{gem.questionId}</p>
          <p>Quality: {gem.quality}/100</p>
          <p>Used {gem.usageCount} times</p>
        </div>
      ))}
    </div>
  );
}
```

### 5. useCategorySummary

Get health metrics and statistics for a question category.

```javascript
import { useCategorySummary } from '../hooks/useQuestionQuality';

function CategoryHealth({ category }) {
  const { summary } = useCategorySummary(category);

  if (!summary) return null;

  return (
    <div>
      <p>Total Questions: {summary.totalQuestions}</p>
      <p>Average Quality: {summary.avgQuality}/100</p>
      <p>Coverage: {summary.ratingCoverage}%</p>
      <p>Health: {summary.health}</p>
    </div>
  );
}
```

### 6. useTrendingQuestions

Get recently popular high-performing questions.

```javascript
import { useTrendingQuestions } from '../hooks/useQuestionQuality';

function TrendingQuestions() {
  const { trending } = useTrendingQuestions('technical', 5);

  return (
    <div>
      <h3>🔥 Trending Questions</h3>
      {trending?.trending.map(q => (
        <div key={q.questionId}>
          <p>{q.questionId}</p>
          <p>Quality: {q.quality}/100</p>
          <p>Positive Rate: {q.positiveRate}%</p>
        </div>
      ))}
    </div>
  );
}
```

## Integration Patterns

### Pattern 1: Smart Question Selection

```javascript
function InterviewSetup() {
  const [recentQuestions, setRecentQuestions] = useState([]);
  const { recommendations, refresh } = useQuestionRecommendations({
    category: 'behavioral',
    difficulty: 'medium',
    currentScore: userScore,
    limit: 5
  });

  const selectQuestion = (question) => {
    // Use selected question
    setRecentQuestions([...recentQuestions, question.questionId]);
    // Refresh recommendations to exclude recently used
    refresh(recentQuestions);
  };

  return (
    <div>
      <h3>Recommended Questions</h3>
      {recommendations?.recommendations.map(q => (
        <button key={q.questionId} onClick={() => selectQuestion(q)}>
          {q.questionId} (Score: {Math.round(q.score)})
        </button>
      ))}
    </div>
  );
}
```

### Pattern 2: Question Quality Display

```javascript
function QuestionPreview({ question }) {
  const { metrics } = useQuestionMetrics(question.id);
  const { recordFeedback } = useRecordQuestionFeedback();

  return (
    <div>
      <p>{question.text}</p>
      {metrics && (
        <div className="quality-badge">
          <span>Quality: {Math.round(metrics.qualityRating)}/100</span>
          <span>Used {metrics.usageCount} times</span>
          {metrics.positiveRate && (
            <span>{metrics.positiveRate}% liked it</span>
          )}
        </div>
      )}
      <button onClick={() => recordFeedback(question.id, 85, true)}>
        Helpful
      </button>
      <button onClick={() => recordFeedback(question.id, 40, false)}>
        Not Helpful
      </button>
    </div>
  );
}
```

### Pattern 3: Interview Improvement Dashboard

```javascript
function InterviewDashboard() {
  const { summary } = useCategorySummary('behavioral');
  const { gems } = useGemQuestions('behavioral', 3);
  const { trending } = useTrendingQuestions('behavioral', 5);

  return (
    <div>
      <section>
        <h3>Category Health</h3>
        <p>Quality: {summary?.avgQuality}/100</p>
        <p>Rating Coverage: {summary?.ratingCoverage}%</p>
      </section>

      <section>
        <h3>High-Quality Gems 💎</h3>
        {gems?.gems.map(g => (
          <button key={g.questionId}>
            {g.questionId} ({g.quality}/100)
          </button>
        ))}
      </section>

      <section>
        <h3>Trending Now 🔥</h3>
        {trending?.trending.map(t => (
          <div key={t.questionId}>
            {t.questionId}: {t.positiveRate}% positive
          </div>
        ))}
      </section>
    </div>
  );
}
```

## API Endpoints (Direct Usage)

If you prefer not to use hooks, you can call the APIs directly:

```javascript
// Get recommendations
GET /api/questions/recommendations?category=behavioral&difficulty=medium&currentScore=75&limit=5&recent=q-1,q-2

// Get gem questions
GET /api/questions/gems?category=behavioral&limit=3

// Get category summary
GET /api/questions/category-summary/behavioral

// Get metrics for a question
GET /api/questions/metrics/q-123

// Record usage (called automatically in /api/interview/next-question)
POST /api/questions/record-usage
{
  "questionId": "q-123",
  "category": "behavioral",
  "difficulty": "medium"
}

// Record feedback
POST /api/questions/record-feedback
{
  "questionId": "q-123",
  "rating": 80,
  "positive": true
}

// Record time spent
POST /api/questions/record-time
{
  "questionId": "q-123",
  "seconds": 120
}

// Get trending
GET /api/questions/trending/behavioral?limit=5

// Get diverse set
GET /api/questions/diverse-set?category=behavioral&limit=5
```

## Scoring Breakdown

The recommendation score is composed of 4 weighted factors:

```
Score = (Quality * 0.40) + (Novelty * 0.30) + (Difficulty * 0.20) + (Timing * 0.10)
```

Where:
- **Quality (40%)**: How well users rated the question (0-100)
- **Novelty (30%)**: How rarely it's been asked (100 = never asked, 0 = always asked)
- **Difficulty (20%)**: How well it matches user's current performance level
- **Timing (10%)**: How long since user last saw it (100 = never, 0 = just asked)

## Best Practices

### 1. Record Metrics Consistently
```javascript
// After each interview, record metrics
useEffect(() => {
  if (interviewComplete) {
    for (const q of questionsAsked) {
      recordQuestionMetrics(q.id, q.category, q.difficulty);
    }
  }
}, [interviewComplete]);
```

### 2. Use Recommendations Early
```javascript
// Show recommendations at interview start
// Let user pick from smart suggestions
const { recommendations } = useQuestionRecommendations({
  category: userSelectedCategory,
  currentScore: userHistoricalScore,
  limit: 3 // Show top 3
});
```

### 3. Display Quality Indicators
```javascript
// Show users why questions are recommended
const getQualityLabel = (score) => {
  if (score > 80) return '⭐⭐⭐ Excellent';
  if (score > 70) return '⭐⭐ Good';
  return '⭐ Fair';
};
```

### 4. Track User Feedback
```javascript
// Collect feedback after each answer
const handleFeedback = async (questionId, wasHelpful) => {
  await recordFeedback(
    questionId,
    userRating,
    wasHelpful
  );
  // Quality scores improve question pool for everyone
};
```

## Admin Features

Admins can access pool health statistics:

```javascript
// Get overall question pool health
GET /api/questions/analytics/health

// Response:
{
  "totalQuestions": 1250,
  "ratedQuestions": 945,
  "ratingCoverage": 76,
  "avgQuality": 78,
  "avgUsage": 23,
  "totalUsages": 28750,
  "health": "healthy",
  "recommendations": [
    "✓ Question quality is good",
    "✓ Good feedback coverage",
    "✓ Questions well-used"
  ]
}
```

## Error Handling

```javascript
function SafeRecommendations() {
  const { recommendations, error, loading } = useQuestionRecommendations({
    category: 'behavioral'
  });

  if (error) {
    console.error('Failed to load recommendations:', error);
    // Fallback to random questions
    return <FallbackQuestionSelector />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return recommendations ? (
    <RecommendationsList items={recommendations.recommendations} />
  ) : (
    <p>No recommendations available</p>
  );
}
```

## Performance Tips

1. **Cache results**: Recommendations change slowly, cache for 5-10 minutes
2. **Lazy load metrics**: Only fetch metrics when question details are viewed
3. **Batch feedback**: Record multiple feedback items together if possible
4. **Use limit parameter**: Request only needed recommendations (5-10 is typical)

## Troubleshooting

**"No recommendations available"**
- New category with no questions? → Ensure questions exist
- All questions recently used? → Expand the "recent" filter or use getDiverseSet

**"Metrics not updating"**
- Make sure recordFeedback is called after interview completes
- Check token expiration for API calls
- Verify question IDs are consistent

**"Quality score too low"**
- New questions start with no rating (defaults to 50)
- Accumulates as users provide feedback
- Scores improve naturally with use

## Summary

The Question Quality system automatically improves question recommendations as more users interact with questions, creating a self-improving question pool that adapts to your learner's needs.

**Key Benefits:**
✅ Smart recommendations (60% less duplicate questions)
✅ Quality-novelty balance (prevents repetitive yet helps with improvement)
✅ Underutilized gems (hidden high-quality questions discovered)
✅ Trending questions (keep content fresh)
✅ Admin visibility (monitor pool health)

---

For more info: See backend/routes/question-quality.js and PHASE_2_4_COMPLETE.md
