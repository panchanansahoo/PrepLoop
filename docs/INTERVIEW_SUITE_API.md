# Interview Suite API

Base path: `/api/interview-suite`

## 1) Resume-to-question generator
- `POST /resume/question-generator`
- Auth: required
- Body:
  - `resumeText?: string`
  - `resumeProfile?: object`
  - `company?: string`
  - `role?: string`
  - `experienceLevel?: string`
- Returns project, HR, and technical follow-up question arrays.

## 2) Interview replay + transcript + mistake markers
- `POST /replay/analyze`
- Auth: required
- Body:
  - `conversation: {role: string, content: string, timestampSeconds?: number}[]`
  - `startedAt?: ISO string`
  - `durationSeconds?: number`
  - `includeAiMarkers?: boolean`
- Returns transcript with timestamp labels and mistake markers.

- `GET /replay/:sessionId`
- Auth: required
- Returns replay analysis based on saved `interview_sessions` conversation.

## 3) Weakness heatmap + adaptive daily plan
- `GET /weakness/heatmap?limit=30`
- Auth: required
- Returns weakness heatmap by skill area and a 7-day adaptive plan.

## 4) Company-specific round simulation flow
- `POST /company/round-simulation-flow`
- Auth: required
- Body:
  - `company?: string`
  - `role?: string`
  - `difficulty?: string`
  - `includeDebugMode?: boolean`
  - `customFocus?: string[]`
- Returns round-by-round simulation flow.

## 6) Clarifying-question and communication rubric
- `POST /communication/rubric-score`
- Auth: required
- Body:
  - `answers?: string[]`
  - `transcript?: string`
- Returns rubric (1-5 dimensions), overall score, strengths, and improvements.

## 7) Debugging + code-review interview mode
- `POST /debug-code-review/start`
- Auth: required
- Body:
  - `mode?: "debug" | "review"`
  - `language?: string`
  - `difficulty?: string`
  - `company?: string`
- Returns a challenge prompt, starter code, and rubric.

- `POST /debug-code-review/evaluate`
- Auth: required
- Body:
  - `mode?: "debug" | "review"`
  - `challengePrompt?: string`
  - `candidateResponse?: string`
  - `submittedCode?: string`
- Returns score, breakdown, verdict, and feedback.

## 8/9) Peer matching + mentor booking
- `POST /peer/profile` (auth)
- `GET /peer/matches` (auth) with query: `role`, `company`, `language`, `skillLevel`, `limit`
- `POST /peer/request` (auth)
- `POST /peer/request/:id/connect` (auth)

- `GET /mentor/slots` (optional auth)
- `POST /mentor/slots` (auth) create mentor slots
- `POST /mentor/book` (auth) book a slot

## 10) Doubt threads under problem/pattern/interview round
- `GET /doubts` (optional auth) with query: `targetType`, `targetId`, `limit`
- `POST /doubts` (auth) create thread
- `GET /doubts/:threadId/replies` (optional auth)
- `POST /doubts/:threadId/replies` (auth)
- `POST /doubts/:threadId/upvote` (auth) toggle upvote

## Migration
Apply `backend/db/migration_interview_suite_features.sql` in your database before using peer/mentor/doubt endpoints.
