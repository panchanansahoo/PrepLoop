# Email Verification Testing Guide

## Phase 1: Pre-Testing Setup

### 1.1 Environment Configuration

Before testing, ensure your backend `.env` file has SMTP credentials:

```bash
# backend/.env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Getting Gmail App Password:**
1. Enable 2FA on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password
5. Add to backend/.env as `SMTP_PASS`

### 1.2 Database Migration

**Check if migration has been applied:**

```sql
-- Run in your database client (psql)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email_verified', 'verification_token', 'token_expires_at');

-- Should return 3 rows
```

**If not applied, run migration:**

```bash
cd backend/db
psql -U postgres -d your_db_name -f migration_email_verification.sql
```

---

## Phase 2: Backend Testing

### 2.1 Start Backend Server

```bash
cd backend
npm install  # if not already done
npm start
```

Expected output:
```
✅ Routes loaded successfully
🚀 Server running on port 3001
```

### 2.2 Test Endpoints with cURL

#### Test 2.2.1: Signup (Creates Account + Sends Email)

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@gmail.com",
    "password": "Test@123456",
    "fullName": "Test User"
  }'
```

**Expected Response:**
```json
{
  "message": "Account created. Verification email sent to testuser@gmail.com",
  "user_id": "uuid-here"
}
```

**Verification:**
- ✅ Check your email (testuser@gmail.com) for verification link
- ✅ Link should be in format: `http://localhost:5173/verify-email?token=<32-char-hex>&email=testuser@gmail.com`
- ✅ Database should have token stored in profiles table

#### Test 2.2.2: Login Before Verification (Should Fail)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@gmail.com",
    "password": "Test@123456"
  }'
```

**Expected Response:**
```json
{
  "error": "Please verify your email before logging in",
  "code": "UNVERIFIED_EMAIL"
}
```

HTTP Status: **403 Forbidden**

#### Test 2.2.3: Verify Email (Extract Token from Email)

From the verification email, extract:
- `token` (32-char hex string)
- `email` (testuser@gmail.com)

```bash
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "extracted-32-char-token",
    "email": "testuser@gmail.com"
  }'
```

**Expected Response:**
```json
{
  "message": "Email verified successfully"
}
```

**Verification:**
- ✅ Database: email_verified = true
- ✅ Database: verification_token = NULL (cleared)

#### Test 2.2.4: Login After Verification (Should Succeed)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@gmail.com",
    "password": "Test@123456"
  }'
```

**Expected Response:**
```json
{
  "token": "jwt-token-here",
  "user_id": "uuid-here",
  "email": "testuser@gmail.com"
}
```

#### Test 2.2.5: Resend Verification Email

```bash
curl -X POST http://localhost:3001/api/auth/resend-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new-test@gmail.com"
  }'
```

**Expected Response:**
```json
{
  "message": "Verification email resent successfully"
}
```

**Verification:**
- ✅ New token generated
- ✅ Token updated in database
- ✅ Email received with new link

### 2.3 Rate Limiting Test

**Test Rate Limiting (60-second cooldown):**

```bash
# First resend request - should succeed
curl -X POST http://localhost:3001/api/auth/resend-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com"}'

# Immediately try again within 60 seconds
curl -X POST http://localhost:3001/api/auth/resend-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com"}'
```

**Expected Response on 2nd Request:**
```json
{
  "error": "Please wait before requesting another verification email"
}
```

HTTP Status: **429 Too Many Requests**

### 2.4 Error Scenarios

#### Test 2.4.1: Invalid Token

```bash
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invalid-token",
    "email": "testuser@gmail.com"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid or expired verification token"
}
```

#### Test 2.4.2: Expired Token

Wait 24+ hours or manually set `token_expires_at` to past timestamp, then:

```bash
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "already-expired-token",
    "email": "testuser@gmail.com"
  }'
```

**Expected Response:**
```json
{
  "error": "Verification token has expired"
}
```

#### Test 2.4.3: Nonexistent Email

```bash
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "some-token",
    "email": "nonexistent@example.com"
  }'
```

**Expected Response:**
```json
{
  "error": "User not found"
}
```

---

## Phase 3: Frontend Testing

### 3.1 Start Frontend Dev Server

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Expected: App runs on http://localhost:5173

### 3.2 End-to-End Signup Flow

**Step 1:** Go to http://localhost:5173/signup

**Step 2:** Fill signup form:
- Email: `testuser@gmail.com`
- Password: `Test@123456`
- Full Name: `Test User`
- Click "Sign Up"

**Expected:**
- ✅ Success message: "Account created. Check your email to verify."
- ✅ Form clears
- ✅ Verification instructions displayed

**Step 3:** Check email for verification link
- Open testuser@gmail.com inbox
- Click verification link in email

**Expected:**
- ✅ Redirected to /verify-email page
- ✅ Page shows "Verifying..." state initially
- ✅ After 2-3 seconds, shows success message
- ✅ Auto-redirects to /login after 3 seconds

### 3.3 Login Flow

**Step 1:** After auto-redirect or manual navigation to /login

**Step 2:** Enter credentials:
- Email: `testuser@gmail.com`
- Password: `Test@123456`

**Step 3:** Click "Sign In"

**Expected:**
- ✅ Login successful
- ✅ Redirected to dashboard/home
- ✅ User authenticated

### 3.4 Unverified Email Login Test

**Before verifying email, try to login:**

1. Go to /login
2. Enter email and password for **unverified** account
3. Click "Sign In"

**Expected:**
- ❌ Login fails with message: "Please verify your email"
- ✅ Option to "Resend Verification Email" appears
- ✅ Can click to resend (respects 60-second rate limit)

### 3.5 Verification Page Edge Cases

**Test with missing token:**
- Navigate to `http://localhost:5173/verify-email` (no query params)

**Expected:**
- ✅ Error message: "Invalid verification link"

**Test with invalid token:**
- Navigate to `http://localhost:5173/verify-email?token=invalid&email=test@gmail.com`

**Expected:**
- ✅ Shows verifying state
- ✅ After server response, shows error
- ✅ "Resend Verification Email" button appears

---

## Phase 4: Integration Testing

### 4.1 Complete User Journey

```
1. Sign up account
2. Receive verification email
3. Click verification link
4. Verify email successfully
5. Login with verified email
6. Access protected routes
✅ All steps should succeed
```

### 4.2 Database State Verification

After completing full flow, check database:

```sql
-- Check verified user
SELECT id, email, email_verified, verification_token 
FROM profiles 
WHERE email = 'testuser@gmail.com';

-- Should show:
-- id: user-uuid
-- email: testuser@gmail.com
-- email_verified: true
-- verification_token: NULL
```

### 4.3 Email Content Verification

Check received verification email for:
- ✅ "Verify your email" subject
- ✅ PrepLoop branding
- ✅ Valid verification link
- ✅ 24-hour expiration notice
- ✅ "If you didn't create account" disclaimer
- ✅ Professional formatting

---

## Phase 5: Security Testing

### 5.1 Token Security

**Verify token properties:**

```sql
-- Check token format (should be 32-char hex)
SELECT verification_token, length(verification_token) as token_length
FROM profiles 
WHERE verification_token IS NOT NULL;

-- Should show tokens like: a1b2c3d4e5f6... length=32
```

### 5.2 Token One-Time Use

**Try to verify with same token twice:**

1. First verification with token: `abc123...` → ✅ Success
2. Try same token again → ❌ Should fail with "Invalid or expired"

### 5.3 Email Enumeration Prevention

**Try verification with non-existent email:**

```bash
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "valid-token",
    "email": "nonexistent@example.com"
  }'
```

**Expected:**
- ✅ Generic error message (doesn't reveal if email exists)
- ✅ No database error leakage

### 5.4 Rate Limiting Security

**Rapid-fire resend requests:**

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/resend-verification-email \
    -H "Content-Type: application/json" \
    -d '{"email": "test@gmail.com"}'
  sleep 1
done
```

**Expected:**
- ✅ First request succeeds
- ✅ Subsequent requests within 60s are blocked
- ✅ Response: 429 Too Many Requests

---

## Phase 6: Testing Checklist

### Email Sending
- [ ] Verification email received after signup
- [ ] Email has correct sender (SMTP_USER)
- [ ] Email has valid verification link
- [ ] Link includes correct token and email params
- [ ] Email styling is professional
- [ ] Email is not marked as spam

### Verification Flow
- [ ] Token verification succeeds with correct token
- [ ] Token verification fails with invalid token
- [ ] Token verification fails with expired token
- [ ] email_verified set to TRUE after success
- [ ] verification_token cleared after success
- [ ] Success message shown to user

### Login Enforcement
- [ ] Unverified users cannot login (403 error)
- [ ] Verified users can login normally (200 success)
- [ ] Error message guides user to verify email
- [ ] Resend option available in login error state

### Resend Flow
- [ ] New token generated on resend
- [ ] New email sent with new token
- [ ] Rate limiting prevents spam (60s cooldown)
- [ ] New token works for verification

### Frontend UI
- [ ] Signup page works correctly
- [ ] Success message shown after signup
- [ ] Verify email page shows loading state
- [ ] Auto-redirect to login after verification
- [ ] Error states display helpful messages
- [ ] Resend button appears on errors
- [ ] Resend button respects rate limiting

### Database
- [ ] Migration ran successfully
- [ ] All columns present on profiles table
- [ ] Indexes created for performance
- [ ] Token stored as VARCHAR(255)
- [ ] Expiration stored as TIMESTAMP WITH TIME ZONE
- [ ] email_verified defaults to FALSE

### Error Handling
- [ ] Signup with missing email
- [ ] Signup with missing password
- [ ] Signup with missing fullName
- [ ] Signup with password < 6 chars
- [ ] Signup with duplicate email
- [ ] Login with unverified email
- [ ] Verify with missing token/email params
- [ ] Verify with invalid/expired token

### Security
- [ ] Tokens are 32-character hex strings
- [ ] Tokens are cryptographically random
- [ ] Tokens expire after 24 hours
- [ ] Tokens are one-time use
- [ ] Rate limiting prevents brute force
- [ ] Email enumeration not possible
- [ ] SMTP credentials not logged

---

## Test Scripts

### Quick Test Script (Node.js)

Create `backend/test-email-verification.js`:

```javascript
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api/auth';
const testEmail = `test-${Date.now()}@example.com`;

async function runTests() {
  console.log('🧪 Email Verification Test Suite\n');

  try {
    // Test 1: Signup
    console.log('📝 Test 1: Signup...');
    const signupRes = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test@123456',
        fullName: 'Test User'
      })
    });
    const signupData = await signupRes.json();
    console.log(signupRes.ok ? '✅ Signup successful' : '❌ Signup failed');
    console.log('Response:', signupData);

    // Test 2: Login before verification
    console.log('\n🔐 Test 2: Login (unverified)...');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test@123456'
      })
    });
    console.log(loginRes.status === 403 ? '✅ Correctly blocked' : '❌ Should be blocked');
    const loginData = await loginRes.json();
    console.log('Response:', loginData);

    console.log('\n✅ Basic tests passed! Manual verification needed for email receipt.');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

runTests();
```

Run with:
```bash
node backend/test-email-verification.js
```

---

## Troubleshooting

### Problem: Email not received

**Solutions:**
1. Check SMTP credentials in backend/.env
2. Confirm Gmail 2FA is enabled
3. Check Gmail spam folder
4. Verify app-specific password (not regular password)
5. Check backend logs for SMTP errors

### Problem: Token invalid error

**Solutions:**
1. Verify token is 32-character hex
2. Check token_expires_at timestamp (should be future)
3. Confirm token matches in database
4. Check timezone on database server

### Problem: Rate limiting false positives

**Solutions:**
1. Check your IP address
2. Verify rate limiter configuration
3. Restart backend server to reset in-memory counter
4. Check that same email is being used in tests

### Problem: Signup succeeds but no email sent

**Solutions:**
1. Check backend logs for SMTP errors
2. Verify SMTP_USER has email sending enabled
3. Confirm FRONTEND_URL is set correctly for link generation
4. Check database for verification_token (should exist)

---

## Next Steps

After all tests pass:
1. ✅ Testing complete
2. ➡️ Review [EMAIL_VERIFICATION_DEPLOYMENT_GUIDE.md](./EMAIL_VERIFICATION_DEPLOYMENT_GUIDE.md)
3. ➡️ Deploy to production
4. ➡️ Monitor email delivery metrics
