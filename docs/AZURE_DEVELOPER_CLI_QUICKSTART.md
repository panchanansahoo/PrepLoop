# Azure Developer CLI (azd) Quick Start

This guide walks you through using **Azure Developer CLI (azd)** to deploy Preploop backend and infrastructure to Azure.

## Benefits of Using azd

✅ Automated infrastructure provisioning (Bicep)  
✅ Proper Node.js build orchestration (npm install, npm start)  
✅ Environment variable management  
✅ Health checks and validation  
✅ One-command deployment: `azd up`

---

## Prerequisites

- **Azure Developer CLI** installed: `winget install -e --id Microsoft.Azure.DeveloperCLI`
- **Azure CLI** installed: `winget install -e --id Microsoft.AzureCLI`
- **Authenticated with Azure**: Run `az login` (use device code if needed)
- **Git** available in PATH

---

## Step 1: Initialize azd Project

Run this from the Preploop repository root:

```bash
cd c:\Users\panch\Desktop\Preploop
azd init
```

**When prompted:**

```
Environment name: (default) 
→ staging

Location: 
→ Central India
```

This creates an `azure.yaml` file (already provided in the repo).

---

## Step 2: Set Environment Variables

### Option A: Using `.env` file (Recommended)

Create `.env` in the repository root:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Security
JWT_SECRET=your-random-secret-min-32-chars

# Frontend
FRONTEND_URL=https://preploop.vercel.app

# AI & Payments
GROQ_API_KEY=gsk_...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Node Environment
NODE_ENV=production
```

### Option B: Using `azd env` commands

```bash
azd env set SUPABASE_URL "https://xxxxx.supabase.co"
azd env set SUPABASE_ANON_KEY "eyJhbGc..."
azd env set SUPABASE_SERVICE_ROLE_KEY "eyJhbGc..."
azd env set JWT_SECRET "your-random-secret-min-32-chars"
azd env set FRONTEND_URL "https://preploop.vercel.app"
azd env set GROQ_API_KEY "gsk_..."
azd env set RAZORPAY_KEY_ID "rzp_live_..."
azd env set RAZORPAY_KEY_SECRET "..."
azd env set NODE_ENV "production"
```

Verify with:

```bash
azd env list
```

---

## Step 3: Validate Infrastructure Plan (What-If)

Before deploying, see what resources will be created:

```bash
azd provision --preview
```

**Output should show:**
- Resource group: `preploop-backend`
- App Service plan: `preploop-backend-plan`
- Web app: `preploop-api-staging`
- Location: `Central India`

---

## Step 4: Provision Infrastructure

Create Azure resources:

```bash
azd provision
```

**This will:**
1. Create resource group (if not exists)
2. Create App Service plan (Linux, B1)
3. Create Web App
4. Configure Node.js 20 LTS runtime
5. Set startup command: `npm start`

**Expected output:**
```
Successfully provisioned resources.
Outputs:
  resourceGroupName: preploop-backend
  webAppUrl: https://preploop-api-staging.azurewebsites.net
```

---

## Step 5: Deploy Application

Deploy the backend code:

```bash
azd deploy
```

**This will:**
1. Build backend (`npm run build` if exists)
2. Upload code to Azure
3. Run `npm install` on Azure
4. Start application with `npm start`
5. Wait for health check to pass

**Expected output:**
```
Deploying services...
  api (preploop-api-staging) ✓

Your application is successfully deployed.
You can view the application at: https://preploop-api-staging.azurewebsites.net
```

---

## Step 6: Verify Deployment

### Check Health Endpoint

```bash
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") ; `
curl https://preploop-api-staging.azurewebsites.net/health
```

**Expected response:**
```json
{"status":"ok"}
```

### View Application Logs

```bash
azd monitor --overview
```

Or via Azure CLI:

```bash
az webapp log tail --resource-group preploop-backend --name preploop-api-staging
```

---

## Step 7: One-Command Full Deployment (After First Setup)

To redeploy after code changes:

```bash
azd up
```

This runs:
1. `azd provision` (if needed)
2. `azd deploy`
3. Validates health check

---

## Common Commands

```bash
# Show current environment
azd env list

# Set a variable
azd env set KEY value

# Remove a variable
azd env set KEY --unset

# Provision infrastructure only
azd provision

# Deploy code only
azd deploy

# Full deployment (provision + deploy + validate)
azd up

# View logs
azd monitor --overview

# Tear down resources
azd down
```

---

## Troubleshooting

### "Azure CLI not found"
```bash
winget install -e --id Microsoft.AzureCLI
```

### "Device code error" during authentication
```bash
azd auth login
```

### Deployment times out
- Check environment variables are set: `azd env list`
- Check backend logs: `azd monitor --overview`
- Verify Supabase connectivity

### Health check fails
- Backend needs: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`
- Check Azure App Service environment variables:
  ```bash
  az webapp config appsettings list --resource-group preploop-backend --name preploop-api-staging
  ```

### Redeploy with updated code
```bash
git add .
git commit -m "fix: update backend"
git push
azd deploy
```

---

## Next Steps

1. ✅ Run `azd init` if not done
2. ✅ Set environment variables (`.env` or `azd env set`)
3. ✅ Run `azd provision --preview` to validate
4. ✅ Run `azd provision` to create resources
5. ✅ Run `azd deploy` to deploy code
6. ✅ Verify at `https://preploop-api-staging.azurewebsites.net/health`

**For CI/CD:** Use GitHub Actions with the orchestrator workflow (see GITHUB_ACTIONS_SECRETS_SETUP.md)
