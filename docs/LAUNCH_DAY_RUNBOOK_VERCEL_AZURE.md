# Launch Day Runbook: Vercel Frontend + Azure Backend

## Purpose

This runbook is the operator guide for releasing Preploop with frontend on Vercel and backend on Azure.

## Roles

1. Release Owner: Coordinates sequence and go/no-go decisions.
2. Backend Owner: Runs Azure backend deployment and health verification.
3. Frontend Owner: Runs Vercel deployment and UI verification.
4. Observer: Monitors logs and records timeline/events.

## Required GitHub Environments

Create both environments in repository settings:

1. `staging`
2. `production`

Recommended protection:

1. Required reviewers for `production`
2. Restrict deployment branches

## Required Secrets

Set environment-scoped secrets.

### Staging secrets

1. `AZURE_WEBAPP_NAME`
2. `AZURE_WEBAPP_PUBLISH_PROFILE`
3. `BACKEND_HEALTHCHECK_URL`
4. `VERCEL_TOKEN`
5. `VERCEL_ORG_ID`
6. `VERCEL_PROJECT_ID`

Redis runtime settings for Azure backend:

1. `USE_REDIS=true`
2. `REDIS_URL=redis://:<password>@10.50.2.4:6379`
3. `WEBSITE_VNET_ROUTE_ALL=1`

Note:
1. Redis is deployed privately in Azure Container Instances on the `redis-subnet` delegated subnet.
2. The backend App Service is VNet-integrated through `appservice-integration`.
3. Local development should keep `USE_REDIS=false` unless you are on the Azure VNet.

### Production secrets

1. `AZURE_WEBAPP_NAME`
2. `AZURE_WEBAPP_PUBLISH_PROFILE`
3. `BACKEND_HEALTHCHECK_URL`
4. `VERCEL_TOKEN`
5. `VERCEL_ORG_ID`
6. `VERCEL_PROJECT_ID`

## Preconditions (T-60 to T-30)

1. Confirm branch is correct (`develop` for staging, `main` for production).
2. Confirm no pending critical migrations.
3. Confirm external service status (Supabase, Groq, payment provider, email provider).
4. Confirm team communication channel is active.
5. Confirm rollback owner is on call.

## Release Sequence

## Step 1: Trigger Orchestrated Deployment

Trigger workflow:

- `.github/workflows/deploy-orchestrator-vercel-azure.yml`

Expected result:

1. Backend lint and tests pass.
2. Azure deployment succeeds.
3. Backend health check passes on configured URL.
4. Frontend tests/build pass.
5. Vercel deployment succeeds.

Stop conditions:

1. Health check fails after retries.
2. Continuous 5xx after deploy.
3. Frontend build or deploy fails.

## Step 2: Fallback Manual Deployment (Only if Needed)

Use these only if orchestration is intentionally bypassed:

1. `.github/workflows/deploy-backend-azure.yml`
2. `.github/workflows/deploy-frontend-vercel.yml`

Expected result:

1. Frontend tests/build pass.
2. Backend health gate passes.
3. Vercel deployment completes.

Stop conditions:

1. Backend health gate fails.
2. Build or deploy fails.

## Azure Redis Operations

Before a release, verify Redis is healthy and the backend can reach it through the private network.

1. Run standard Redis guardrails:

```powershell
npm run redis:guardrails
```

2. Run strict Redis guardrails:

```powershell
npm run redis:guardrails:strict
```

Expected result:

1. Standard guardrails pass.
2. Strict guardrails pass when Redis is private-only.
3. Backend app settings contain `USE_REDIS`, `REDIS_URL`, and `WEBSITE_VNET_ROUTE_ALL=1`.

If Redis is public, treat that as a release blocker for production.

## Step 3: Post-Deploy Verification (Manual)

Run these checks in order:

1. Home page load and navigation
2. Login/signup
3. Interview flow start and completion
4. Jobs list and job detail interactions
5. Profile/dashboard data load
6. Payment path if enabled

Also confirm smoke workflow result:

1. `.github/workflows/post-deploy-smoke.yml` completes successfully
2. Auto-trigger applies to orchestrated deploys from `develop` and `main`

## Monitoring Window (T+0 to T+60)

1. Watch backend application logs for error spikes.
2. Watch frontend runtime errors.
3. Track API latency and error rate.
4. Keep release channel updated every 10-15 minutes.

## Rollback Procedure

Rollback immediately when any critical flow is broken.

1. Frontend rollback: redeploy previous stable Vercel deployment.
2. Backend rollback: redeploy previous Azure app package/revision.
3. Re-run health checks.
4. Post rollback status update in release channel.

## Incident Template

Use this message format:

1. `Issue`: one-line summary
2. `Impact`: who/what is affected
3. `Action`: rollback or fix-forward path
4. `ETA`: next update time

## Sign-Off Checklist

1. Backend health stable for 60 minutes
2. Frontend critical user journeys pass
3. No unresolved P1/P2 issues
4. Release owner confirms completion
5. Timeline notes archived in release log
