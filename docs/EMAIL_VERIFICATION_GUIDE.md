# Email Verification System - Implementation Guide

## Overview

This document describes the email verification (login confirmation) system implemented in PrepLoop. Users must verify their email before they can log in to their accounts.

## System Architecture

### Database Schema Updates

New columns added to `profiles` table:
- `email_verified` (BOOLEAN): Indicates if email has been verified
- `verification_token` (VARCHAR): Unique token for email verification
- `token_expires_at` (TIMESTAMP): When the verification token expires (24 hours)
- `verification_sent_at` (TIMESTAMP): When the verification email was last sent

### Migration

Run the migration to add these fields:
```bash
psql -U preploop -d preploop -f backend/db/migration_email_verification.sql
```

## API Endpoints

### 1. POST `/api/auth/signup`
**Purpose**: Create a new user account with email verification required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "fullName": "John Doe"
}
```

**Success Response (201)**:
```json
{
  "message": "User created successfully. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "emailVerified": false
  }
}
```

**Process**:
1. Creates Supabase auth user with `email_confirm: false`
2. Generates random 32-character verification token
3. Stores token in database with 24-hour expiration
4. Sends verification email to user

---

### 2. POST `/api/auth/verify-email`
**Purpose**: Verify email using the token from verification email

**Request Body**:
```json
{
  "token": "hextoken1234567890abcdef",
  "email": "user@example.com"
}
```

**Success Response (200)**:
```json
{
  "message": "Email verified successfully. You can now log in.",
  "email": "user@example.com",
  "verified": true
}
```

**Error Cases**:
- `400` - Invalid or expired token
- `400` - Email doesn't match token
- `400` - Email already verified

---

### 3. POST `/api/auth/resend-verification-email`
**Purpose**: Resend verification email (rate limited to 1 per 60 seconds)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response (200)**:
```json
{
  "message": "If an account with that email exists and is unverified, we have sent a verification email."
}
```

**Features**:
- Only works for unverified accounts
- Rate limited to prevent abuse
- Generates new token each time
- Extends token expiration by 24 hours

---

### 4. POST `/api/auth/login`
**Purpose**: Authenticate user (now requires verified email)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Success Response (200)** - Email verified:
```json
{
  "message": "Login successful",
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "subscriptionTier": "free",
    "experienceLevel": "beginner",
    "role": "user",
    "emailVerified": true
  }
}
```

**Error Response (403)** - Email not verified:
```json
{
  "error": "Please verify your email before logging in",
  "userId": "uuid",
  "email": "user@example.com"
}
```

---

## Frontend Implementation

### Verification Page Component

Create a new page at `/verify-email` that:

1. Extracts token and email from URL query parameters
2. Calls the verify-email endpoint
3. Shows success/error messages
4. Redirects to login on success

**Example React Component**:

```jsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email })
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          // Redirect to login after 2 seconds
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-md w-full">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-green-400 mb-2">Success!</h2>
            <p className="text-slate-300 mb-4">{message}</p>
            <p className="text-slate-400 text-sm">Redirecting to login...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">✕</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Verification Failed</h2>
            <p className="text-slate-300 mb-4">{message}</p>
            <button
              onClick={() => navigate('/signup')}
              className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Signup Page Updates

After signup, display a message:

```jsx
const handleSignup = async (formData) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      // Show verification message
      setMessage('Check your email to verify your account');
      // Show resend button after 60 seconds
      setTimeout(() => {
        setShowResendButton(true);
      }, 60000);
    } else {
      setError(data.error);
    }
  } catch (error) {
    setError('Signup failed');
  }
};
```

---

### Resend Verification Email

```jsx
const handleResendVerification = async (email) => {
  try {
    const response = await fetch('/api/auth/resend-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (response.ok) {
      setMessage('Verification email sent! Check your inbox.');
    } else {
      setError(data.error);
    }
  } catch (error) {
    setError('Failed to resend email');
  }
};
```

---

## Security Features

### Token Security
- **Token Format**: 32-character random hex string (256-bit entropy)
- **Expiration**: 24-hour validity period
- **Storage**: Stored in database, never sent to frontend except in email link
- **One-time Use**: Token is cleared after successful verification

### Rate Limiting
- Signup/verification endpoints use rate limiting
- Per-email cooldown: 60 seconds between resends
- Global rate limiter: prevents brute force attempts

### Email Security
- **No Email Enumeration**: Endpoints don't reveal whether email exists
- **HTTPS Only**: Verification links should only work over HTTPS in production
- **Email Verification**: Confirms email is legitimate and accessible

### Authentication Security
- Users cannot log in until email is verified
- Failed login returns 403 with specific error message
- JWT tokens only issued after email verification

---

## Environment Variables Required

```env
# Email Configuration
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-specific-password

# Frontend URL for verification links
FRONTEND_URL=http://localhost:5173  # or your production domain
```

**Gmail Setup**:
1. Enable 2-Factor Authentication on Gmail
2. Generate App-Specific Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `SMTP_PASS`

---

## Database Table Structure

```sql
-- Relevant columns in profiles table
id UUID PRIMARY KEY,
email VARCHAR(255),
email_verified BOOLEAN DEFAULT false,
verification_token VARCHAR(255),
token_expires_at TIMESTAMP WITH TIME ZONE,
verification_sent_at TIMESTAMP WITH TIME ZONE,
-- Indexes for performance
CREATE INDEX idx_profiles_verification_token ON profiles(verification_token);
CREATE INDEX idx_profiles_email_verified ON profiles(email_verified);
```

---

## Email Template

The verification email includes:
- **Subject**: "Verify your PrepLoop email address"
- **Content**: 
  - Welcome message
  - Verification button (clicks token URL)
  - Link can be copied and pasted
  - 24-hour expiration notice
  - Styled with PrepLoop branding

---

## Testing

### Test User Flow

```bash
# 1. Signup
curl -X POST http://localhost:5050/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","fullName":"Test User"}'

# Expected: User created, email should be in inbox

# 2. Verify Email (use token from email)
curl -X POST http://localhost:5050/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"<token-from-email>","email":"test@example.com"}'

# Expected: Email verified successfully

# 3. Login
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Expected: Login successful with token
```

---

## Migration Steps

1. **Database**: Run migration SQL to add new columns
2. **Backend**: Deploy updated auth routes
3. **Frontend**: Add verify-email page and update signup flow
4. **Testing**: Test full signup → verification → login flow
5. **Communication**: Notify users about email verification requirement

---

## Troubleshooting

### Issue: Verification email not received
- Check SMTP credentials in `.env`
- Verify Gmail app password (not regular password)
- Check spam/promotions folder
- Resend verification email (rate limited)

### Issue: Token expired
- User must request new verification email
- Use `/api/auth/resend-verification-email` endpoint
- New token will be generated and emailed

### Issue: "Email does not match token"
- Ensure token and email match from URL parameters
- URL might have been modified or corrupted

### Issue: "Email already verified"
- User is trying to verify an already verified email
- User can proceed to login

---

## Future Enhancements

- [ ] Email verification webhook from email provider
- [ ] SMS verification as alternative
- [ ] Social OAuth integration (auto-verified)
- [ ] Admin dashboard to resend verification
- [ ] Bulk verification email checking
- [ ] Verification analytics dashboard
