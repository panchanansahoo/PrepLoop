# PrepLoop Copilot Instructions

This document guides Copilot sessions working on the PrepLoop repository. For detailed standards on specific subsystems, see the instruction files referenced below.

## Quick Reference

### Build, Test, and Lint Commands

**Root Level**
```bash
npm run install:all          # Install all workspace dependencies
npm run dev                  # Start frontend + backend concurrently
npm run setup               # Bootstrap env files and verify setup
npm run lint                # Lint all (backend + frontend)
npm run lint:fix            # Fix all linting issues
npm run test                # Test all (backend + frontend)
npm run build               # Build frontend for production
npm run audit               # Security audit (omit dev dependencies)
```

**Backend Only** (`backend/` directory)
```bash
npm run dev                 # Start backend with watch mode
npm run test                # Run all backend tests
npm run test:interview:*    # Run specific test suites (state-machine, scoring, orchestration, etc.)
npm run smoke:interview-suite:local  # Smoke test interview features locally
npm run lint                # Lint backend code
npm run format              # Auto-format with Prettier
```

**Frontend Only** (`frontend/` directory)
```bash
npm run dev                 # Start Vite dev server
npm run build               # Build for production + bundle size check
npm run test                # Run unit tests with Vitest
npm run test:watch          # Watch mode for tests
npm run test:e2e            # Run Playwright E2E tests
npm run lint                # Lint React code
npm run lint:fix            # Fix linting issues
```

**Discord Bot** (`discord-bot/` directory)
```bash
npm run discord:dev         # Start bot in watch mode
npm run discord:deploy      # Register/deploy slash commands
```

### Running Single Tests

**Backend:** `node scripts/testVoiceServiceUnit.js` (example; use similar pattern for other tests)

**Frontend:** `npm run test -- [pattern]` (e.g., `npm run test -- auth.test.js`)

## High-Level Architecture

### Monorepo Structure

PrepLoop is organized as a Node.js monorepo with three main services:

- **`frontend/`** — React 18 + Vite 5 SPA deployed on Vercel
- **`backend/`** — Express.js API with PostgreSQL/Redis, deployed on cloud platforms (Azure/Koyeb)
- **`discord-bot/`** — Discord community bot with slash commands
- **`scripts/`** — Content generation and data migration helpers

### Data Flow

```
┌─ Frontend (React + Vite) ──┐
│                             │
│ Calls VITE_API_URL          │ Supabase Auth
│         ↓                   │      ↓
├─ Backend (Express) ─────────┤─ PostgreSQL
│ /api/auth                   │  (via Supabase)
│ /api/dsa                    │
│ /api/ai (Groq)              │
│ /api/voice (TTS/STT)        │
│ /api/interview-suite        │
│ /api/jobs                   │
│ ...                         │
└─────────────┬───────────────┘
              │
         Redis Cache
      (Upstash Cloud)
```

### Key Subsystems

| Subsystem | Location | Purpose |
|-----------|----------|---------|
| **Interview Suite** | `backend/services/interview*` | State machine, scoring, conversation flow for AI interviews |
| **Voice/AI** | `backend/services/voiceService.js`, `aiService.js` | TTS/STT integration (Kokoro, Deepgram, Groq), AI coaching |
| **Auth** | `backend/routes/auth.js`, `middleware/auth.js` | Supabase auth, JWT token management, email verification |
| **Jobs** | `backend/routes/jobs.js`, `services/jobsService.js` | Career Ops, skill-match recommendations, job aggregation |
| **Cache** | `backend/services/interviewCacheManager.js` | Redis serialization, interview state caching |
| **DSA Editor** | `frontend/src/components/DSAEditor`, `backend/routes/dsa.js` | Code editor, test execution, problem library |

### Environment Configuration

**Backend** (`backend/.env`)
- `NODE_ENV`, `PORT`, `FRONTEND_URL`
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- AI: `GROQ_API_KEY`, `GEMINI_API_KEY` (optional)
- Cache: `REDIS_URL` (local) or `UPSTASH_REDIS_REST_URL` (production)
- Integrations: `RAZORPAY_*`, `SMTP_*`, `RAPIDAPI_KEY`, etc.

**Frontend** (`frontend/.env`)
- `VITE_API_URL` — Points to backend (e.g., `http://localhost:5000`)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Key Conventions

### Backend

**Route Patterns**
- Routes use ES Module syntax (`import`/`export`).
- All routes mounted in `backend/index.js` under `/api/*`.
- Handlers are async with centralized try/catch.
- Input validation at route boundaries using `express-validator` or `joi`.

**Middleware Order** (in `backend/index.js`)
1. Security (Helmet, CORS)
2. Request parsing (JSON/URL-encoded)
3. Rate limiting
4. Request ID/tracing
5. Authentication
6. Route handlers

**Database & Migrations**
- Schema changes require prior discussion.
- Migrations placed in `backend/db/` with descriptive naming.
- Include rollback notes in PR descriptions.
- Use forward-only SQL.

**Testing & Verification**
- After changes: run `npm run lint --prefix backend` and `npm run test --prefix backend`.
- For interview suite: `npm run smoke:interview-suite:local --prefix backend`.
- For coin/payment logic: `npm run test:coins --prefix backend`.

**Logging & Observability**
- Use structured logger from `backend/utils/structuredLogger.js` for critical startup logs.
- In production with `disableConsoleLogs()`: console logs with emoji (🚀✅❌⚠️ℹ️) or keywords (listening, error, failed, critical) go to stderr.
- Use Application Insights for cloud telemetry.

**Security Middleware**
- Validate proxy headers with `proxyValidation` middleware before rate limiting.
- Reject untrusted X-Forwarded-For headers to prevent IP spoofing.
- Default `TRUST_PROXY=0` for safety.

**Redis Serialization**
- Always `JSON.stringify()` before storing in Redis.
- Always `JSON.parse()` on retrieval (with fallback for non-JSON values).

### Frontend

**Component & Route Patterns**
- React 18 + Vite architecture; follow existing component structure in `frontend/src`.
- Prefer small, composable components.
- Business logic in services/hooks.
- Styling with Tailwind + Mantine UI components.

**Testing Selectors** (Testing Library)
Prefer in order:
1. `getByRole` / `findByRole`
2. `getByPlaceholderText`
3. `getByText`
4. Avoid `getByLabelText` unless form controls have reliable `htmlFor` association.

**API & Error Handling**
- Reuse patterns from `frontend/src/api`.
- Explicit error handling for async flows; no silent failures.
- User-facing error messages for failed operations.

**Verification After Changes**
- `npm run lint --prefix frontend`
- `npm run test --prefix frontend`
- `npm run build --prefix frontend`
- For cross-cutting: `npm run lint`, `npm run test`, `npm run build` from root.

**Preflight Health Check**
- Uses configured `VITE_API_URL` for health endpoint.
- 5-second timeout via `AbortSignal.timeout()`.
- Relative paths for same-origin APIs.
- Gracefully skips for frontend-only deployments (no blocking interview flow).

### Documentation & API Contracts

- Update API docs when endpoint contracts change:
  - `docs/BACKEND_API_QUICK_REFERENCE.md`
  - `docs/AI_FEATURES_API.md`
  - `docs/INTERVIEW_SUITE_API.md`
- Link to docs instead of duplicating large specs in code comments.
- Large feature documentation belongs in `docs/`, not inline comments.

### TDD & Testing

- Write tests before code (TDD style).
- For bugs: write a failing test first, then fix (Prove-It pattern).
- Test hierarchy: unit > integration > e2e (use the lowest level that captures behavior).
- Run tests after every change before committing.

### Code Quality Gates

Every PR must pass:
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run audit` (security)

### Branching & Commits

- Create feature branches from `main`.
- Use short, descriptive branch names (e.g., `feat/problem-editor-history`).
- Scoped commit messages (e.g., `feat(frontend): add hints reveal tracking`).
- Include Co-authored-by trailer for Copilot sessions.

## Detailed Subsystem Guides

For detailed standards on specific subsystems, see:

- **Backend Standards**: `.github/instructions/backend-standards.instructions.md`
- **Frontend Standards**: `.github/instructions/frontend-standards.instructions.md`
- **Codacy Analysis**: `.github/instructions/codacy.instructions.md`

## Troubleshooting

- **Port 5000 in use?** Backend auto-retries on the next available port.
- **Missing API keys?** Optional integrations (Groq, Razorpay) safely disable without crashing.
- **CORS issues?** Ensure `FRONTEND_URL` in backend matches your active frontend origin.
- **Redis connection?** Local dev uses Docker Redis; production uses Upstash.

## Performance & Caching

- **Interview Cache**: Use `InterviewCacheManager` with proper JSON serialization for Redis.
- **ETag Generation**: Lightweight fingerprints using selective hashing (first 10KB for strings, sorted keys for objects).
- **Code Splitting**: Vite handles automatically; check bundle analysis with `npm run build:check-only`.

## Deployment

- **Frontend**: Vercel (automatic from `main` branch)
- **Backend**: Koyeb, Azure App Service, or similar Node.js platform
- **Database**: Supabase PostgreSQL
- **Cache**: Upstash Redis
- **Docker**: Local dev with `docker-compose.yml`; production uses `Dockerfile` (multi-stage builds)

---

## Interview Suite System

The Interview Suite is PrepLoop's core feature: an AI-powered mock interviewer with dynamic stage progression, real-time feedback, and performance scoring.

### Architecture Overview

**Flow**: User initiate interview → State machine stages (Intake → Warmup → Technical → Follow-up → Challenge → Feedback) → Scoring service evaluates responses → Improvement plan generated.

### Key Services

| Service | File | Purpose |
|---------|------|---------|
| **State Machine** | `backend/services/interviewStateMachine.js` | Manages interview lifecycle and stage transitions |
| **Scoring Service** | `backend/services/interviewScoringService.js` | Evaluates responses against rubrics |
| **Conversation Service** | `backend/services/interviewConversationService.js` | Manages interview conversation history and context |
| **Follow-Up Rules** | `backend/services/interviewFollowUpRules.js` | Generates contextual follow-up questions |
| **Grounding Service** | `backend/services/interviewGroundingService.js` | Anchors responses to company/role context |
| **Telemetry Service** | `backend/services/interviewTelemetryService.js` | Tracks performance metrics and analytics |
| **Prompt Service** | `backend/services/interviewPromptService.js` | Constructs interview prompts with context |

### Stage Progression

Stages are resolved **proportionally** based on interview progress (turns / total questions):

```javascript
// Example: Interview with 13 total questions
- 0–1 turns (0%) → intake (introduction)
- 2–3 turns (20%) → warmup (context-setting)
- 4–7 turns (50%) → technical (core round, DSA/System Design)
- 8–10 turns (75%) → followup (probe deeper)
- 11–12 turns (90%) → challenge (edge cases/pressure)
- 13 turns (100%) → feedback (wrap-up and scoring)
```

When `totalQuestions` is unavailable, fallback to legacy fixed thresholds (turns ≥ 12, ≥ 10, ≥ 7, etc.).

### Interview Types

Each has customized stage plans and prompts:

- **Technical DSA**: Covers data structures, algorithms, complexity analysis
- **Behavioral**: Story deep-dive, leadership probing, pressure scenarios
- **HR**: Background & motivation, culture fit, situational challenges
- **System Design**: Requirements gathering, architecture design, scalability

### Common Patterns

**Accessing Interview State**
```javascript
// From interview conversation service
const state = await getInterviewState(userId, interviewId);
const { stage, turns, context, weakness_areas } = state;
```

**Generating Follow-ups**
```javascript
import { generateFollowUp } from '../services/interviewFollowUpRules.js';
const followUp = await generateFollowUp(userResponse, currentStage, context);
```

**Scoring & Feedback**
```javascript
import { scoringService } from '../services/interviewScoringService.js';
const score = await scoringService.scoreResponse(response, rubric, stage);
```

### Testing Interview Features

Run smoke tests to validate interview flows:

```bash
npm run smoke:interview-suite:local --prefix backend
npm run test:interview:state-machine --prefix backend
npm run test:interview:scoring --prefix backend
npm run test:interview:orchestration --prefix backend
```

### Caching Interview State

Interview state is cached in Redis via `InterviewCacheManager`:

```javascript
import { InterviewCacheManager } from '../services/interviewCacheManager.js';
// Always JSON.stringify before storing, JSON.parse on retrieval
const cached = await cache.getInterviewState(userId);
await cache.setInterviewState(userId, JSON.stringify(state));
```

---

## Voice & AI Integration

PrepLoop supports multiple TTS/STT providers with intelligent fallback and performance tracking.

### TTS Provider Chain

**Priority Order** (returns first available):

1. **Kokoro** — Local, free, no API key needed. Lazy-loaded singleton with 5-minute retry cooldown after failure.
2. **Groq Orpheus** — Cloud-based if `GROQ_API_KEY` set. Fast, lower latency.
3. **Edge TTS** — Microsoft-powered, free, human-like voices. Always available.
4. **Browser Fallback** — Client-side Web Speech API (free forever).

### STT Provider Chain

**Priority Order**:

1. **Deepgram Nova-2** — Removed from backend; now using client-side Web Speech API.
2. **Groq Whisper** — If `GROQ_API_KEY` set.
3. **Browser Web Speech API** — Fallback, always available.

### Provider Configuration

```env
# backend/.env
GROQ_API_KEY=your_groq_api_key  # Enables Groq TTS/Whisper STT
ELEVENLABS_API_KEY=optional     # Not primary, but configurable
OPENAI_API_KEY=optional         # Fallback provider
```

### Service Patterns

**Calling Voice Service**
```javascript
import voiceService from '../services/voiceService.js';

// TTS: Text to speech
const audioPath = await voiceService.synthesize(text, options);

// STT: Speech to text (via Groq/browser)
const transcript = await voiceService.transcribe(audioBuffer);
```

**Provider Fallback & Circuit Breaker**
- Automatic fallback if primary provider fails.
- Circuit breaker cooldown: 60 seconds after consecutive failures.
- Provider stats tracked in `providerStatsService` (success count, latency, fail time).

### Performance Optimization

- Kokoro initialization deferred until first use (lazy loading).
- Shared promise pattern prevents race conditions during initialization.
- Provider stats guide real-time fallback decisions.
- Audio paths validated against system temp directory (security).

### Testing Voice Features

```bash
npm run test:voice:unit --prefix backend
npm run test:voice:telemetry --prefix backend
```

---

## Jobs & Career Ops Features

Career Ops integrates job search, skill matching, and career progression tracking.

### Job Data Sources

**Primary** (via APIs):

- **RapidAPI JSearch** — Requires `RAPIDAPI_KEY`. Broad job coverage.
- **Adzuna** — Requires `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`. India-focused.
- **Indian APIs** — Naukri, Indeed India, Foundit (free, no key needed).

**Fallback**:

- **Curated Job List** — Always available. Populated in `routes/jobs.js` with common Indian companies (TCS, Infosys, Wipro, Amazon, Google, etc.).

### Career Ops Flow

1. User initiates job search with skills/preferences.
2. Backend calls `fetchAllIndianJobs()` or RapidAPI based on available keys.
3. Results cached with rate limiting (`jobCache.js`).
4. If user authenticated, build `CareerOpsHistoryRecord` and persist to Supabase.
5. Return matching jobs + evaluate skill gaps.

### Data Structures

**CareerOpsHistoryRecord**
```javascript
{
  user_id,
  search_query,
  selected_jobs,          // Jobs user bookmarked/clicked
  skill_gap_assessment,   // { needed: [], improve: [] }
  evaluation_timestamp,
  created_at
}
```

### Implementation Notes

- Career Ops routes in `backend/routes/jobs.js`.
- Skill matching via Groq AI if `GROQ_API_KEY` available; else rule-based fallback.
- Rate limit: 30 requests/minute per user for jobs endpoints.
- Jobs always return with `source: 'curated' | 'rapidapi' | 'adzuna' | 'naukri'` for transparency.

### Testing Jobs Features

```bash
npm run smoke:career-ops --prefix backend
npm run smoke:career-ops:history --prefix backend
```

---

## Security Best Practices & Common Vulnerabilities

PrepLoop has hardened defenses against common attack vectors. Be aware of these when making changes:

### Critical Security Fixes

1. **Input Sanitization**
   - DOMPurify middleware on all routes (except webhooks).
   - HTML sanitization for rich text (blogs, notes, feedback).
   - Use `sanitizeHtml()` for user-generated content.

   ```javascript
   import sanitizeHtml from 'sanitize-html';
   const clean = sanitizeHtml(userInput);
   ```

2. **Proxy Header Validation**
   - Validate `X-Forwarded-For` headers before rate limiting.
   - Reject untrusted IPs (public IPs when trust-proxy=1, excessive hops >10).
   - Use `proxyValidation` middleware in `backend/middleware/proxyValidation.js`.

   ```javascript
   // In backend/index.js, order matters!
   app.use(helmet());
   app.use(corsMiddleware);
   app.use(proxyValidation); // BEFORE rate limiting
   app.use(rateLimiter);
   ```

3. **CORS Configuration**
   - No wildcard (`*`). Whitelist specific origins.
   - Local dev: allows `localhost:5173`, `localhost:5174`, `localhost:4173`.
   - Production: matches `FRONTEND_URL` environment variable.

   ```javascript
   // Avoid:
   app.use(cors({ origin: '*' }));
   
   // Good:
   app.use(cors({ origin: process.env.FRONTEND_URL }));
   ```

4. **Rate Limiting**
   - Global: 250 requests / 15 minutes.
   - Auth: 30 requests / 15 minutes (brute-force protection).
   - AI/Voice: 20 requests / minute.
   - Payment: 10 requests / minute.
   - Jobs: 30 requests / minute.

5. **Environment Variables**
   - `JWT_SECRET` and `JWT_REFRESH_SECRET` must be ≥32 characters.
   - Validated at startup; app crashes if missing.
   - Never log or expose in error messages.

   ```bash
   # Check with:
   npm run verify:setup
   ```

6. **Production Logging**
   - Console logs **disabled** in production (no sensitive data leak).
   - Critical logs (🚀✅❌⚠️) redirected to `stderr` via structured logger.
   - Use `createLogger().critical()` for guaranteed visibility.

   ```javascript
   import { createLogger } from '../utils/structuredLogger.js';
   const logger = createLogger();
   logger.critical('Authentication failed for user ${userId}');
   ```

7. **Secrets Scanning**
   - Pre-commit hook scans for exposed credentials.
   - CI/CD runs `npm run scan:secrets` on every push.
   - `.env` files in `.gitignore`; never commit secrets.

   ```bash
   npm run scan:secrets
   ```

8. **Webhook Security**
   - Razorpay webhook endpoints excluded from sanitization.
   - Validate webhook signatures before processing.

### Common Vulnerabilities to Avoid

| Vulnerability | How to Prevent |
|---------------|-----------------|
| **SQL Injection** | Use parameterized queries via Supabase client; never concatenate SQL strings. |
| **XSS (Cross-Site Scripting)** | Always sanitize user input with DOMPurify or `sanitize-html`. |
| **CSRF** | Ensure API routes validate origin headers; never accept requests from unknown origins. |
| **Insecure Direct Object References (IDOR)** | Always verify user owns the resource before returning it. Check `user_id` in auth context. |
| **Exposed Secrets** | Use environment variables, never hardcode keys. Run `npm run scan:secrets`. |
| **Weak Passwords** | Backend enforces bcryptjs hashing (10 rounds) for all password storage. |
| **Missing HTTPS** | Production only. Local dev can use HTTP for testing. |

### Security Audit Commands

```bash
npm run audit                   # Dependency vulnerabilities
npm run scan:secrets            # Check for exposed credentials
npm run security:audit          # Custom security checks
npm run verify:setup            # Env validation
```

---

## Discord Bot Development

The Discord bot extends PrepLoop functionality to a community server with slash commands, daily challenges, and SLA monitoring.

### Architecture

- Discord.js v14 with slash commands.
- Authenticated calls to PrepLoop backend API.
- Local state files for linked accounts and SLA tracking.
- Auto-role assignment and help channel management.

### Setup & Deployment

**Quick Start**:
```bash
npm run discord:install         # Install dependencies
npm run discord:setup-env       # Create .env from template
npm run discord:bootstrap       # Create roles, channels, permissions
npm run discord:deploy          # Register slash commands
npm run discord:dev             # Start with watch mode
```

**Production**:
```bash
npm run discord:start           # Start without watch
npm run discord:doctor          # Validate env + roles + channels
npm run discord:prepare         # One-time preflight (env + doctor)
```

### Core Commands

| Command | Purpose | Auth |
|---------|---------|------|
| `/ping` | Health check | None |
| `/link token:<jwt>` | Link Discord account to PrepLoop user | None |
| `/unlink` | Unlink account | Linked |
| `/daily track:dsa [difficulty]` | Log daily challenge | Linked |
| `/streak` | Show current streak | Linked |
| `/coins` | Show earned coins | Linked |
| `/ask-ai message:<text>` | AI coaching | None |
| `/mock-slots [date]` | List available mock interview slots | Linked |
| `/mock-book slot_id:<id>` | Book a mock interview | Linked |
| `/my-bookings` | View scheduled mocks | Linked |
| `/post-onboarding` | Post role picker panel | Admin |
| `/resolve-thread` | Mark help thread resolved | Staff |
| `/escalate-thread` | Escalate to mentors | Staff |
| `/mentor-remind` | Send mentor reminder | Staff |

### Daily Challenge Auto-Posting

Enable in `discord-bot/.env`:

```env
ENABLE_DAILY_POSTER=true
DAILY_POST_HOUR_UTC=5          # UTC hour (0–23)
DAILY_HINT_DELAY_HOURS=2        # Hint prompt delay
DAILY_EDITORIAL_DELAY_HOURS=6   # Solution delay
```

Posts to (customize with `DAILY_CHANNEL_*` vars):
- `#daily-dsa`
- `#daily-aptitude`
- `#daily-lld`

### Help SLA Monitoring

Enable in `discord-bot/.env`:

```env
ENABLE_HELP_SLA_MONITOR=true
HELP_SLA_MINUTES=45             # SLA timeout
HELP_SLA_RESOLVER_ROLES=Mentor,Moderator,Admin  # Staff roles
```

**Behavior**:
- Scans configured help channels for unresolved threads.
- Pings `Mentor` role if thread unresolved past SLA.
- One ping per thread per day.
- Thread resolved when: `/resolve-thread` runs, name starts with `[resolved]`, or staff posts reply.

### Development Patterns

**Calling Backend API**:
```javascript
import fetch from 'node-fetch';

const response = await fetch(`${PREPLOOP_API_URL}/api/dsa/daily`, {
  headers: {
    'Authorization': `Bearer ${userJwt}`,
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
```

**Linked Account Storage**:
```javascript
// Local file (replace with DB in production)
import { linkStore } from '../linkStore.js';
await linkStore.setLink(discordUserId, prepLoopUserId, jwt);
const userJwt = await linkStore.getLink(discordUserId);
```

**Error Handling**:
```javascript
try {
  await interaction.deferReply();
  const result = await performAction();
  await interaction.editReply({ content: result });
} catch (error) {
  console.error(error);
  await interaction.editReply({ content: `❌ Error: ${error.message}` });
}
```

### Testing & Debugging

```bash
npm run discord:dev             # Watch mode + auto-reload
npm run discord:check           # Quick validation
npm run discord:doctor          # Full diagnostics (env, roles, channels)
```

For production, use encrypted database storage instead of JSON files for linked accounts.

---

## Common Development Gotchas & Debugging

### Backend

**Port Already in Use**
```bash
# Backend auto-retries. Check which port it chose:
# 1. Check logs for "Listening on port X"
# 2. Frontend VITE_API_URL must match that port
# 3. Or kill process: lsof -i :5000 | grep node | awk '{print $2}' | xargs kill -9
```

**Redis Connection Issues**
```bash
# Local dev: Ensure Docker Redis is running
docker-compose up -d redis

# Check connection:
redis-cli -h localhost -p 6379 ping
# Response: PONG

# Production: Use UPSTASH_REDIS_REST_URL instead of REDIS_URL
```

**Supabase Auth Fails**
```javascript
// Issue: anon key has read-only permissions for sensitive tables
// Solution: Use service_role_key in backend for admin operations
import { createClient } from '@supabase/supabase-js';

// Frontend: Read/auth only
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

// Backend: Full access via service role
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

**Interview State Machine Not Progressing**
```javascript
// Check totalQuestions is passed:
const interview = {
  totalQuestions: 13,  // REQUIRED for proportional stage resolution
  turns: 5,            // Current turn count
  // ...
};

// Without totalQuestions, falls back to fixed thresholds
// (turns ≥ 12, ≥ 10, ≥ 7, etc.)
```

**Voice Service Silent Failures**
```javascript
// Kokoro fails silently after init failure. Check circuit breaker:
// - First failure: retries after 5 minutes
// - Logs: "[Kokoro] Retry cooldown elapsed..."
// - Falls through to Groq → Edge TTS → browser API

// Enable provider stats:
npm run test:voice:telemetry --prefix backend
```

### Frontend

**CORS Blocked**
```javascript
// Check backend FRONTEND_URL matches your origin
// backend/.env: FRONTEND_URL=http://localhost:5173

// Frontend must use VITE_API_URL from env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

**Vite Dev Server Not Refreshing**
```bash
# Hard restart:
npm run dev --prefix frontend
# Ctrl+C, then repeat
# Check: http://localhost:5173 loads with HMR active
```

**E2E Tests Timing Out**
```javascript
// Playwright waits up to 30s by default
// For slow networks, extend:
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
```

**Bundle Size Warnings**
```bash
npm run build:check-only --prefix frontend
# Lists oversized chunks; refactor with code splitting or lazy loading
```

### General

**"Cannot find module" After npm install**
```bash
# Clear cache and reinstall:
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

**Env Variables Not Reloading**
```bash
# Stop server (Ctrl+C), update .env, restart
npm run dev

# Or use: npm run verify:setup to validate
```

**Lint/Test Failures Before Commit**
```bash
# Fix automatically:
npm run lint:fix
npm run format

# Re-run to verify:
npm run test
npm run lint
```

---

**Last Updated**: 2026-05-03

For additional context, see `README.md`, `CONTRIBUTING.md`, and `docs/ARCHITECTURE.md`.
