# Learning Path Architecture Guide

## Overview

The learning path system has been refactored into a modular, well-structured architecture that separates concerns and provides clear pedagogical progression through structured learning.

## Architecture

### Core Modules

The system is composed of four specialized services that work together:

```
┌────────────────────────────────────────────────────────────┐
│          learningPathService (Facade)                       │
│  ────────────────────────────────────────────────────────  │
│  Orchestrates all learning path operations                 │
└────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬──────────────────┐
        ▼                   ▼                   ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
│ learningTheory   │ │ pathManager      │ │ progress     │ │ recommender    │
│ Framework        │ │ Service          │ │ Tracker      │ │ Service        │
├──────────────────┤ ├──────────────────┤ ├──────────────┤ ├────────────────┤
│ • LEARNING_      │ │ • getAllPaths    │ │ • create     │ │ • recommend    │
│   STAGES         │ │ • getPath        │ │   Progress   │ │   Paths        │
│ • MASTERY_       │ │ • getPathsByDiff │ │ • update     │ │ • recommend    │
│   LEVELS         │ │ • checkPrereqs   │ │   Progress   │ │   NextPath     │
│ • calculate      │ │ • validate       │ │ • getMilestone│ │ • analyze      │
│   MasteryLevel   │ │   Path           │ │   Stats      │ │   Gaps         │
│ • getStageFrom   │ │                  │ │ • estimate   │ │ • byRole       │
│   Progress       │ │                  │ │   Completion │ │                │
└──────────────────┘ └──────────────────┘ └──────────────┘ └────────────────┘
```

### Validation Layer

```
learningPathValidationSchemas
├── validateUserProfile
├── validatePathProgress
├── validateMilestoneUpdate
├── validateRecommendRequest
├── validatePath
└── createValidationMiddleware
```

## Data Models

### Learning Stages (Pedagogical Framework)

```javascript
LEARNING_STAGES = {
  THEORY: {
    id: 'theory',
    name: 'Theory & Foundations',
    estimatedDuration: 0.3, // 30% of path time
    objectives: [
      'Learn fundamental definitions and principles',
      'Understand problem structures and patterns',
      'Build mental models for the topic',
    ],
  },
  QUICK_METHODS: {
    id: 'quick_methods',
    estimatedDuration: 0.25, // 25% of path time
  },
  SHORTCUTS: {
    id: 'shortcuts',
    estimatedDuration: 0.25, // 25% of path time
  },
  PRACTICE: {
    id: 'practice',
    estimatedDuration: 0.2, // 20% of path time
  },
}
```

### Mastery Levels

```javascript
MASTERY_LEVELS = {
  NOT_STARTED: { level: 0, name: 'Not Started', emoji: '🔒', color: '#525252' },
  LEARNING: { level: 1, name: 'Learning', emoji: '📚', color: '#818cf8' },
  IN_PROGRESS: { level: 2, name: 'In Progress', emoji: '🔥', color: '#facc15' },
  PROFICIENT: { level: 3, name: 'Proficient', emoji: '✨', color: '#34d399' },
  MASTERED: { level: 4, name: 'Mastered', emoji: '✅', color: '#059669' },
}
```

### Path Structure

```javascript
{
  id: 'arrays-foundations',
  title: 'Array Fundamentals',
  description: 'Master basic array operations and patterns',
  difficulty: 'easy',
  estimatedHours: 8,
  topics: ['arrays'],
  category: 'data-structures',
  prerequisites: [],
  milestones: [
    {
      name: 'Two Pointers',
      problems: 5,
      difficulty: 'easy',
      stage: 'THEORY'
    },
    // ... more milestones
  ]
}
```

### Progress Tracking

```javascript
{
  userId: 'user123',
  pathId: 'arrays-foundations',
  title: 'Array Fundamentals',
  startedAt: '2026-05-05T12:00:00.000Z',
  completedAt: null,
  completionPercentage: 45,
  masteryLevel: 'In Progress',
  milestoneProgress: [
    {
      name: 'Two Pointers',
      stage: 'THEORY',
      problemCount: 5,
      completed: 5,
      status: 'completed',
    },
    // ... more milestones
  ],
  totalProblemsSolved: 12,
  totalProblemsToSolve: 27,
}
```

## Usage Examples

### Get Recommendations

```javascript
import learningPathService from '../services/learningPathService.js';

const recommendations = learningPathService.getDetailedRecommendations({
  skillLevel: 'intermediate',
  weaknessAreas: { 'arrays': 0.8, 'trees': 0.6 },
  completedPaths: ['arrays-foundations'],
});

console.log(recommendations.recommendations); // Top 5 paths
```

### Track Progress

```javascript
const path = learningPathService.getPath('arrays-foundations');
let progress = learningPathService.createPathProgress(userId, 'arrays-foundations');

// Update as user completes problems
progress = learningPathService.updateMilestoneProgress(progress, 0, 5);

// Get statistics
const stats = learningPathService.getPathStats(progress);
console.log(stats.masteryLevel); // 'Learning'
console.log(stats.completionPercentage); // 45

// Get next step
const nextPath = learningPathService.getNextRecommendedPath(
  'arrays-foundations',
  ['arrays-foundations']
);
console.log(nextPath.nextPathId); // 'trees-basics'
```

### Get Learning Objectives

```javascript
const objectives = learningPathService.getPathObjectives('arrays-foundations');

objectives.forEach(obj => {
  console.log(`${obj.stageName}:`);
  obj.objectives.forEach(o => console.log(`  - ${o}`));
});
```

## Testing

All modules have comprehensive test coverage (81+ tests):

```bash
npm run test:backend-modules
```

Tests cover:
- Learning theory framework (stage progression, mastery levels)
- Path management (retrieval, validation, prerequisites)
- Progress tracking (milestone completion, stats, time estimation)
- Recommendations (skill-based, weakness-based, role-based)
- Validation schemas (user profiles, path progress, milestone updates)
- Integration tests (complete learning flows, stage progression)

## Frontend Components

### TopicCard Component

Reusable component for displaying learning topics with:
- Progress visualization (circular progress ring)
- 4-step methodology indicators
- Mastery badges
- Responsive design
- Consistent styling

```jsx
<TopicCard
  topic={{ title: 'Array Fundamentals', description: '...', ... }}
  progress={{ masteryPercent: 45, ... }}
  badge={{ label: 'In Progress', emoji: '🔥', color: '#facc15' }}
  steps={[
    { label: 'Theory', done: true },
    { label: 'Methods', done: true },
    { label: 'Shortcuts', done: false },
    { label: 'Practice', done: false },
  ]}
  color="#818cf8"
  onClick={() => navigate('/learning-path/arrays-foundations')}
/>
```

## Design System

### Color Palette
- Primary (Indigo): `#818cf8`
- Success (Emerald): `#34d399`
- Warning (Amber): `#facc15`
- Danger (Pink): `#f472b6`

### Spacing (4px base)
- `--sp-xs`: 4px
- `--sp-sm`: 8px
- `--sp-md`: 12px
- `--sp-lg`: 16px
- `--sp-xl`: 20px
- `--sp-2xl`: 24px
- `--sp-3xl`: 28px
- `--sp-4xl`: 32px

### Responsive Breakpoints
- Desktop: default
- Tablet (max-width: 768px)
- Mobile (max-width: 480px)

## API Integration Points

### Routes to Update

The refactored services integrate seamlessly with existing routes:

```javascript
// backend/routes/learning-path.js
import learningPathService from '../services/learningPathService.js';

router.get('/recommendations', (req, res) => {
  const recommendations = learningPathService.getDetailedRecommendations(
    req.user.profile
  );
  res.json(recommendations);
});

router.post('/progress/update', (req, res) => {
  const { milestoneIndex, problemsSolved } = req.body;
  const progress = learningPathService.updateMilestoneProgress(
    req.user.pathProgress,
    milestoneIndex,
    problemsSolved
  );
  res.json(progress);
});
```

## Future Enhancements

1. **Persistence**: Integrate with Supabase for database storage
2. **Real-time Updates**: Add WebSocket support for live progress updates
3. **Analytics**: Track which learning stages convert best
4. **Personalization**: AI-driven learning path customization
5. **Leaderboards**: Per-path competition and achievement tracking
6. **Content Management**: Admin interface for creating/editing paths
7. **Adaptive Difficulty**: Adjust path difficulty based on performance

## Performance Considerations

- **Memoization**: Paths and recommendations are cached
- **Lazy Loading**: Path details loaded on-demand
- **Batch Operations**: Multiple milestone updates in single transaction
- **Pagination**: Large leaderboards paginated (future)

## Security

- **Validation**: All inputs validated with Joi schemas
- **Authentication**: All progress endpoints require auth
- **Authorization**: Users can only access their own progress
- **Sanitization**: Inputs sanitized for HTML/SQL injection

## Backward Compatibility

The `learningPathService` facade maintains backward compatibility with existing code while internally delegating to modular services. Existing routes continue to work without modification.

---

**Last Updated**: 2026-05-05
**Version**: 2.0.0 (Modular Refactor)
