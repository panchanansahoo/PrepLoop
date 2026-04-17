# Vercel Build Fix - Exit Code 126 Resolution

## Problem
Vercel production build was failing with **exit code 126** ("command not found or not executable") while local builds succeeded perfectly (3801 modules transformed).

## Root Cause
The monorepo build command `npm run build --prefix frontend` doesn't work reliably in Vercel's containerized build environment. The `--prefix` flag can fail in certain environments, causing the build system to report a "command not found" error.

## Solution Implemented
Created `vercel.json` configuration file with explicit build instructions:

```json
{
  "installCommand": "npm ci && cd frontend && npm ci",
  "buildCommand": "cd frontend && node ./node_modules/vite/bin/vite.js build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "regions": ["iad1"]
}
```

### Key Changes:
1. **installCommand**: Uses deterministic lockfile installs for root and frontend (`npm ci`)
2. **buildCommand**: Invokes Vite via Node (`node ./node_modules/vite/bin/vite.js build`) to bypass executable permission issues on `node_modules/.bin/vite`
3. **outputDirectory**: Explicitly specifies where Vercel should find the production build output
4. **framework**: Set to "vite" for optimal Vercel optimization
5. **regions**: Configured for US East Coast region (iad1)

## Deployment Status
✅ **Commit**: `892158cf` - "fix(vercel): Add explicit build configuration for monorepo deployment"
✅ **Pushed**: Code deployed to GitHub main branch
✅ **Next**: Vercel will automatically trigger a new build using the new configuration

## What to Verify

### 1. Check Vercel Build Logs
- Go to your Vercel project dashboard
- Look for the new build triggered after push
- Expected in logs: `✓ 3801 modules transformed` and `exit code 0 (success)` instead of `126`

### 2. Build Should Show:
```
▲ Building with "cd frontend && node ./node_modules/vite/bin/vite.js build"
✓ 3801 modules transformed
✓ dist folder contains all assets
✓ Deployment succeeds
```

### 3. Environment Variables (if not already set)
Ensure these are configured in Vercel project settings:
- `VITE_API_URL`: Backend API URL
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### 4. Test Production Deployment
Once build succeeds:
- Visit production URL
- Verify all pages load correctly
- Check browser console for any errors
- Test API connectivity to backend

## Why This Works
- **Explicit Over Implicit**: Tells Vercel exactly what to do instead of relying on auto-detection
- **Direct Navigation**: Avoids npm `--prefix` flag issues in container environments
- **Clear Output Path**: Removes any ambiguity about where build artifacts are located
- **Framework Declaration**: Helps Vercel optimize the build process for Vite

## Recovery Plan
If build still fails:
1. Check Vercel build logs for the specific error message
2. Verify Node.js version compatibility (may need to set `.nvmrc` if version conflict)
3. Check environment variables are accessible during build time
4. Review any custom build scripts in package.json files

## Related Changes
- Commit `4a67a58`: Added dynamic import error recovery and service worker enhancements
- This Vercel fix enables that code to reach production successfully
