# Problem Exploration Enhancement - Setup Guide

## Overview
This setup adds two powerful features to the DSA problems:

1. **Explore Questions** - 5-10 strategic learning questions per problem to guide students through problem-solving
2. **Extended Test Cases** - 15+ comprehensive test cases covering edge cases, boundaries, and special patterns

## What's New

### Database Changes
- Column: `explore_questions` - Array of learning questions with hints
- Column: `extended_test_cases` - Array of comprehensive test case descriptions
- Column: `exploration_metadata` - Metadata tracking enhancement status
- New View: `enhanced_problems` - Query all enhanced problems easily

### API Endpoints

#### Get Problem with Exploration Data
```
GET /api/dsa/problems/:id
```
Response includes:
```json
{
  "problem": {...},
  "exploration": {
    "exploreQuestions": [...],
    "extendedTestCases": [...],
    "metadata": {...}
  },
  "userProgress": {...}
}
```

#### Get Exploration Questions Only
```
GET /api/dsa/problems/:id/explore
```
Response includes:
```json
{
  "problemId": 1,
  "title": "Two Sum",
  "difficulty": "Easy",
  "exploreQuestions": [
    {"question": "...", "hint": "..."},
    ...
  ],
  "extendedTestCases": [...],
  "statistics": {
    "questionsCount": 5,
    "testCasesCount": 15
  }
}
```

## Setup Steps

### Step 1: Database Migration
Apply the SQL migration to add new columns:

```bash
# Using Supabase CLI
supabase db push --dry-run  # Preview changes
supabase db push             # Apply changes

# OR manually run migration_add_exploration.sql in Supabase SQL editor
```

### Step 2: Seed Data

#### Option A: Quick Template-Based Seeding (Recommended First)
```bash
node backend/scripts/seedExploreQuestions.js
```
✅ Pros: Fast, reliable, pattern-based questions
❌ Cons: Template-based, not AI-generated

#### Option B: AI-Enhanced Seeding (Advanced)
```bash
GROQ_API_KEY=your_key node backend/scripts/enhanceProblemsWithExplore.js
```
✅ Pros: Unique AI-generated questions per problem
❌ Cons: Slower, requires API quota

### Step 3: Verify
```bash
# Check that problems have been enhanced
curl http://localhost:5000/api/dsa/problems/1/explore

# Should return explore questions and test cases
```

## Features

### Explore Questions Structure
Each question includes:
- **question** - The learning prompt
- **hint** - Guidance without solution

```javascript
{
  question: "How would you visualize this array problem?",
  hint: "Try drawing the array and marking indices"
}
```

### Extended Test Cases Structure
Real-world test scenarios:
```javascript
{
  input: "Empty input",
  expected: "Handle gracefully or return empty result"
}
```

## Patterns Covered

Each pattern has tailored explore questions:
- **Array** - Visualization, constraints, patterns
- **Two Pointers** - Convergence, invariants, space
- **Sliding Window** - Window definition, expansion/contraction
- **Linked List** - Differences from arrays, cycles, modifications
- **Binary Search** - Invariants, boundaries, edge cases
- **Dynamic Programming** - State definition, recurrence, base cases
- **Graph** - Representation, traversal choice, connectivity
- **String** - Preprocessing, searching, special characters
- **Tree** - Traversals, BST properties, recursion
- **Heap** - Properties, operations, use cases

## Test Cases Covered

### Edge Cases
- Empty arrays/lists
- Single element
- Two elements

### Boundary Conditions
- Maximum valid input
- Minimum valid input
- Negative numbers

### Special Patterns
- All identical elements
- Sorted sequences
- Reverse sorted

### Performance Cases
- Large inputs near limits
- Worst-case scenarios
- Stress testing

### Realistic Scenarios
- Real-world data
- Duplicates
- Mixed values

## Frontend Integration

### Display Explore Questions
```javascript
// Fetch explore questions
const response = await fetch(`/api/dsa/problems/${problemId}/explore`);
const data = await response.json();

// Render questions progressively
data.exploreQuestions.forEach(q => {
  console.log(`Q: ${q.question}`);
  console.log(`Hint: ${q.hint}`);
});
```

### Interactive Learning Flow
1. Show problem statement
2. Display first explore question
3. Let students think and try solution
4. Show hint if needed
5. Progress to next question
6. Provide extended test cases for validation

## Monitoring

### Check Enhancement Status
```sql
-- View enhanced problems
SELECT id, title, explore_questions_count, extended_test_cases_count, enhancement_status
FROM enhanced_problems
WHERE enhancement_status = 'fully_enhanced';

-- Get statistics
SELECT 
  enhancement_status, 
  COUNT(*) as count,
  AVG(explore_questions_count) as avg_questions,
  AVG(extended_test_cases_count) as avg_test_cases
FROM enhanced_problems
GROUP BY enhancement_status;
```

## Troubleshooting

### No explore questions showing?
1. Check database: `SELECT explore_questions FROM problems WHERE id = 1;`
2. Run seeding script: `node backend/scripts/seedExploreQuestions.js`
3. Verify API: `curl http://localhost:5000/api/dsa/problems/1/explore`

### Questions seem generic?
- That's fine! Template-based questions are universally applicable
- For unique questions, use AI enhanced seeding with Groq API
- Pattern-based questions help students think systematically

### Performance issues?
- Queries should be fast (<50ms) with GIN index on explore_questions
- Large JSONB arrays won't impact retrieval significantly
- Consider pagination if returning many test cases

## Next Steps

1. ✅ Apply database migration
2. ✅ Run seeding script
3. ✅ Verify API endpoints
4. ✅ Update frontend to display explore questions
5. ✅ Add interactive guidance system
6. ✅ Track which explore questions help students most

## Code Examples

### Backend: Add explore questions to problem
```javascript
// Already implemented in seedExploreQuestions.js
const exploreQuestions = [
  { question: "How would you...", hint: "Consider..." },
  { question: "What if...", hint: "Think about..." }
];

await supabaseAdmin
  .from('problems')
  .update({ explore_questions: exploreQuestions })
  .eq('id', problemId);
```

### Frontend: Display explore questions
```jsx
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const questions = explorationData.exploreQuestions;

return (
  <div>
    <h3>Learning Questions</h3>
    <div className="question-card">
      <p className="question">{questions[currentQuestionIndex].question}</p>
      <details>
        <summary>Show Hint</summary>
        <p>{questions[currentQuestionIndex].hint}</p>
      </details>
    </div>
    <button onClick={() => setCurrentQuestionIndex(i => i + 1)}>
      Next Question
    </button>
  </div>
);
```

## Statistics

After seeding:
- **Total Problems**: 425+
- **Explore Questions per Problem**: 5-10
- **Extended Test Cases per Problem**: 15+
- **Total Learning Questions**: 2,125+
- **Total Test Case Scenarios**: 6,375+

## Support

For issues or questions:
1. Check this guide first
2. Verify database migration applied
3. Run verification queries
4. Check API response format
5. Review script logs for errors

---

**Status**: ✅ Ready to use
**Last Updated**: 2026-03-13
**Version**: 1.0.0
