# Email Verification Deployment Guide

## Overview

This guide walks through deploying the email verification system from development to production.

**Time Required:** 30-45 minutes  
**Downtime:** Minimal (migrations run during off-peak hours)

---

## Pre-Deployment Checklist

- [ ] All testing completed (see EMAIL_VERIFICATION_TESTING_GUIDE.md)
- [ ] Database backup created
- [ ] SMTP credentials obtained (Gmail app password)
- [ ] Production domain identified (e.g., preploop.com)
- [ ] Staging environment tested (if available)
- [ ] Team notified of deployment window
- [ ] Rollback plan understood

---

## Phase 1: Database Migration (DO THIS FIRST ⚠️)

### 1.1 Backup Production Database

**CRITICAL: Always backup before migrations**

```bash
# Using pg_dump (PostgreSQL)
pg_dump -h your-prod-host -U postgres -d preploop > preploop_backup_$(date +%Y%m%d_%H%M%S).sql

# Using Supabase Dashboard
# Navigate to Project Settings → Backups → Create Manual Backup
```

### 1.2 Check Current Schema

```sql
-- Run in production database
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email_verified', 'verification_token', 'token_expires_at', 'verification_sent_at');

-- If no results, migration not yet applied
-- If 4 results, migration already applied
```

### 1.3 Apply Migration

**Option A: Using psql CLI**

```bash
cd backend/db

# Connect to production database
psql -h your-prod-host \
     -U postgres \
     -d preploop \
     -f migration_email_verification.sql

# Should see output:
# ALTER TABLE
# CREATE INDEX
# CREATE INDEX
```

**Option B: Using Supabase SQL Editor**

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of `backend/db/migration_email_verification.sql`
4. Execute query
5. Verify success

**Option C: Using PgAdmin**

1. Connect to production database
2. Open Query Tool
3. Paste migration SQL
4. Execute
5. Verify in Table Structure

### 1.4 Verify Migration Success

```sql
-- Run this query to verify
SELECT 
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email_verified') as has_email_verified,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='verification_token') as has_verification_token,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='token_expires_at') as has_token_expires_at,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='verification_sent_at') as has_verification_sent_at,
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_name='profiles' AND indexname='idx_profiles_verification_token') as has_token_index,
  EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_name='profiles' AND indexname='idx_profiles_email_verified') as has_verified_index;

-- All should return TRUE
```

✅ **Migration Status: Success if all TRUE**

---

## Phase 2: Environment Variables

### 2.1 Obtain SMTP Credentials

**For Gmail (Recommended):**

1. Enable 2-Factor Authentication on Gmail account
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. Generate App-Specific Password
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail / Device Type: Windows Computer
   - Copy the 16-character password
   - This is your SMTP_PASS

**Alternative: Use Organization Email**
- Contact your email admin for SMTP credentials
- Request SMTP host, port (usually 587), username, password

### 2.2 Configure Production Environment

**Update backend/.env for production:**

```env
# Email Configuration
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FRONTEND_URL=https://preploop.com

# Keep existing variables
SUPABASE_URL=your-prod-supabase-url
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

### 2.3 Update Frontend Environment

**No changes needed.** Frontend auto-detects API endpoint.

---

## Phase 3: Backend Deployment

### 3.1 Deploy Updated Backend Code

**Option A: Using Git (Recommended)**

```bash
# On production server
cd /path/to/preploop/backend

# Pull latest code
git pull origin main

# Install dependencies (if new deps added)
npm install

# Restart backend server
pm2 restart preploop-backend  # or your process manager
# Alternative: systemctl restart preploop-backend
```

**Option B: Manual File Upload**

1. Archive updated files:
   ```bash
   zip -r backend-update.zip backend/
   ```

2. Upload to production server
3. Extract and backup old files
4. Copy new files over
5. Restart backend process

### 3.2 Verify Backend Started Successfully

```bash
# Check logs
pm2 logs preploop-backend

# Should see:
# ✅ Routes loaded successfully
# 🚀 Server running on port 3001
```

---

## Phase 4: Frontend Deployment

### 4.1 Build Production Frontend

```bash
cd frontend

# Ensure latest code
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build

# Creates dist/ folder with optimized assets
```

### 4.2 Deploy Static Files

**Option A: Using Web Server (Nginx/Apache)**

```bash
# Copy build output to web server directory
cp -r frontend/dist/* /var/www/preploop/

# Verify permissions
chown -R www-data:www-data /var/www/preploop/

# Reload web server
systemctl reload nginx  # or: systemctl reload apache2
```

**Option B: Using Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod

# Copy deployment URL
# Configure custom domain in Vercel dashboard
```

**Option C: Using Docker**

```bash
# Build Docker image
docker build -t preploop-frontend .

# Push to registry
docker push your-registry/preploop-frontend:latest

# Deploy via your orchestration tool
# (Kubernetes, Docker Swarm, etc.)
```

### 4.3 Verify Frontend Deployed

```bash
# Visit https://preploop.com/signup
# Should load without errors
# Check browser console (F12) for no errors
```

---

## Phase 5: Router Configuration (If Using Email Verification)

### 5.1 Ensure Public Routes Configured

**Frontend Router must include:**

```javascript
// These routes MUST be public (no authentication required)
<Route path="/verify-email" element={<VerifyEmailPage />} />
<Route path="/signup" element={<SignupPage />} />
<Route path="/login" element={<LoginPage />} />
```

### 5.2 Verify Route Configuration

1. Open DevTools (F12)
2. Go to https://preploop.com/verify-email?token=test&email=test@example.com
3. Should display verification page (not redirect to login)
4. Go to https://preploop.com/signup
5. Should display signup form

---

## Phase 6: Production Testing

### 6.1 Quick End-to-End Test

**Use Production URL (preploop.com):**

1. Go to https://preploop.com/signup
2. Sign up with test email
3. Check verification email in production email account
4. Click verification link
5. Should verify successfully
6. Login with same credentials
7. Should login successfully

### 6.2 Production API Tests

```bash
# Test signup
curl -X POST https://preploop.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prod-test@gmail.com",
    "password": "Test@123456",
    "fullName": "Prod Test"
  }'

# Test unverified login
curl -X POST https://preploop.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prod-test@gmail.com",
    "password": "Test@123456"
  }'

# Should return 403 with unverified error
```

### 6.3 Email Delivery Verification

**Checklist:**
- [ ] Verification email received
- [ ] Email from correct sender (SMTP_USER)
- [ ] Email not marked as spam
- [ ] Verification link works
- [ ] Link opens verification page
- [ ] Verification succeeds

---

## Phase 7: Monitoring & Alerts

### 7.1 Setup Email Delivery Monitoring

**Monitor These Metrics:**

1. **Verification Email Sent Count**
   ```sql
   -- Count emails sent in last 24 hours
   SELECT COUNT(*) as emails_sent
   FROM profiles
   WHERE verification_sent_at > NOW() - INTERVAL '24 hours';
   ```

2. **Verification Success Rate**
   ```sql
   -- Count verified vs unverified new users
   SELECT 
     COUNT(*) as total_new_users,
     SUM(CASE WHEN email_verified THEN 1 ELSE 0 END) as verified,
     SUM(CASE WHEN NOT email_verified THEN 1 ELSE 0 END) as unverified
   FROM profiles
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

3. **Failed Verification Attempts**
   - Monitor backend logs for `/verify-email` errors
   - Track invalid/expired token errors

### 7.2 Setup Email Alerts

**Alert if:**
- SMTP connection fails (500+ errors from /signup)
- Verification success rate < 80%
- No emails sent in last 6 hours

### 7.3 Backend Monitoring

```bash
# Monitor logs for email errors
tail -f /var/log/preploop/backend.log | grep -i "email\|smtp\|verification"

# Check error rate
grep -c "error\|Error\|ERROR" /var/log/preploop/backend.log
```

---

## Phase 8: Rollback Plan (If Needed)

### 8.1 Rollback Database Schema

**If email verification causes issues:**

```sql
-- Drop new columns
ALTER TABLE profiles 
DROP COLUMN IF EXISTS verification_sent_at;
ALTER TABLE profiles 
DROP COLUMN IF EXISTS token_expires_at;
ALTER TABLE profiles 
DROP COLUMN IF EXISTS verification_token;
ALTER TABLE profiles 
DROP COLUMN IF EXISTS email_verified;

-- Drop indexes
DROP INDEX IF EXISTS idx_profiles_verification_token;
DROP INDEX IF EXISTS idx_profiles_email_verified;
```

### 8.2 Rollback Backend Code

```bash
cd /path/to/preploop/backend

# Revert to previous version
git revert <commit-hash>
git push origin main

# Restart backend
pm2 restart preploop-backend
```

### 8.3 Rollback Frontend Code

```bash
# Revert to previous deployment
# Vercel: Go to deployments, click "Promote to Production"
# Manual: Restore from previous build
cd frontend
git checkout HEAD~1
npm install && npm run build
# Deploy restored build
```

---

## Phase 9: Post-Deployment Verification

### 9.1 24-Hour Health Check

**After deployment, monitor for 24 hours:**

- [ ] No spike in 500 errors
- [ ] Email delivery working normally
- [ ] Users can signup successfully
- [ ] Users receive verification emails
- [ ] Verification flow works end-to-end
- [ ] Login enforcement working

### 9.2 Week 1 Monitoring

**Monitor these metrics:**

```sql
-- Signup trends
SELECT DATE(created_at) as date, COUNT(*) as signups
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at);

-- Verification trends
SELECT 
  DATE(verification_sent_at) as date,
  COUNT(*) as emails_sent,
  SUM(CASE WHEN email_verified THEN 1 ELSE 0 END) as verified
FROM profiles
WHERE verification_sent_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(verification_sent_at);

-- Unverified users (potential issue if too high)
SELECT COUNT(*) as unverified_users
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'
AND NOT email_verified;
```

### 9.3 User Feedback

- Monitor for bug reports related to verification
- Check support tickets for email issues
- Monitor email delivery status

---

## Deployment Timeline

| Phase | Task | Duration | Owner |
|-------|------|----------|-------|
| 1 | Database backup | 5 min | DevOps |
| 1 | Migration execution | 5 min | DevOps |
| 1 | Schema verification | 5 min | QA |
| 2 | Environment setup | 5 min | DevOps |
| 3 | Backend deployment | 10 min | DevOps |
| 4 | Frontend build | 10 min | DevOps |
| 4 | Frontend deployment | 10 min | DevOps |
| 5 | Router verification | 5 min | QA |
| 6 | End-to-end testing | 15 min | QA |
| 7 | Monitoring setup | 10 min | DevOps |
| **Total** | | **95 min** | |

---

## Deployment Commands (Quick Reference)

```bash
# Step 1: Backup
pg_dump -h prod-host -U postgres -d preploop > backup_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Database migration
psql -h prod-host -U postgres -d preploop -f backend/db/migration_email_verification.sql

# Step 3: Backend deploy
cd backend && git pull && npm install && pm2 restart preploop-backend

# Step 4: Frontend build & deploy
cd frontend && npm install && npm run build && # copy to web server or deploy to Vercel

# Step 5: Verify
curl https://preploop.com/api/auth/health
curl https://preploop.com/signup
```

---

## Contact & Support

**During Deployment:**
- DevOps Contact: [your-devops-contact]
- Escalation: [your-escalation-contact]

**After Deployment:**
- Monitor: [your-monitoring-url]
- Alerts: [alert-contact-info]
- Logs: [your-log-aggregation-tool]

---

## Success Criteria

✅ **Deployment is successful when:**

1. Database migration applied without errors
2. Backend starts successfully with new routes
3. Users can signup and receive verification emails
4. Verification links work correctly
5. Email verified users can login
6. Unverified users cannot login (403 error)
7. No increase in error rates
8. Email delivery success rate > 95%

✅ **Deployment is complete when all criteria met**

---

## Next Steps

1. ✅ All testing completed
2. ✅ Environment variables configured
3. ✅ Database migration applied
4. ✅ Backend deployed
5. ✅ Frontend deployed
6. ✅ Monitoring active
7. ➡️ **Monitor for 24-48 hours**
8. ➡️ **Announce to user base**
9. ➡️ **Ongoing maintenance**

---

**Last Updated:** April 2026  
**Version:** 1.0  
**Status:** Production Ready
