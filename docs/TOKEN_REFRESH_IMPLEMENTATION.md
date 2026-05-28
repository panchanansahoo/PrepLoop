# JWT Token Refresh Implementation

## Problem Solved
Previously, when a user's JWT access token expired, the backend would immediately return a 403 Forbidden error without attempting refresh. This caused users to be logged out even though they had a valid refresh token available.

## Solution Implemented

### Backend Changes (`backend/middleware/auth.js`)

1. **Token Expiration Detection**
   - Added `isTokenExpired()` helper function to detect JWT expiration errors
   - Looks for keywords: "token is expired", "exp", "expired" in error messages

2. **Smart Error Responses**
   - **Before**: Expired tokens → 403 Forbidden
   - **After**: Expired tokens → 401 Unauthorized with `code: "TOKEN_EXPIRED"`
   - Invalid tokens (signature, format) → still return 403 Forbidden

3. **Error Response Format**
   ```javascript
   // When token is expired (401)
   {
     error: "Token expired",
     code: "TOKEN_EXPIRED",
     details: "Please refresh your token"
   }
   
   // When token is invalid (403)
   {
     error: "Invalid or expired token",
     details: "error message"
   }
   ```

### Frontend Changes (`frontend/src/context/AuthContext.jsx`)

1. **Enhanced Interceptor Logic**
   - Recognizes the new 401 TOKEN_EXPIRED response code
   - Automatically attempts to refresh the token using the refresh token from localStorage
   - Retries the original request with the new token

2. **Refresh Flow**
   ```
   User Request with Expired Token
         ↓
   Backend Returns 401 { code: "TOKEN_EXPIRED" }
         ↓
   Frontend Catches Response
         ↓
   Frontend Calls POST /api/auth/refresh with refresh_token
         ↓
   Backend Returns New access_token & refresh_token
         ↓
   Frontend Updates localStorage with new tokens
         ↓
   Frontend Retries Original Request with New Token
         ↓
   Request Succeeds ✅
   ```

### Existing Backend Endpoint

The `/api/auth/refresh` endpoint (`backend/routes/auth.js:458-483`) already exists and works correctly:
- Accepts `refreshToken` in request body
- Uses Supabase's `auth.refreshSession()` to get new tokens
- Returns new `token` and `refreshToken`

## How It Works

1. **Initial Request**: Client sends request with Authorization header containing access token
   ```
   Authorization: Bearer <access_token>
   ```

2. **Token Validation**: Backend middleware attempts to validate the token
   ```javascript
   const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
   ```

3. **Error Detection**: If token is expired, error message contains "token is expired"
   ```javascript
   if (isTokenExpired(errorMsg)) {
     return res.status(401).json({ 
       error: 'Token expired', 
       code: 'TOKEN_EXPIRED'
     });
   }
   ```

4. **Frontend Retry Logic**: Frontend detects 401 with TOKEN_EXPIRED
   ```javascript
   const isTokenExpired = error.response?.status === 401 &&
     responseData?.code === 'TOKEN_EXPIRED';
   ```

5. **Token Refresh**: Frontend calls refresh endpoint
   ```javascript
   const response = await axios.post('/api/auth/refresh', {
     refreshToken: localStorage.getItem('refreshToken')
   });
   ```

6. **Automatic Retry**: Original request is retried with new token
   ```javascript
   originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
   return axios(originalRequest);
   ```

## Benefits

✅ **Seamless User Experience**: Users are not logged out when token expires
✅ **Automatic Recovery**: Token refresh happens automatically without user action
✅ **Security**: Still validates all tokens and maintains security boundaries
✅ **Backward Compatible**: Existing invalid token handling remains unchanged
✅ **Clean Separation**: Frontend and backend handle their respective concerns

## Testing

Run the token refresh detection test:
```bash
npm run test:token-refresh --prefix backend
```

Or manually:
```bash
cd backend && node scripts/testTokenRefresh.js
```

## Error Scenarios

| Scenario | Status | Code | Action |
|----------|--------|------|--------|
| Token expired | 401 | TOKEN_EXPIRED | Refresh + Retry |
| Invalid signature | 403 | (none) | Reject |
| No token provided | 401 | (none) | Reject |
| Invalid refresh token | 401 | (none) | Logout |
| Email not verified | 403 | EMAIL_NOT_VERIFIED | Reject (don't retry) |

## References

- Backend auth middleware: `backend/middleware/auth.js`
- Frontend auth context: `frontend/src/context/AuthContext.jsx`
- Refresh endpoint: `backend/routes/auth.js` (line 458)
- Test file: `backend/scripts/testTokenRefresh.js`
