# AI Interview Workflow

This document describes the end-to-end AI interview workflow currently implemented in PrepLoop.

## Scope

This workflow covers two active interview tracks:
- AI Features API flow under `/api/ai-features/interview/*`
- Company Interview flow used by the premium interview room UI (`/api/company-interview/*`)

## High-Level Flow

1. User configures interview setup (type, role, company, experience level).
2. Client selects runtime mode (`full_realtime`).
3. Client uses realtime metadata from the interview session.
4. Interview is started and first question is returned.
5. Candidate submits answers turn-by-turn (text/voice/code).
6. Backend returns feedback plus either next question or completion signal.
7. Client ends session and shows summary/report.

## Runtime Modes

- `full_realtime`
  - Realtime-optimized responses and strategy

## AI Features Session Contract (Current)

Lifecycle and sequencing are owned by backend interview state:
- Lifecycle: `in_progress -> completed`
- Stages: `intake -> warmup -> technical -> followup -> challenge -> feedback`
- Turn sequencing: every `POST /interview/:sessionId/respond` increments turn count and may trigger a stage transition
- Stage transitions are captured in telemetry as `{ from, to, atTurn, timestamp }`

Required success fields for turn responses:
- `interviewerMessage`
- `continueInterview`
- `stage`, `stageLabel`, `stagePlan`
- `current_scores`
- `adaptive_update`
- `telemetry`

Client normalization guidance:
- `session_id | sessionId -> sessionId`
- `interviewMode | interview_mode -> mode`
- `follow_up | interviewerMessage | message -> next interviewer turn`
- `stagePlan` can be either string keys or `{ key, label }` objects and should be normalized.

## Track A: AI Features API Workflow

Base path: `/api/ai-features`

### Sequence

1. `GET /interview/modes`
2. `POST /interview/start`
3. Repeat per round:
   - `POST /interview/:sessionId/respond`
4. `POST /interview/:sessionId/complete`
5. Optional retrieval:
   - `GET /interview/:sessionId`
   - `GET /interview/history`

### Typical Start Payload

```json
{
  "interviewType": "dsa",
  "difficulty": "medium",
  "companyFocus": "Google",
  "interviewMode": "full_realtime"
}
```

### Typical Respond Payload

```json
{
  "response": "I would start by clarifying constraints and input size...",
  "interviewMode": "full_realtime"
}
```

## Track B: Company Interview Workflow (Premium UI)

Used by: `frontend/src/pages/AIInterviewPage.jsx`

### Sequence

1. Optional realtime bootstrap:
  - Realtime metadata is attached to the interview start response
2. Start interview:
   - `POST /api/company-interview/start`
3. Repeat per turn:
   - `POST /api/company-interview/follow-up`
4. Completion logic in client:
   - End when backend sends `complete: true`, or
   - End when no next question and max question count reached

### Notes

- This track supports richer interview personalization via:
  - `experienceLevel`
  - `advancedOptions`
  - `resumeContext`
- Voice runtime metadata now includes `telemetry` on both start and follow-up responses.

### Voice Telemetry Snapshot

Company interview responses include a `telemetry` object to support realtime voice UI instrumentation:

```json
{
  "telemetry": {
    "totalTurns": 3,
    "currentStage": "Technical",
    "realtimeMode": "full_realtime",
    "stageTransitions": [
      {
        "from": "Technical",
        "to": "HR",
        "atTurn": 2,
        "timestamp": "2026-04-12T06:00:00.000Z"
      }
    ],
    "lastResponseLatencyMs": 840,
    "averageResponseLatencyMs": 620.0,
    "lastUpdatedAt": "2026-04-12T06:00:01.000Z"
  }
}
```

Realtime sessions expose initial telemetry through the interview start response to seed clients before the first follow-up call.

## Current Contract Differences

- AI Features flow uses `sessionId` and explicit `/complete` endpoint.
- Company Interview flow is question-driven and completion can be inferred from follow-up response.
- Response field names differ (`follow_up` vs `followUpQuestion`/`nextQuestion`).

## Canonical Aliases Now Emitted (Company Interview)

The company interview `start` and `follow-up` responses now include canonical aliases in addition to legacy fields:

- `mode`: normalized runtime mode
- `status`: `in_progress` or `completed`
- `turn`: question sequence when available
- `nextQuestion`: normalized alias of `followUpQuestion`
- `initialQuestion`: normalized alias of opening `question` (start endpoint)

This keeps existing UI behavior intact while enabling a unified client contract.

## Canonical Unified Contract (Recommendation)

To reduce mapping complexity across frontend clients, use one response shape for both flows:

```json
{
  "sessionId": "uuid",
  "mode": "full_realtime",
  "status": "in_progress",
  "turn": 3,
  "feedback": {
    "summary": "Good structure, add complexity analysis.",
    "score": 74,
    "strengths": ["Clear approach"],
    "improvements": ["Cover edge cases"]
  },
  "nextQuestion": "How would you optimize this solution?",
  "complete": false,
  "runtime": {
    "realtime": false,
    "strategy": "http_pipeline_with_realtime_bridge"
  }
}
```

Current production responses do not yet expose explicit `questionNumber` and `followUpNumber` fields. Clients should derive visual numbering from turn index until dedicated numbering fields are introduced.

## Frontend Mapping Guidance

- Keep endpoint-specific adapters in `frontend/src/api/aiService.js`.
- Normalize these fields before UI rendering:
  - `session_id | sessionId -> sessionId`
  - `interviewMode | interview_mode -> mode`
  - `follow_up | followUpQuestion | nextQuestion -> nextQuestion`
- UI should rely on normalized fields only.

## Backend Verification Checklist

After interview route changes, run:

```bash
npm run lint --prefix backend
npm run test --prefix backend
npm run smoke:interview-suite:local --prefix backend
npm run smoke:ai-features --prefix backend
```

## Voice Runtime Troubleshooting (ERR_ABORTED / Intermittent 4xx/5xx)

Use this runbook when the browser reports intermittent voice request failures (for example `net::ERR_ABORTED` on `/api/voice/tts-stream` or `/api/voice/deepgram-token`).

### 1. Enable client-side voice debug logs (dev only)

- `useDeepgramVoice` emits `[voice-debug]` entries in development mode.
- Keep debug on (default), or explicitly set:

```js
localStorage.setItem('voiceDebug', 'true')
```

### 2. Capture request IDs from the browser

- Voice requests include `X-Request-ID` for token, TTS, and prefetch calls.
- From browser logs, capture:
  - endpoint
  - status (if available)
  - requestId

### 3. Correlate in backend logs

- Backend `index.js` logs voice traffic under operation `voice-http`.
- Match the same request ID in logs:
  - `Voice request started`
  - `Voice request completed`
  - `Voice request connection closed before finish`
  - `Voice request aborted by client` (if emitted)

### 4. Interpret common patterns

- `started` + `completed` with same request ID:
  - backend finished normally, issue is likely client-side playback/abort path.
- `started` + `connection closed before finish`:
  - client disconnected before full response flush.
- browser `AbortError` + backend `connection closed before finish`:
  - expected for user interruption/navigation or explicit fetch abort.

### 5. Fast health probe

If browser behavior is flaky, probe endpoint directly and capture response headers:

```powershell
Invoke-WebRequest -Uri 'http://localhost:5173/api/voice/tts-stream' -Method POST -ContentType 'application/json' -Body '{"text":"diag"}' -UseBasicParsing | Select-Object StatusCode,Headers
```

Look for `StatusCode=200` and a present `x-request-id` header.

## Related Files

- `backend/routes/ai-features.js`
- `backend/routes/companyInterview.js`
- `backend/index.js`
- `frontend/src/api/aiService.js`
- `frontend/src/pages/AIInterviewPage.jsx`
- `frontend/src/hooks/useDeepgramVoice.js`
- `docs/AI_FEATURES_API.md`
- `docs/INTERVIEW_SUITE_API.md`
