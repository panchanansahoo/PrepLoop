# Quick Start: AI Features Database Setup

## Overview
This guide walks you through applying the AI Features database schema to your Supabase instance.

## Prerequisites
- Supabase account with project created
- Supabase connection details (URL, API key)
- Access to the SQL Editor in Supabase Dashboard

## Step-by-Step Setup

### 1. Access Supabase SQL Editor

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **SQL Editor** (left sidebar)
4. Click **New Query** button

### 2. Copy Migration SQL

1. Open: `backend/db/migration_ai_features.sql`
2. Copy all contents (Ctrl+A → Ctrl+C)

### 3. Execute Migration

1. Paste into the Supabase SQL Editor
2. Click **Run** button (or Ctrl+Enter)
3. Wait for execution to complete

**Expected Output**:
```
Query Execution Successful
Execution time: 2-3 seconds
```

### 4. Verify Tables Created

Run verification query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Results** (6 new tables):
- `ai_service_logs`
- `code_review_improvements`
- `code_review_sessions`
- `interview_feedback_history`
- `interview_performance_trends`
- `interview_sessions`

### 5. Verify RLS Policies

Check RLS is enabled:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'code_review_sessions',
  'interview_sessions',
  'interview_feedback_history',
  'code_review_improvements',
  'interview_performance_trends'
);
```

**Expected**: All should show `rowsecurity = t` (true)

---

## Environment Configuration

After migration, configure your `.env` file:

```env
# AI Service Configuration
GROQ_API_KEY=gsk_xxxxxxxxxxxx  # Your Groq API key
GROQ_MODEL=mixtral-8x7b-32768

# Supabase Configuration (already configured)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...

# Optional
AI_FEATURES_ENABLED=true
AI_SERVICE_TIMEOUT=30000  # 30 seconds
```

---

## Troubleshooting

### Issue: "Table already exists"
**Cause**: Migration was run before  
**Solution**: 
1. Check if data exists: `SELECT COUNT(*) FROM code_review_sessions;`
2. If you need to reset, run drop commands (careful!):
   ```sql
   DROP TABLE IF EXISTS ai_service_logs CASCADE;
   DROP TABLE IF EXISTS interview_performance_trends CASCADE;
   DROP TABLE IF EXISTS code_review_improvements CASCADE;
   DROP TABLE IF EXISTS interview_feedback_history CASCADE;
   DROP TABLE IF EXISTS interview_sessions CASCADE;
   DROP TABLE IF EXISTS code_review_sessions CASCADE;
   ```
3. Re-run migration

### Issue: "Permission denied" error
**Cause**: Insufficient Supabase privileges  
**Solution**: 
1. Ensure you're using a service role key or admin account
2. Check RLS policies are not blocking admin operations

### Issue: "Foreign key constraint violation"
**Cause**: `auth.users` table not found  
**Solution**: 
1. Ensure Supabase Auth is enabled in your project
2. Create at least one user via Supabase Auth

### Issue: Migration executes but no tables appear
**Cause**: Silent failure or connection issue  
**Solution**:
1. Check execution time (should be > 0 seconds)
2. Look for error messages in the output
3. Try refreshing the Tables view in Supabase
4. Check table visibility (might need to refresh schema cache)

---

## Testing the Setup

### Test 1: Insert Code Review
```sql
INSERT INTO code_review_sessions (
  user_id,
  problem_id,
  code,
  language,
  ai_feedback,
  code_quality_score,
  efficiency_score,
  readability_score,
  overall_score
) VALUES (
  '00000000-0000-0000-0000-000000000000',  -- Test user ID
  1,
  'function test() { return 42; }',
  'javascript',
  'Good solution',
  80,
  75,
  85,
  80
);
```

**Expected**: 1 row inserted

### Test 2: Verify RLS (Auth Context)
```sql
-- This should fail if RLS is properly configured and you're not the owner
SELECT * FROM code_review_sessions 
WHERE user_id != auth.uid();
```

**Expected**: For non-admin users, empty result (RLS prevents access)

### Test 3: Check Indexes
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN (
  'code_review_sessions',
  'interview_sessions'
);
```

**Expected**: Multiple indexes created for performance

---

## Next Steps

After successful migration:

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test API Endpoints**
   ```bash
   # Test code review endpoint
   curl -X POST http://localhost:5000/api/ai-features/code-review \
     -H "Authorization: Bearer <your_jwt_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "problemId": 1,
       "code": "function solution() { return 42; }",
       "language": "javascript"
     }'
   ```

3. **Build Frontend Components**
   - See `docs/AI_FEATURES_API.md` for endpoint specifications
   - Start with CodeReviewSubmission component
   - Follow with InterviewSimulator component

4. **Create Integration Tests**
   - Location: `backend/tests/ai-features.test.js`
   - Test all 11 endpoints with both success and failure scenarios

---

## Database Schema Overview

### Table: `code_review_sessions`
Stores code submissions and AI feedback
- Fields: user_id, problem_id, code, language, scores, feedback, patterns, suggestions

### Table: `interview_sessions`
Stores interview sessions and performance metrics
- Fields: user_id, interview_type, difficulty, status, scores, analysis

### Table: `interview_feedback_history`
Tracks feedback for each interview round
- Fields: interview_id, round_number, feedback, quality_score

### Table: `code_review_improvements`
Tracks user's improvement across multiple reviews
- Fields: user_id, problem_id, previous_score, current_score, improvement

### Table: `interview_performance_trends`
Aggregates performance metrics over time
- Fields: user_id, interview_type, avg_scores, trend, last_updated

### Table: `ai_service_logs`
Logs all AI API calls for observability
- Fields: user_id, model, tokens_used, latency, error (if any)

---

## Monitoring After Deployment

### Check Active Users
```sql
SELECT COUNT(DISTINCT user_id) FROM code_review_sessions 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Check AI Service Load
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as calls,
  AVG(latency_ms) as avg_latency,
  SUM(total_tokens) as total_tokens
FROM ai_service_logs
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;
```

### Check Error Rate
```sql
SELECT 
  error,
  COUNT(*) as count
FROM ai_service_logs
WHERE error IS NOT NULL
GROUP BY error;
```

---

## Support

**API Documentation**: `docs/AI_FEATURES_API.md`  
**Implementation Report**: `AI_FEATURES_PHASE1_REPORT.md`  
**Service Code**: `backend/services/aiService.js`on**Routes Code**: `backend/routes/ai-features.js`

---

**Status**: ✅ Ready to Deploy
