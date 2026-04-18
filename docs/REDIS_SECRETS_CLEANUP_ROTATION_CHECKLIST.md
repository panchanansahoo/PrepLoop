# Redis Secrets Cleanup and Rotation Checklist

Use this checklist after provisioning or troubleshooting Redis, especially when credentials may have appeared in terminal output or temporary notes.

## Scope

This checklist covers:
1. Redis password rotation and endpoint revalidation
2. Local environment and deployment secret updates
3. Secret leakage containment and audit follow-up

## Immediate Containment (Do First)

1. Rotate Redis `requirepass` immediately.
2. Update `REDIS_URL` in local backend env and all deployed environments.
3. Restart backend services to load the new runtime configuration.
4. Verify old password no longer works.
5. Verify new password works from backend runtime.

## Environment Update Checklist

1. Update local backend env file:
- [backend/.env](backend/.env)

2. Update deployment environments (same new value everywhere):
- Azure App Service or runtime settings
- Vercel project env vars (if backend runtime references Redis there)
- GitHub Actions environment/repository secrets (if used by workflows)

3. Confirm `USE_REDIS=true` where Redis is expected.

## Exposure Cleanup Checklist

1. Check git tracked files for accidental secret commits:

```powershell
git ls-files backend/.env .env
```

2. Scan working tree for secret-like values:

```powershell
npm run scan:secrets
```

3. Review recent command history and remove sensitive commands where possible.

4. If any secret reached git history, rotate the secret and rewrite history only if required by policy.

5. Confirm no plaintext credentials remain in docs, scripts, or issue comments.

## Rotation Targets Review

Review and rotate any credentials that may have been exposed in local env files or terminal output:

1. `REDIS_URL` / Redis password
2. `JWT_SECRET`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `GROQ_API_KEY`
5. `RAZORPAY_KEY_SECRET`
6. `SMTP_PASS`
7. `DEEPGRAM_API_KEY`
8. `RAPIDAPI_KEY`
9. `ADZUNA_APP_KEY`

Note:
- Rotate only in source systems (provider dashboards/APIs), then update runtime env values.
- Do not commit rotated values into git.

## Post-Rotation Verification

1. Run guardrails script:

```powershell
npm run redis:guardrails
```

2. Validate backend runtime connectivity:

```powershell
Set-Location backend
node --input-type=module -e "import dotenv from 'dotenv'; import { createClient } from 'redis'; dotenv.config(); const c = createClient({ url: process.env.REDIS_URL }); await c.connect(); console.log(await c.ping()); await c.quit();"
```

3. Validate unauthenticated access is denied:

```powershell
az container exec --resource-group preploop-redis-rg --name preploop-redis-aci --container-name preploop-redis-aci --exec-command "redis-cli -h 127.0.0.1 ping"
```

Expected output: `NOAUTH Authentication required.`

## Operational Guardrails

1. Run the guardrail script after every Redis endpoint/password update.
2. Keep env files out of git and prefer managed secret stores (for Azure, use Key Vault).
3. Avoid logging raw connection strings in scripts or CI output.
4. Use private networking for Redis in production when possible.

## Incident Record Template

Record these fields when rotation happens:

1. Date/time of rotation (UTC)
2. Who performed rotation
3. Which environments were updated
4. Verification evidence (PONG check, NOAUTH check)
5. Any follow-up actions required
