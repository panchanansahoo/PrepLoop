# Deployment Secrets Template

Use this checklist to configure secrets in GitHub repository settings for the deployment workflows.

Primary deployment entrypoint:

1. `.github/workflows/deploy-orchestrator-vercel-azure.yml`

The orchestrator calls backend and frontend workflows with `secrets: inherit`, so the same repository/environment secrets are used by both child workflows.

Path:

1. Repository Settings
2. Secrets and variables
3. Actions
4. New repository secret (or environment secret)

Recommended environment names:

1. staging
2. production

## Secrets for Backend Azure Workflow

Workflow: `.github/workflows/deploy-backend-azure.yml`

Required secrets:

1. AZURE_WEBAPP_NAME
2. AZURE_WEBAPP_PUBLISH_PROFILE
3. BACKEND_HEALTHCHECK_URL

Redis runtime settings for the Azure backend app:

1. `USE_REDIS=true`
2. `REDIS_URL=redis://:<password>@<private-ip>:6379`
3. `WEBSITE_VNET_ROUTE_ALL=1`

These are runtime settings for the backend environment, not GitHub secrets.

Examples:

1. AZURE_WEBAPP_NAME=preploop-api-staging
2. BACKEND_HEALTHCHECK_URL=https://api-staging.preploop.com/health

## Secrets for Frontend Vercel Workflow

Workflow: `.github/workflows/deploy-frontend-vercel.yml`

Required secrets:

1. VERCEL_TOKEN
2. VERCEL_ORG_ID
3. VERCEL_PROJECT_ID
4. BACKEND_HEALTHCHECK_URL

Examples:

1. BACKEND_HEALTHCHECK_URL=https://api.preploop.com/health

## Frontend Runtime Variables in Vercel Dashboard

Set these in Vercel project settings instead of GitHub secrets:

1. VITE_API_URL
2. VITE_SUPABASE_URL
3. VITE_SUPABASE_ANON_KEY

## Secrets for Post-Deploy Smoke Workflow

Workflow: `.github/workflows/post-deploy-smoke.yml`

Required secrets:

1. STAGING_BACKEND_HEALTHCHECK_URL
2. PRODUCTION_BACKEND_HEALTHCHECK_URL
3. STAGING_FRONTEND_URL
4. PRODUCTION_FRONTEND_URL

Examples:

1. STAGING_BACKEND_HEALTHCHECK_URL=https://api-staging.preploop.com/health
2. PRODUCTION_BACKEND_HEALTHCHECK_URL=https://api.preploop.com/health
3. STAGING_FRONTEND_URL=https://staging.preploop.com
4. PRODUCTION_FRONTEND_URL=https://preploop.com

## Notes

1. Keep production and staging values different.
2. Never store secret keys in frontend runtime variables.
3. Rotate publish profiles and tokens periodically.
4. Keep Redis credentials in the backend runtime secret store or Azure App Service settings.
