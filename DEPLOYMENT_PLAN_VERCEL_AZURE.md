# Preploop Deployment Plan: Frontend on Vercel, Backend on Azure

## Objective

Deploy the frontend from `frontend/` to Vercel and the backend from `backend/` to Azure with staging-first rollout, repeatable verification, and rollback steps.

## Current Repo Assumptions

- Monorepo root scripts:
	- `npm run setup`
	- `npm run lint`
	- `npm run test`
	- `npm run build`
- Frontend framework: Vite (output folder `dist`)
- Backend runtime: Node.js Express (ESM)
- Health check endpoint: `/health`

## Deployment Architecture

- Frontend hosting: Vercel project rooted at `frontend/`
- Backend hosting: Azure App Service (recommended simple path) or Azure Container Apps
- Data and third-party services: Supabase, Groq, Razorpay, SMTP, optional Deepgram

## Environment Strategy

Create three isolated environments:

1. `dev` (local only)
2. `staging` (pre-production validation)
3. `prod` (live traffic)

### Frontend Environment Variables (Vercel)

Required:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Rules:

- Only public values should be in `VITE_*`.
- Never put secrets in frontend variables.

### Backend Environment Variables (Azure)

Core:

- `NODE_ENV=production`
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY` (if AI routes are enabled)

Optional by feature:

- `SMTP_USER`, `SMTP_PASS`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `DEEPGRAM_API_KEY`
- jobs provider keys

## Phased Rollout Plan

## Phase 0: Preflight (Same day)

Run quality gates from repo root:

```bash
npm run setup
npm run lint
npm run test
npm run build
```

If backend deployment uses additional checks, run:

```bash
npm --prefix backend run smoke:interview-suite:local
npm --prefix backend run smoke:ai-features
npm --prefix backend run smoke:fresher-technical
```

Acceptance criteria:

- All checks pass.
- No missing env key blockers.

## Phase 1: Azure Staging Backend

Provision and deploy staging backend first.

Suggested azd flow:

```bash
azd auth login
azd env new staging
azd env set FRONTEND_URL https://staging-frontend-domain
azd env set SUPABASE_URL <value>
azd env set SUPABASE_SERVICE_ROLE_KEY <value>
azd env set GROQ_API_KEY <value>
azd provision --preview
azd up
```

Post-deploy checks:

1. Open `https://<staging-backend-domain>/health`
2. Execute backend smoke scripts against staging URL
3. Check logs for startup or auth errors

Acceptance criteria:

- Health endpoint returns success.
- Core API routes respond correctly.

## Phase 2: Vercel Staging Frontend

Create Vercel project:

1. Root directory: `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Install command: `npm install`

Set staging env vars in Vercel:

- `VITE_API_URL=https://<staging-backend-domain>`
- `VITE_SUPABASE_URL=<staging-or-shared-value>`
- `VITE_SUPABASE_ANON_KEY=<staging-or-shared-value>`

Validation:

1. Auth flow
2. Interview flow
3. Jobs flow
4. Any payment or email dependent path used in staging

Acceptance criteria:

- No CORS failures.
- UI loads and API calls complete successfully.

## Phase 3: Production Backend (Azure)

Repeat backend deployment for production with production-only credentials.

Required checks:

1. Health endpoint
2. Smoke checks for critical flows
3. Error logs and latency baseline

Acceptance criteria:

- Production backend stable and reachable.
- No critical errors in startup logs.

## Phase 4: Production Frontend (Vercel)

Set production Vercel variables:

- `VITE_API_URL=https://<prod-backend-domain>`
- `VITE_SUPABASE_URL=<prod-value>`
- `VITE_SUPABASE_ANON_KEY=<prod-value>`

Deploy and run live verification:

1. Home and auth flows
2. Interview suite start and completion path
3. Jobs and profile paths
4. Payments and webhook-dependent paths (if enabled)

Acceptance criteria:

- End-to-end user journey works.
- No spike in 5xx errors.

## CI/CD Plan

PR checks:

1. `npm run setup`
2. `npm run lint`
3. `npm run test`
4. `npm run build`

Main branch release order:

1. Trigger orchestrator workflow `.github/workflows/deploy-orchestrator-vercel-azure.yml`
2. Orchestrator deploys backend to Azure and verifies health
3. Orchestrator deploys frontend to Vercel after backend success
4. Run post-deploy smoke verification

## Security and Operations Guardrails

1. Restrict backend CORS allowlist to approved frontend domains.
2. Store backend secrets in Azure configuration/Key Vault, not in source.
3. Keep frontend variables strictly public.
4. Enable observability (errors, latency, availability).
5. Keep rollback path documented and tested.

## Rollback Plan

Frontend rollback:

1. Revert to previous successful Vercel deployment.

Backend rollback:

1. Revert to previous successful Azure deployment slot/revision.
2. Re-check `/health` and critical APIs.

Rollback triggers:

1. Sustained 5xx errors
2. Broken auth or critical payment flow
3. Severe latency regression

## Go-Live Checklist

1. Backend deployed and healthy in production
2. Frontend configured to production API URL
3. CORS verified for production frontend origin
4. Logs and alerts active
5. Team notified with rollback owner and response path

## Ownership and Timeline

Suggested execution:

1. Day 1: Phase 0 and Phase 1
2. Day 2: Phase 2 and full staging test
3. Day 3: Phase 3 and Phase 4 production rollout

Suggested owners:

1. Backend owner: Azure deploy and API verification
2. Frontend owner: Vercel config and UI verification
3. Release owner: Go-live orchestration and rollback decision
