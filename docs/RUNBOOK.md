# PrepLoop Incident & Deployment Runbook

## 1. System Overview & Architecture

PrepLoop is a full-stack technical interview preparation platform:
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide icons, BlockNote/Tiptap editors, Three.js visualization.
- **Backend**: Node.js 22 (Express), PostgreSQL (via Supabase and direct `pg` connection pool), Redis / Upstash caching.
- **Authentication**:
  - Candidate/student accounts: Supabase Auth (`authenticateToken`).
  - HR & Recruiter portal: Dedicated PostgreSQL identity table with custom JWTs signed by `JWT_SECRET` (`hrAuth` and `hrAuthService`).
- **External Integrations**:
  - LLM Providers: Google Gemini (primary), Groq (secondary/voice chat), NVIDIA NIM (optional voice).
  - Voice / Audio: Web Speech API, Whisper fallback, Kokoro TTS / Edge TTS.
  - Payment: Razorpay order creation and HMAC-SHA256 webhook reconciliation.
  - Email: Resend SMTP transactional emails.

---

## 2. Health & Diagnostic Endpoints

The backend exposes several health and telemetry endpoints:
- `GET /health`: Basic liveness check. Returns `{ status: 'ok', uptime, timestamp }`.
- `GET /health/ready`: Readiness probe verifying database and cache connectivity.
- `GET /health/detailed`: Deep inspection including memory usage, event loop lag, and connection pools.
- `GET /api/csrf-token`: Issues double-submit CSRF cookie and token for mutation security.

---

## 3. Incident Triage & Subsystem Troubleshooting

### 3.1 HR Authentication & HR Portal Issues

#### Symptoms
- Recruiter login returns `401 Unauthorized` with `Invalid HR credentials`.
- HR attempts to post jobs or manage interview slots fail with `401` or `403`.
- Server logs show `JWT_SECRET is required` or `DATABASE_URL is not configured`.

#### Root Causes & Diagnostics
1. **Unset or Insecure `JWT_SECRET`**:
   - HR authentication relies on `JWT_SECRET` (at least 32 characters).
   - In production, `startupEnvValidation.js` prevents application boot if `JWT_SECRET` is missing or uses placeholder tokens.
2. **`DATABASE_URL` Misconfiguration**:
   - HR user records and slot allocations query PostgreSQL directly via `backend/config/db.js`.
   - Ensure `DATABASE_URL` points to a reachable Postgres instance (e.g. Supabase connection pooler on port 5432 or 6543).
3. **Middleware Mismatch**:
   - Regular endpoints authenticate candidate tokens via `authenticateToken` (Supabase Auth).
   - HR routes (`/api/hr/*`) must use `hrAuth` / `requireHRRole` (`backend/middleware/hrAuth.js`).

#### Resolution Steps
1. Run `node scripts/generate-jwt-secrets.cjs` to generate cryptographically strong secrets.
2. Verify direct database connectivity:
   ```bash
   node -e "import('pg').then(({Pool}) => new Pool({ connectionString: process.env.DATABASE_URL }).query('SELECT 1').then(() => console.log('DB Connected')).catch(console.error))"
   ```
3. Run HR unit and integration smoke tests:
   ```bash
   cd backend && npx vitest run tests/unit/hrAuth.test.ts tests/integration/hrFlow.test.ts
   ```

---

### 3.2 Supabase & PostgreSQL Incidents

#### Symptoms
- API returns `500 Internal Error` or `503 Service Unavailable`.
- Error logs report `PGRST116` (row not found), `42P01` (relation does not exist), or `Connection terminated unexpectedly`.

#### Resolution Steps
1. **Schema Check**:
   - If tables like `interview_slots` or `interview_bookings` are missing, execute the required migration:
     ```bash
     cd backend && npm run migrate:all
     ```
2. **Connection Pooling**:
   - If encountering `max_connections reached`, switch `DATABASE_URL` in production to the Supabase Supavisor transaction pooler URL (port `6543`).
3. **Verify RLS Policies**:
   - Run database security regression tests:
     ```bash
     cd backend && npx vitest run tests/integration/databaseMigrationAndRls.test.ts
     ```

---

### 3.3 Redis / Upstash Cache Failures

#### Symptoms
- Latency spikes on rate-limited endpoints.
- Error logs report `Redis connection refused` or `UPSTASH_REDIS_REST_URL unreachable`.

#### Fallback Behavior
- The system includes automatic in-memory bounded LRU fallback (`BoundedTtlStore` in `backend/middleware/usageQuota.js`).
- If `ENFORCE_REDIS_QUOTA=true` in production, check network egress and Upstash REST token validity.

#### Resolution Steps
1. Run the Redis guardrail check:
   ```bash
   node scripts/redis-azure-guardrails.mjs
   ```
2. Clear local application cache if memory footprint is high:
   ```bash
   node backend/scripts/clearCache.js
   ```

---

### 3.4 AI Providers (Gemini / Groq / NVIDIA)

#### Symptoms
- `429 Too Many Requests` or `403 PERMISSION_DENIED / CONSUMER_SUSPENDED`.
- Interview scoring or speech feedback falls back to heuristic algorithms.

#### Handling & Fallbacks
- The system incorporates heuristic scoring fallback in `aiService.js` and `voiceIntelligence` when third-party APIs fail.
- When primary Gemini key exceeds free-tier limits, Groq acts as secondary provider.

#### Resolution Steps
1. Verify API keys in `.env`:
   - `GEMINI_API_KEY`: Google AI Studio key.
   - `GROQ_API_KEY`: Groq Console key.
2. Run AI diagnostic smoke test:
   ```bash
   cd backend && npm run test:ai-features
   ```

---

### 3.5 Payment & Razorpay Webhooks

#### Symptoms
- Student pays for mock interview coins or subscription, but coin ledger balance is not updated.
- Webhook returns `400 Invalid Signature`.

#### Resolution Steps
1. Verify `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` are synchronized with Razorpay Dashboard.
2. Reconcile coin ledger manually or check ledger atomicity:
   ```bash
   cd backend && npm run test:coin:atomicity
   cd backend && node scripts/reconcile_coin_balances_via_api.js
   ```

---

### 3.6 Email Delivery (Resend SMTP)

#### Symptoms
- Password reset emails or interview slot confirmation emails not delivered.
- Logs show `SMTP timeout` or `Email cooling down`.

#### Resolution Steps
1. Test SMTP connectivity and credential validity:
   ```bash
   cd backend && npm run smtp:verify
   ```
2. Confirm domain verification for `preploop.me` in Resend dashboard. For test environments, use `EMAIL_FROM="PrepLoop" <onboarding@resend.dev>`.

---

## 4. Pre-Deployment Validation Checklist

Before deploying changes to staging or production, execute the verification suite:

```bash
# 1. Type check and linting
cd backend && npm run type-check && npm run lint
cd ../frontend && npm run lint

# 2. Automated test execution
cd ../backend && npm run test:ci
cd ../frontend && npm run test:ci
cd ../mobile && npm test

# 3. Frontend production build and bundle budget check
cd ../frontend
npm run build
npm run check:bundle
```

---

## 5. Rollback & Emergency Procedures

1. **Frontend Rollback**:
   - Vercel: Promote the previous stable production deployment via the Vercel dashboard or `vercel rollback`.
2. **Backend Rollback**:
   - Render / Docker: Re-deploy previous git SHA or docker image tag.
3. **Database Hotfix**:
   - Database migrations are additive. If an index causes slow queries, drop the specific concurrent index using `backend/db/` rollback scripts.

