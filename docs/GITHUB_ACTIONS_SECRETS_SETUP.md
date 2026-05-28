# GitHub Actions Secrets Setup Guide

This guide walks you through configuring GitHub repository secrets for the Preploop CI/CD pipeline.

## Prerequisites

- GitHub repository access with admin/maintainer permissions
- Backend environment variables (Supabase credentials, API keys, etc.)
- Vercel account setup (for frontend deployment)
- Azure App Service publish profile (for backend deployment)
- GitHub environments named `staging` and `production` for environment-scoped deployment secrets

---

## Step 1: Collect Required Values

Before setting secrets, gather these values:

### Backend Environment Variables (from your .env or configuration)

| Variable | Example | Source |
|----------|---------|--------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase project settings |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase API tokens |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Supabase API tokens (restricted) |
| `JWT_SECRET` | `your-random-secret-32+chars` | Generate: `openssl rand -base64 32` |
| `FRONTEND_URL` | `https://preploop.me` | Your Vercel frontend URL |
| `GROQ_API_KEY` | `gsk_...` | Groq API dashboard |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | `...` | Razorpay dashboard |

### Azure Deployment Secrets

| Secret | Value | Source |
|--------|-------|--------|
| `STAGING_AZURE_WEBAPP_NAME` | `preploop-api-staging` | Azure App Service name |
| `STAGING_AZURE_WEBAPP_PUBLISH_PROFILE` | XML content | Azure portal (Download publish profile) |
| `PRODUCTION_AZURE_WEBAPP_NAME` | `preploop-api-prod` | Azure App Service name |
| `PRODUCTION_AZURE_WEBAPP_PUBLISH_PROFILE` | XML content | Azure portal (Download publish profile) |
| `AZURE_WEBAPP_NAME` | optional fallback | Backward compatibility fallback |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | optional fallback | Backward compatibility fallback |
| `BACKEND_HEALTHCHECK_URL` | `https://preploop-api-staging.azurewebsites.net/health` | Your Azure App Service URL |

### Vercel Secrets

| Secret | Value | Source |
|--------|-------|--------|
| `VERCEL_TOKEN` | `...` | Vercel account settings → Tokens |
| `VERCEL_ORG_ID` | `...` | Vercel project settings |
| `VERCEL_PROJECT_ID` | `...` | Vercel project settings |

### Smoke Test URLs (Post-deployment validation)

| Secret | Value | Branch |
|--------|-------|--------|
| `STAGING_BACKEND_HEALTHCHECK_URL` | `https://preploop-api-staging.azurewebsites.net/health` | develop |
| `PRODUCTION_BACKEND_HEALTHCHECK_URL` | `https://preploop-api-prod.azurewebsites.net/health` | main (after prod setup) |
| `STAGING_FRONTEND_URL` | `https://staging.preploop.me/` | develop |
| `PRODUCTION_FRONTEND_URL` | `https://preploop.me/` | main (after prod setup) |

---

## Step 2: Add Secrets to GitHub

Navigate to your repository on GitHub:

1. **Go to Settings → Secrets and variables → Actions**
2. **Click "New repository secret"** for each value below

### Required Secrets (Add ALL of these)

#### Backend Environment Variables

```
Name: SUPABASE_URL
Value: [Your Supabase project URL]

Name: SUPABASE_ANON_KEY
Value: [Your Supabase anon key]

Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Your Supabase service role key]

Name: JWT_SECRET
Value: [Generate: openssl rand -base64 32]

Name: FRONTEND_URL
Value: [Your Vercel frontend URL, e.g., https://preploop.me]

Name: GROQ_API_KEY
Value: [Your Groq API key]

Name: RAZORPAY_KEY_ID
Value: [Your Razorpay key ID]

Name: RAZORPAY_KEY_SECRET
Value: [Your Razorpay key secret]
```

#### Azure Deployment Secrets

```
Name: STAGING_AZURE_WEBAPP_NAME
Value: preploop-api-staging

Name: STAGING_AZURE_WEBAPP_PUBLISH_PROFILE
Value: [XML content from Azure portal → App Service → Get Publish Profile]

Name: PRODUCTION_AZURE_WEBAPP_NAME
Value: preploop-api-prod

Name: PRODUCTION_AZURE_WEBAPP_PUBLISH_PROFILE
Value: [XML content from Azure portal → App Service → Get Publish Profile]

Name: AZURE_WEBAPP_NAME
Value: [Optional fallback for legacy workflows]

Name: AZURE_WEBAPP_PUBLISH_PROFILE
Value: [Optional fallback for legacy workflows]

Name: BACKEND_HEALTHCHECK_URL
Value: https://preploop-api-staging.azurewebsites.net/health
```

#### Vercel Deployment Secrets

```
Name: VERCEL_TOKEN
Value: [From Vercel Settings → Tokens → Create token]

Name: VERCEL_ORG_ID
Value: [From Vercel project settings]

Name: VERCEL_PROJECT_ID
Value: [From Vercel project settings]
```

#### Smoke Test URLs

```
Name: STAGING_BACKEND_HEALTHCHECK_URL
Value: https://preploop-api-staging.azurewebsites.net/health

Name: STAGING_FRONTEND_URL
Value: https://staging.preploop.me/

Name: PRODUCTION_BACKEND_HEALTHCHECK_URL
Value: https://preploop-api-prod.azurewebsites.net/health

Name: PRODUCTION_FRONTEND_URL
Value: https://preploop.me/
```

---

## Step 3: Get Azure Publish Profile

### How to Download Publish Profile:

1. Go to Azure Portal
2. Navigate to your App Service: `preploop-api-staging`
3. Click **Overview** → **Get Publish Profile** (top right)
4. Open the XML file in a text editor
5. Copy the **entire XML content**
6. Paste into the `AZURE_WEBAPP_PUBLISH_PROFILE` secret

The XML looks like this (you need ALL of it):

```xml
<publishData>
  <publishProfile profileName="preploop-api-staging - Web Deploy" publishMethod="MSDeploy" publishUrl="..." userName="..." userPWD="..." destinationAppUrl="..." SQLServerDBConnectionString="..." mySQLDBConnectionString="..." hostingProviderForumLink="" controlPanelLink="" webSystem="WebSites">
    ...
  </publishProfile>
</publishData>
```

---

## Step 4: Verify Secrets Are Set

Run this command to list secrets (without showing values):

```bash
gh secret list --repo <owner/repo>
```

You should see all secrets listed (values hidden for security).

---

## Step 5: Test the Deployment Pipeline

### Option A: Deploy to Staging (develop branch)

```bash
git add .
git commit -m "test: trigger staging deployment"
git push origin develop
```

Watch the GitHub Actions workflow:
1. Go to your repo → **Actions** tab
2. Click the latest workflow run
3. Watch `deploy-orchestrator-vercel-azure` job
4. Backend deploys first, then frontend

### Option B: Manual Trigger (GitHub UI)

1. Go to repo → **Actions** tab
2. Select **`deploy-orchestrator-vercel-azure`** workflow
3. Click **Run workflow** → Select branch (`develop` or `main`)
4. Click **Run workflow**

---

## Step 6: Monitor Deployment

### During Deployment:
- **Backend deploys** → Waits for health check (`/health` endpoint)
- **Frontend deploys** → Depends on backend success
- **Post-deploy validation** → Smoke tests run automatically

### After Deployment:

1. Check **GitHub Actions** for workflow status
2. Click the job to see detailed logs
3. Look for health check results
4. Verify your app at:
   - **Backend**: `https://preploop-api-staging.azurewebsites.net/health`
   - **Frontend**: `https://staging.preploop.me/`

---

## Troubleshooting

### Secret Not Found Error
- ✅ Verify secret name matches exactly (case-sensitive)
- ✅ Check it's in the right repo (not organization-level)

### Workflow Not Triggering
- ✅ Push to `develop` or `main` branch (not other branches)
- ✅ Check `.github/workflows/deploy-orchestrator-vercel-azure.yml` trigger paths
- ✅ Ensure at least one file matches the path filter

### Health Check Timeout
- ✅ Check backend environment variables are set in Azure App Service
- ✅ Verify `SUPABASE_URL` and `JWT_SECRET` especially
- ✅ Check Azure App Service logs: `az webapp log tail --resource-group preploop-backend --name preploop-api-staging`

### Smoke Test Fails
- ✅ Verify `STAGING_BACKEND_HEALTHCHECK_URL` and `STAGING_FRONTEND_URL` are correct
- ✅ Check frontend is accessible (may be under Vercel IP restrictions)

---

## Next Steps

1. ✅ Add all secrets from Step 2
2. ✅ Verify secrets with `gh secret list`
3. ✅ Push to `develop` branch to trigger workflow
4. ✅ Monitor GitHub Actions for deployment progress
5. ✅ Verify both backend and frontend are live

**Once working, you can deploy to production by pushing to the `main` branch.**
