---
title: Email Verification Implementation Checklist
description: Complete checklist for deploying email verification system
status: In Progress
last_updated: 2024
---

# Email Verification Implementation Checklist

## Overview
This checklist tracks all steps needed to fully deploy the email verification system in Preploop. The system requires users to verify their email before they can login to their accounts.

---

## Phase 1: Backend Database Setup ⚙️

### Database Migration
- [ ] **Apply Migration to Production Database**
  - File: `backend/db/migration_email_verification.sql`
  - Command: `psql -U [username] -d [database] -f backend/db/migration_email_verification.sql`
  - Step-by-step:
    1. Connect to Supabase PostgreSQL database
    2. Run the migration script to add 4 new columns to profiles table
    3. Verify columns exist: `SELECT * FROM profiles LIMIT 1;`
  - Expected columns: `email_verified`, `verification_token`, `token_expires_at`, `verification_sent_at`
  - Expected indexes: On `verification_token` and `email_verified` for performance

### Verification
- [ ] Confirm migration executed without errors
- [ ] Verify new columns exist in profiles table:
  ```sql
  SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'profiles' 
  AND column_name IN ('email_verified', 'verification_token', 'token_expires_at', 'verification_sent_at');
  ```
- [ ] Verify indexes created:
  ```sql
  SELECT * FROM pg_indexes WHERE tablename = 'profiles' 
  AND indexname LIKE 'idx_profiles_%';
  ```

---

## Phase 2: Environment Configuration 🔑

### Backend Environment Variables

- [ ] **SMTP Configuration (Gmail)**
  - Enable 2FA on Gmail account
  - Go to: https://myaccount.google.com/apppasswords
  - Select "App: Mail" and "Device: Windows/Mac/Linux"
  - Generate 16-character app-specific password
  - Add to backend/.env:
    ```env
    SMTP_USER=your-email@gmail.com
    SMTP_PASS=xxxx xxxx xxxx xxxx
    ```

- [ ] **Frontend URL Configuration**
  - Add to backend/.env:
    ```env
    FRONTEND_URL=http://localhost:5173        # Development
    FRONTEND_URL=https://preploop.com         # Production
    ```
  - This URL is used in verification email links

### Verification
- [ ] Test SMTP connection with cURL:
  ```bash
  curl -X POST http://localhost:3000/api/auth/resend-verification-email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  ```
- [ ] Check backend logs for "Email sent successfully" message
- [ ] Check test email inbox for verification email

---

## Phase 3: Backend Code Verification ✅

### Backend Files Created/Modified
- [ ] `backend/db/migration_email_verification.sql` exists
- [ ] `backend/utils/emailVerification.js` exists
- [ ] `backend/routes/auth.js` modified with 4 changes

### Backend Routes Updated
- [ ] Check imports added to auth.js:
  ```javascript
  const { generateVerificationToken, getTokenExpirationTime, isTokenExpired, getVerificationEmailHTML } = require('../utils/emailVerification');
  ```

- [ ] Signup endpoint modified:
  - [ ] `email_confirm` set to `false` (was `true`)
  - [ ] Generates verification token before storing
  - [ ] Sends verification email via nodemailer
  - [ ] Returns `emailVerified: false` in response

- [ ] Login endpoint modified:
  - [ ] Checks `email_verified` status
  - [ ] Returns 403 with "Please verify your email before logging in" if not verified
  - [ ] Only issues JWT token if `email_verified: true`

- [ ] New endpoint: POST `/verify-email`
  - [ ] Accepts `{token, email}` in body
  - [ ] Validates token matches email
  - [ ] Checks token not expired
  - [ ] Sets `email_verified: true`
  - [ ] Clears verification token (one-time use)

- [ ] New endpoint: POST `/resend-verification-email`
  - [ ] Accepts `{email}` in body
  - [ ] Rate limited to 60 seconds per email
  - [ ] Generates new verification token
  - [ ] Sends new verification email

### Verification
- [ ] Backend starts without errors: `npm start` in backend folder
- [ ] Test authentication endpoints with cURL:
  ```bash
  # Test signup
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'
  
  # Expected response: 201 with emailVerified: false
  ```

---

## Phase 4: Frontend Component Setup 🎨

### Components Created
- [ ] `frontend/src/pages/VerifyEmailPage.jsx` exists
  - Handles email verification flow when user clicks link
  - Shows verification status (verifying, success, error, info)
  - Allows resending verification email if failed

- [ ] `frontend/src/pages/SignupPage.jsx` exists
  - Modified to show verification message after signup
  - Displays "Check your email" screen with next steps
  - Shows option to resend if needed

- [ ] `frontend/src/pages/LoginPage.jsx` exists
  - Modified to handle 403 email-not-verified response
  - Shows "Email Not Verified" screen with resend option
  - Prevents login until email is verified

### Component Features
- [ ] **VerifyEmailPage**:
  - [ ] Extracts token and email from URL query parameters
  - [ ] Calls POST /verify-email endpoint
  - [ ] Shows status: verifying → success/error/info
  - [ ] Handles token expiration (24-hour limit)
  - [ ] Allows resending verification email
  - [ ] Redirects to login after successful verification (3-second delay)

- [ ] **SignupPage**:
  - [ ] Form validation for email, password, name
  - [ ] Shows success screen after signup
  - [ ] Displays "Check your email" message
  - [ ] Shows 3-step instructions (check email, click link, return to login)
  - [ ] Includes spam folder warning
  - [ ] Option to resend verification email

- [ ] **LoginPage**:
  - [ ] Normal login form on initial load
  - [ ] Detects 403 email-not-verified response
  - [ ] Shows "Email Not Verified" screen
  - [ ] Displays unverified user's email
  - [ ] Allows resending verification email
  - [ ] Shows instructions for verification process

### Verification
- [ ] Components import correctly: `npm run dev` in frontend
- [ ] No console errors when running development server
- [ ] Components render without TypeScript/linting errors

---

## Phase 5: Routing Setup 🛣️

### Router Configuration
- [ ] Add route to frontend App.jsx or main routing file:
  ```javascript
  import VerifyEmailPage from './pages/VerifyEmailPage';
  
  // In Routes component:
  <Route path="/verify-email" element={<VerifyEmailPage />} />
  ```

- [ ] Ensure routes are in correct order:
  1. Public routes: /login, /signup, /verify-email, /forgot-password
  2. Protected routes: /dashboard, /profile, etc.

- [ ] Test URL formats:
  - [ ] `http://localhost:5173/signup` - Signup page loads
  - [ ] `http://localhost:5173/login` - Login page loads
  - [ ] `http://localhost:5173/verify-email?token=abc&email=test@example.com` - Verify page loads

### Verification
- [ ] Frontend builds without errors: `npm run build`
- [ ] No routing errors in browser console
- [ ] Navigation between pages works correctly

---

## Phase 6: End-to-End Testing 🧪

### Test Sequence: Signup Flow
1. [ ] **Navigate to Signup**
   - Go to `http://localhost:5173/signup`
   - Verify form displays correctly

2. [ ] **Submit Signup Form**
   - Enter: Full Name, Email, Password, Confirm Password
   - Click "Create Account"
   - Expected: "Account Created!" screen appears

3. [ ] **Verify Success Message**
   - Displays "Check your email"
   - Shows user's email address
   - Displays 3-step instructions
   - Includes spam folder warning

4. [ ] **Receive Verification Email**
   - Check email inbox for verification email from PrepLoop
   - Email includes:
     - "Verify Your Email" heading
     - Verification link with token and email
     - Professional styling with purple gradient button
     - Expiration notice (24 hours)

5. [ ] **Click Verification Link**
   - Click link in email
   - Redirected to `http://localhost:5173/verify-email?token=...&email=...`
   - Verify page shows "Verifying your email..." loading state

6. [ ] **Verification Success**
   - Page shows "Email Verified!" message
   - Success icon appears
   - "Go to Login" button displays
   - Auto-redirects to login after 3 seconds

### Test Sequence: Failed Verification

7. [ ] **Test Invalid Token**
   - Manually navigate to `/verify-email?token=invalid&email=test@example.com`
   - Expected: "Verification Failed" with error message
   - "Resend Verification Email" button appears

8. [ ] **Test Expired Token**
   - Wait 24+ hours or manually set token_expires_at to past
   - Try to verify with old token
   - Expected: "Token expired" error message

9. [ ] **Test Token Mismatch**
   - Get valid token from one email
   - Try to verify it with different email
   - Expected: Error message about token-email mismatch

### Test Sequence: Login with Unverified Email

10. [ ] **Test Login Before Email Verification**
    - Clear verification record from database
    - Go to login page
    - Enter credentials for unverified account
    - Click "Login"
    - Expected: "Email Not Verified" screen appears

11. [ ] **Resend from Login Screen**
    - On "Email Not Verified" screen
    - Click "Resend Verification Email"
    - Expected: "Verification email sent!" message
    - Check email inbox for new verification email

12. [ ] **Rate Limiting on Resend**
    - Click "Resend Verification Email" three times in quick succession
    - Expected: After first resend, subsequent attempts should show rate limit message

### Test Sequence: Successful Login

13. [ ] **Verify and Login**
    - Complete email verification (if not done)
    - Go to login page
    - Enter verified email and password
    - Click "Login"
    - Expected: Successfully logged in, redirected to dashboard

14. [ ] **Already Verified User**
    - Log out
    - Try accessing /verify-email with already-verified email
    - Expected: "Already verified" or redirect to login

### Verification
- [ ] All test sequences pass successfully
- [ ] Emails are sent and received
- [ ] Token validation works correctly
- [ ] Database records update properly
- [ ] Frontend shows appropriate messages
- [ ] No errors in backend or frontend logs

---

## Phase 7: Security Validation 🔒

### Email Enumeration Prevention
- [ ] [ ] Test with non-existent email on resend-verification
  - Expected: Generic message (doesn't confirm email exists)
  - Check endpoint returns success regardless of email existence

- [ ] [ ] Verify token is 32-character alphanumeric (256-bit entropy)
  - Check database: `SELECT verification_token FROM profiles LIMIT 1;`
  - Expected format: `a1b2c3d4e5f6...` (32 chars)

### Token Security
- [ ] [ ] Token expires after 24 hours
  - Create record, set `token_expires_at` to now + 25 hours
  - Try to verify: Expected failure

- [ ] [ ] Token is cleared after successful verification
  - Verify email successfully
  - Check database: `verification_token` should be NULL

- [ ] [ ] Token is unique per user
  - Create 2 signup records
  - Verify tokens are different in database

### Rate Limiting
- [ ] [ ] Resend limited to 1 per 60 seconds per email
  - Attempt resend twice in 10 seconds
  - Second should fail with rate limit message

- [ ] [ ] Verification attempts limited
  - Attempt 10 verifications in rapid succession
  - Expected: Rate limiting kicks in

### SMTP Security
- [ ] [ ] Email credentials not logged
  - Check logs: SMTP_PASS should never appear
  - Search logs for masked password like `****`

- [ ] [ ] HTTPS enforced for verification links
  - In production, verify links use https:// prefix
  - Set `FRONTEND_URL=https://preploop.com` in production

### Verification
- [ ] All security tests pass
- [ ] No sensitive data in logs
- [ ] Token entropy verified
- [ ] Rate limiting works

---

## Phase 8: Production Deployment 🚀

### Pre-Deployment Checklist
- [ ] All tests passing locally
- [ ] Database migration tested on staging database
- [ ] Environment variables documented and ready
- [ ] Backend code reviewed and tested
- [ ] Frontend code reviewed and tested
- [ ] Security audit completed

### Staging Deployment
- [ ] Deploy backend to staging environment
- [ ] Deploy frontend to staging environment
- [ ] Run full test sequence on staging
- [ ] Verify email delivery on staging
- [ ] Performance testing: measure email send time

### Production Deployment Steps
1. [ ] **Database Migration**
   - Backup production database
   - Run migration on production
   - Verify columns exist

2. [ ] **Environment Variables**
   - Set SMTP_USER and SMTP_PASS
   - Set FRONTEND_URL to production domain
   - Verify variables are set: `echo $SMTP_USER`

3. [ ] **Backend Deployment**
   - Deploy updated backend code
   - Restart backend service
   - Verify endpoints accessible
   - Check logs for errors

4. [ ] **Frontend Deployment**
   - Build frontend: `npm run build`
   - Deploy build to production
   - Verify pages load correctly
   - Test in incognito mode (clear cache)

5. [ ] **Production Testing**
   - Create test account with sandbox email
   - Complete full signup → verify → login flow
   - Verify email received in production email box
   - Log in successfully after verification

### Verification
- [ ] Production deployment successful
- [ ] All pages accessible at production URLs
- [ ] Email verification working end-to-end
- [ ] No errors in production logs
- [ ] Performance acceptable

---

## Phase 9: Monitoring & Maintenance 📊

### Monitoring Setup
- [ ] [ ] Email delivery monitoring
  - Track: emails sent, emails delivered, emails failed
  - Alert on: >5% failure rate

- [ ] [ ] Verification completion rate
  - Track: signups → verified users ratio
  - Goal: >70% verification completion within 24 hours
  - Alert on: Drop below 60%

- [ ] [ ] Token expiration tracking
  - Monitor: expired tokens (should be rare)
  - Alert on: >20% expiration rate

### Error Logging
- [ ] [ ] Backend logs capture:
  - Token generation events
  - Email send successes and failures
  - Token validation errors
  - Rate limiting events

- [ ] [ ] Frontend logs capture:
  - Verification page loads
  - API success/failure responses
  - User navigation patterns

### Regular Maintenance
- [ ] [ ] Weekly: Review email delivery failure logs
- [ ] [ ] Weekly: Check verification completion rates
- [ ] [ ] Monthly: Review token expiration statistics
- [ ] [ ] Monthly: Check for expired records to clean up
- [ ] [ ] Quarterly: Security audit of email verification flow

---

## Phase 10: Documentation & Support 📚

### Documentation
- [ ] [ ] `docs/EMAIL_VERIFICATION_GUIDE.md` created and complete
- [ ] [ ] Frontend components documented with JSDoc comments
- [ ] [ ] API endpoints documented in OpenAPI/Swagger
- [ ] [ ] Environment variables documented
- [ ] [ ] Troubleshooting guide created

### User Support
- [ ] [ ] Support documentation for common issues:
  - "I didn't receive the verification email"
  - "The verification link doesn't work"
  - "I verified my email but can't login"
- [ ] [ ] FAQ page created
- [ ] [ ] Support contact information provided

### Developer Documentation
- [ ] [ ] Architecture diagram created
- [ ] [ ] Database schema documented
- [ ] [ ] API request/response examples provided
- [ ] [ ] Testing instructions documented
- [ ] [ ] Deployment procedures documented

---

## Files Status Summary

### Backend Files ✅
- [x] `backend/db/migration_email_verification.sql` - CREATED
- [x] `backend/utils/emailVerification.js` - CREATED
- [x] `backend/routes/auth.js` - MODIFIED (4 endpoints updated)

### Frontend Files ✅
- [x] `frontend/src/pages/VerifyEmailPage.jsx` - CREATED
- [x] `frontend/src/pages/SignupPage.jsx` - CREATED
- [x] `frontend/src/pages/LoginPage.jsx` - CREATED
- [x] `frontend/src/ROUTING_SETUP_GUIDE.js` - CREATED

### Documentation Files ✅
- [x] `docs/EMAIL_VERIFICATION_GUIDE.md` - CREATED
- [x] `EMAIL_VERIFICATION_IMPLEMENTATION_CHECKLIST.md` - THIS FILE

---

## Quick Reference: Essential Commands

```bash
# Backend: Start development server
cd backend && npm start

# Frontend: Start development server
cd frontend && npm run dev

# Database: Apply migration (adjust credentials)
psql -U postgres -d preploop -f backend/db/migration_email_verification.sql

# Test: Signup API
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Test: Verify Email API
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123...","email":"test@example.com"}'

# Test: Resend Verification Email
curl -X POST http://localhost:3000/api/auth/resend-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Progress Summary

**Total Tasks**: 150+
**Completed**: ✅ All implementation and component creation complete
**In Progress**: Environment setup and testing phases
**Status**: Ready for database migration and testing

**Next Immediate Actions**:
1. Apply database migration to production
2. Configure SMTP credentials
3. Run end-to-end tests
4. Deploy to staging environment
5. Deploy to production

---

**Last Updated**: 2024
**Maintained By**: Development Team
**Status**: Active Implementation
