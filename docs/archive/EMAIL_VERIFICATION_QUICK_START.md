# Email Verification: Quick Start Action Plan

## 🎯 Today's Tasks (Phase 1: Local Testing)

Follow these steps in order to test email verification locally.

---

## Step 1: Setup SMTP Credentials (5 min)

### Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already done
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer"
5. **Copy the 16-character password**

### Add to Backend .env

```bash
# Edit backend/.env
cd backend
# Open .env file and add:

SMTP_USER=your-gmail@gmail.com
SMTP_PASS=paste-16-char-password-here
FRONTEND_URL=http://localhost:5173
```

✅ **Status: Environment configured**

---

## Step 2: Verify Database Schema (5 min)

### Check if Migration Already Applied

Open a terminal and run:

```bash
# Check current working directory
pwd
# Should show: C:\Users\panch\Desktop\Preploop

# Check database schema
psql -d preploop -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email_verified', 'verification_token', 'token_expires_at');
"
```

**If you see 3 results:** ✅ Migration already applied, skip to Step 3

**If you see 0 results:** Apply migration:
```bash
cd backend/db
psql -d preploop -f migration_email_verification.sql
```

✅ **Status: Database ready**

---

## Step 3: Start Backend Server (2 min)

```bash
cd backend
npm start
```

**Expected output:**
```
📦 Loading routes...
✅ Routes loaded successfully
🚀 Server running on port 3001
```

✅ **Status: Backend running**

---

## Step 4: Start Frontend Dev Server (2 min)

**In a NEW terminal**, run:

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

✅ **Status: Frontend running**

---

## Step 5: Test Signup Flow (5 min)

### Open Browser

1. Go to http://localhost:5173/signup
2. Fill in form:
   - Email: `testuser@gmail.com`
   - Password: `Test@123456`
   - Full Name: `Test User`
3. Click "Sign Up"

### Expected Result

✅ Success message: "Account created. Check your email to verify."

### Check Email

1. **Open your gmail inbox** (testuser@gmail.com)
2. Look for verification email from `your-gmail@gmail.com`
3. **Copy the verification link** (looks like: `http://localhost:5173/verify-email?token=abc123...&email=testuser@gmail.com`)

**⚠️ If no email received:**
- Check spam folder
- Verify SMTP_USER and SMTP_PASS in backend/.env
- Check backend console for error messages

✅ **Status: Signup working**

---

## Step 6: Test Verification Flow (3 min)

### Option A: Click Email Link

1. Click verification link in email
2. **Expected:** Page shows "Verifying..." then "Email verified successfully"
3. **Expected:** Auto-redirects to login after 3 seconds

### Option B: Manual URL

1. Copy token from email URL
2. Go to: `http://localhost:5173/verify-email?token=YOUR_TOKEN&email=testuser@gmail.com`
3. **Expected:** Same result as Option A

✅ **Status: Verification working**

---

## Step 7: Test Login (3 min)

### After Verification

1. Go to http://localhost:5173/login (or wait for auto-redirect)
2. Enter:
   - Email: `testuser@gmail.com`
   - Password: `Test@123456`
3. Click "Sign In"

### Expected Result

✅ Login successful, redirected to dashboard

### Database Check (Verify)

In terminal, run:
```bash
psql -d preploop -c "
SELECT email, email_verified, verification_token 
FROM profiles 
WHERE email = 'testuser@gmail.com';
"
```

**Expected output:**
```
email              | email_verified | verification_token
testuser@gmail.com | t              | (NULL)
```

✅ **Status: Complete flow working**

---

## Step 8: Test Error Scenarios (5 min)

### Test 8.1: Login Before Verification

Use a NEW email for this:

1. Sign up with: `newuser@gmail.com`
2. **Do NOT verify email**
3. Try to login with same email
4. **Expected:** Error message "Please verify your email"
5. ✅ Click "Resend Verification Email"

### Test 8.2: Invalid Token

1. Go to: `http://localhost:5173/verify-email?token=invalid123&email=testuser@gmail.com`
2. **Expected:** Error message "Invalid or expired verification token"
3. ✅ "Resend" button appears

### Test 8.3: Rate Limiting

1. Go to login page
2. Click "Resend Verification Email" quickly twice
3. **Expected:** 2nd request blocked with 60-second cooldown message
4. ✅ Rate limiting working

✅ **Status: Error handling working**

---

## Testing Checklist

**Local Testing Complete When:**

- [ ] Backend starts without errors
- [ ] Frontend loads without errors
- [ ] Signup form works
- [ ] Verification email received in inbox
- [ ] Verification email has valid link
- [ ] Verification link works (redirects and verifies)
- [ ] Verified user can login
- [ ] Unverified user cannot login (403 error)
- [ ] Resend verification email works
- [ ] Rate limiting prevents rapid resends
- [ ] Database shows email_verified = true after verification

✅ **All checks passed = Testing phase complete**

---

## Troubleshooting

### Problem: "Email not received"

**Solution:**
1. Check console in backend terminal for errors
2. Verify SMTP_USER is correct Gmail address
3. Verify SMTP_PASS is app-specific password (not regular password)
4. Check Gmail spam folder
5. Verify Gmail 2FA is enabled

**Command to check backend logs:**
```bash
# Look for SMTP errors in backend console
# Should see: "✉️ Verification email sent to testuser@gmail.com"
```

### Problem: "Invalid verification link"

**Solution:**
1. Make sure token is copied correctly from email
2. Verify email parameter matches signup email
3. Check that link includes both token and email params
4. Ensure frontend URL is configured correctly in .env

### Problem: "Cannot reach localhost:3001"

**Solution:**
1. Verify backend is running: `npm start` in backend folder
2. Check port 3001 is not in use: `netstat -ano | findstr :3001`
3. Verify you're in backend directory: `cd backend`

### Problem: "Connection refused to database"

**Solution:**
1. Verify PostgreSQL is running
2. Verify database name is correct: `preploop`
3. Check connection string in backend/.env

---

## Next Phase: Deployment

Once local testing is complete:

1. 📖 Read: [EMAIL_VERIFICATION_DEPLOYMENT_GUIDE.md](./EMAIL_VERIFICATION_DEPLOYMENT_GUIDE.md)
2. 🚀 Deploy to production following deployment guide
3. 🔍 Run production smoke tests
4. 📊 Monitor email delivery metrics

---

## Commands Summary

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Check database
psql -d preploop

# Check if migration needed
psql -d preploop -c "
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'email_verified';
"

# Apply migration if needed
cd backend/db && psql -d preploop -f migration_email_verification.sql
```

---

## Estimated Time

| Task | Duration |
|------|----------|
| Setup SMTP | 5 min |
| Check DB | 5 min |
| Start servers | 5 min |
| Test signup | 5 min |
| Test verification | 5 min |
| Test login | 3 min |
| Test errors | 5 min |
| **TOTAL** | **33 min** |

---

## Success Indicators

✅ **Testing successful when:**
- Users can signup
- Verification emails are received
- Email links work
- Verified users can login
- Unverified users are blocked
- All error cases handled gracefully

---

**Status:** Ready for testing  
**Last Updated:** April 2026  
**Next Step:** Follow Step 1 to get started
