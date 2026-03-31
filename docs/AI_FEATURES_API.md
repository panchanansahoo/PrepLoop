# AI Features API Endpoints

This document outlines all endpoints for the AI Code Review and AI Interview Simulator features implemented in Phase 1.

## Base Path
All endpoints are prefixed with `/api/ai-features`

## Authentication
All endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Code Review Endpoints

### 1. Submit Code for Review
**POST** `/api/ai-features/code-review`

Submit code for AI analysis and receive detailed feedback.

**Request Body:**
```json
{
  "problemId": 123,
  "code": "function solution(arr) { ... }",
  "language": "javascript"  // Optional, defaults to "javascript"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "problem_id": 123,
    "code": "...",
    "language": "javascript",
    "ai_feedback": "Your solution correctly uses a two-pointer approach...",
    "code_quality_score": 82,
    "efficiency_score": 78,
    "readability_score": 85,
    "overall_score": 81,
    "identified_patterns": ["two-pointer", "sliding-window"],
    "improvement_suggestions": ["Add more descriptive variable names", "Consider edge cases..."],
    "time_complexity": "O(n)",
    "space_complexity": "O(1)",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400`: Validation error - invalid problemId or code
- `500`: Server error or AI service failure

---

### 2. Retrieve Specific Code Review
**GET** `/api/ai-features/code-review/:reviewId`

Get details of a specific code review session.

**URL Parameters:**
- `reviewId` (UUID): The review session ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "problem_id": 123,
    "code": "...",
    "language": "javascript",
    "ai_feedback": "...",
    "code_quality_score": 82,
    "efficiency_score": 78,
    "readability_score": 85,
    "overall_score": 81,
    "identified_patterns": ["..."],
    "improvement_suggestions": ["..."],
    "time_complexity": "O(n)",
    "space_complexity": "O(1)",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `404`: Review not found or not authorized to access
- `500`: Server error

---

### 3. Get All Reviews for a Problem
**GET** `/api/ai-features/code-review/problem/:problemId`

Retrieve all code reviews for a specific problem submitted by the current user.

**URL Parameters:**
- `problemId` (integer): The problem ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    { /* review 1 */ },
    { /* review 2 */ }
  ],
  "count": 2
}
```

**Error Responses:**
- `500`: Server error

---

### 4. Get Code Review History
**GET** `/api/ai-features/code-review/history`

Retrieve user's code review history with pagination.

**Query Parameters:**
- `page` (integer, optional): Page number (1-indexed), defaults to 1
- `limit` (integer, optional): Results per page, defaults to 10, max 50

**Response (200):**
```json
{
  "success": true,
  "data": [
    { /* review 1 */ },
    { /* review 2 */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Error Responses:**
- `500`: Server error

---

## Interview Simulation Endpoints

### 5. Start Interview Session
**POST** `/api/ai-features/interview/start`

Initialize a new interview session with a problem statement and greeting from the interviewer.

**Request Body:**
```json
{
  "interviewType": "dsa",  // "dsa", "system_design", "behavioral", or "mixed"
  "difficulty": "medium",  // Optional: "easy", "medium", or "hard", defaults to "medium"
  "companyFocus": "Google"  // Optional: specific company focus
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "user_id": "uuid",
    "interview_type": "dsa",
    "difficulty": "medium",
    "company_focus": "Google",
    "problem_statement": "Design a system to handle...",
    "interviewer_greeting": "Hello! Let's start with a system design question...",
    "status": "in_progress",
    "round": 1,
    "max_rounds": 5,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400`: Invalid interviewType or other validation error
- `500`: Server error or AI service failure

---

### 6. Submit Interview Response
**POST** `/api/ai-features/interview/:sessionId/respond`

Process the candidate's response and generate interviewer's follow-up or next round.

**URL Parameters:**
- `sessionId` (UUID): The interview session ID

**Request Body:**
```json
{
  "response": "I would approach this by first understanding the requirements..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "round": 1,
    "candidate_response": "I would approach this by...",
    "interviewer_message": "Good start! Can you elaborate on the scalability aspect?",
    "feedback": "You provided a solid high-level overview. Your approach shows understanding of common patterns.",
    "response_quality_score": 72,
    "communication_score": 75,
    "problem_solving_score": 70,
    "transcript": [
      { "role": "interviewer", "message": "..." },
      { "role": "candidate", "message": "..." }
    ]
  }
}
```

**Error Responses:**
- `400`: Invalid sessionId or empty response
- `404`: Session not found
- `500`: Server error or AI service failure

---

### 7. Complete Interview Session
**POST** `/api/ai-features/interview/:sessionId/complete`

End the interview and generate final performance analysis with scores.

**URL Parameters:**
- `sessionId` (UUID): The interview session ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "user_id": "uuid",
    "interview_type": "dsa",
    "difficulty": "medium",
    "status": "completed",
    "interview_score": 74,
    "communication_score": 76,
    "problem_solving_score": 72,
    "technical_depth_score": 75,
    "overall_performance": 74,
    "performance_level": "Good",
    "strengths": [
      "Clear communication of thought process",
      "Systematic approach to problem-solving"
    ],
    "areas_for_improvement": [
      "Explore more edge cases",
      "Consider optimizations earlier in discussion"
    ],
    "detailed_analysis": "Overall, you demonstrated solid interview skills...",
    "round_count": 1,
    "total_duration_minutes": 12,
    "completed_at": "2024-01-15T10:42:00Z"
  }
}
```

**Error Responses:**
- `404`: Session not found
- `500`: Server error

---

### 8. Get Interview Session Details
**GET** `/api/ai-features/interview/:sessionId`

Retrieve details of a specific interview session.

**URL Parameters:**
- `sessionId` (UUID): The interview session ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "user_id": "uuid",
    "interview_type": "dsa",
    "difficulty": "medium",
    "company_focus": "Google",
    "status": "completed",
    "interview_score": 74,
    "communication_score": 76,
    "problem_solving_score": 72,
    "technical_depth_score": 75,
    "overall_performance": 74,
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:42:00Z"
  }
}
```

**Error Responses:**
- `404`: Session not found
- `500`: Server error

---

### 9. Get Interview History
**GET** `/api/ai-features/interview/history`

Retrieve user's interview history with pagination and optional status filtering.

**Query Parameters:**
- `page` (integer, optional): Page number (1-indexed), defaults to 1
- `limit` (integer, optional): Results per page, defaults to 10, max 50
- `status` (string, optional): Filter by status ("completed", "in_progress", "abandoned")

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "session_id": "uuid",
      "interview_type": "dsa",
      "difficulty": "medium",
      "status": "completed",
      "overall_performance": 74,
      "created_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:42:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

**Error Responses:**
- `500`: Server error

---

### 10. Get Performance Trends
**GET** `/api/ai-features/performance-trends`

Get aggregated performance metrics across multiple interviews.

**Query Parameters:**
- `type` (string, optional): Filter by interview type ("dsa", "system_design", "behavioral", "mixed")

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "interview_type": "dsa",
      "interviews_completed": 5,
      "average_interview_score": 72,
      "average_communication_score": 75,
      "average_problem_solving_score": 70,
      "average_technical_depth_score": 71,
      "highest_score": 82,
      "lowest_score": 64,
      "trend": "improving",
      "last_updated": "2024-01-15T10:42:00Z"
    }
  ]
}
```

**Error Responses:**
- `500`: Server error

---

## Utility Endpoints

### 11. Get AI Feature Usage Stats
**GET** `/api/ai-features/stats`

Get overall usage statistics for the current user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "codeReviewsSubmitted": 12,
    "interviewsStarted": 5,
    "interviewsCompleted": 4
  }
}
```

**Error Responses:**
- `500`: Server error

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (only in development)"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

All endpoints are subject to the global rate limit (default: 250 requests per 15 minutes per IP).

---

## Database Tables

The following tables support these endpoints:

- `code_review_sessions`: Stores code review submissions
- `interview_sessions`: Stores interview sessions
- `interview_feedback_history`: Stores interviewer feedback for each round
- `code_review_improvements`: Tracks improvement metrics across reviews
- `interview_performance_trends`: Aggregated performance metrics
- `ai_service_logs`: Logs AI API usage and performance

## Data Isolation (RLS)

All endpoints enforce Row-Level Security (RLS) to ensure users can only access their own data.

---

## Integration Notes

### Frontend Integration
- The frontend should use Bearer token authentication
- Implement loading states while AI processes responses (typically 2-5 seconds)
- Display progress indicators for multi-round interviews
- Use websockets (future enhancement) for real-time interviewer responses

### Environment Variables
- `GROQ_API_KEY`: API key for Groq AI service
- `SUPABASE_URL`: Supabase database URL
- `SUPABASE_KEY`: Supabase API key

### Testing
Run the integration test suite:
```bash
npm run test:ai-features
```

---

## Rate Limiting by Endpoint

Future enhancement: Implement endpoint-specific rate limits:
- Code review submission: 10 per hour (processing-intensive)
- Interview submission: 5 per hour (resource-intensive)
- History/stats queries: 100 per hour (read-only)

---
