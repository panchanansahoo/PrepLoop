# Observability & Atomicity Implementation - Final Steps

## Status Summary
✅ **9/12 Tasks Complete**
- All middleware, utilities, routes updated
- All documentation created
- All test scripts prepared
- Request ID middleware already registered

⏳ **Remaining: 3 Tasks**
1. Apply database migration
2. Get test credentials
3. Run and verify tests

---

## Step 1: Apply Database Migration (5 minutes)

### Approach: Manual via Supabase SQL Editor (Recommended)

**Why manual?** Direct database connections fail due to network restrictions. The Supabase web UI works perfectly.

### Instructions:

1. **Open Supabase SQL Editor**
   - Go to: https://vxbwanobjlxnmwspmkwc.supabase.co/project/sql
   - Login if prompted

2. **Create New Query**
   - Click "New query" button (top left)
   - This opens a fresh SQL editor

3. **Copy & Paste Migration SQL**
   ```sql
   -- Migration: Add idempotency support to atomic coin transactions.
   -- Safe to run multiple times.
   
   ALTER TABLE coin_transactions
   ADD COLUMN IF NOT EXISTS reference_key TEXT;
   
   CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_user_reference_key
   ON coin_transactions(user_id, reference_key);
   
   CREATE OR REPLACE FUNCTION coin_apply_transaction(
     user_id_input UUID,
     amount_input INTEGER,
     txn_type_input TEXT,
     description_input TEXT DEFAULT NULL,
     reference_key_input TEXT DEFAULT NULL
   )
   RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error TEXT, applied BOOLEAN)
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     current_balance INTEGER;
     inserted_txn_id INTEGER;
   BEGIN
     IF amount_input IS NULL OR amount_input <= 0 THEN
       RETURN QUERY SELECT FALSE, 0, 'Amount must be greater than zero', FALSE;
       RETURN;
     END IF;
   
     IF txn_type_input NOT IN ('earn', 'spend') THEN
       RETURN QUERY SELECT FALSE, 0, 'Invalid transaction type', FALSE;
       RETURN;
     END IF;
   
     IF reference_key_input IS NOT NULL AND LENGTH(TRIM(reference_key_input)) > 0 THEN
       INSERT INTO coin_transactions (user_id, amount, type, description, reference_key)
       VALUES (
         user_id_input,
         amount_input,
         txn_type_input,
         LEFT(COALESCE(description_input, ''), 160),
         LEFT(TRIM(reference_key_input), 120)
       )
       ON CONFLICT (user_id, reference_key) DO NOTHING
       RETURNING id INTO inserted_txn_id;
   
       IF inserted_txn_id IS NULL THEN
         SELECT COALESCE(coins, 0) INTO current_balance
         FROM profiles
         WHERE id = user_id_input;
   
         RETURN QUERY SELECT TRUE, COALESCE(current_balance, 0), 'duplicate_reference', FALSE;
         RETURN;
       END IF;
     END IF;
   
     IF txn_type_input = 'earn' THEN
       UPDATE profiles
       SET coins = COALESCE(coins, 0) + amount_input
       WHERE id = user_id_input
       RETURNING coins INTO current_balance;
   
       IF current_balance IS NULL THEN
         IF inserted_txn_id IS NOT NULL THEN
           DELETE FROM coin_transactions WHERE id = inserted_txn_id;
         END IF;
         RETURN QUERY SELECT FALSE, 0, 'User profile not found', FALSE;
         RETURN;
       END IF;
     ELSE
       UPDATE profiles
       SET coins = COALESCE(coins, 0) - amount_input
       WHERE id = user_id_input
         AND COALESCE(coins, 0) >= amount_input
       RETURNING coins INTO current_balance;
   
       IF current_balance IS NULL THEN
         IF inserted_txn_id IS NOT NULL THEN
           DELETE FROM coin_transactions WHERE id = inserted_txn_id;
         END IF;
   
         SELECT COALESCE(coins, 0) INTO current_balance
         FROM profiles
         WHERE id = user_id_input;
   
         IF current_balance IS NULL THEN
           RETURN QUERY SELECT FALSE, 0, 'User profile not found', FALSE;
         ELSE
           RETURN QUERY SELECT FALSE, current_balance, 'Insufficient coins', FALSE;
         END IF;
         RETURN;
       END IF;
     END IF;
   
     IF inserted_txn_id IS NULL THEN
       INSERT INTO coin_transactions (user_id, amount, type, description)
       VALUES (user_id_input, amount_input, txn_type_input, LEFT(COALESCE(description_input, ''), 160));
     END IF;
   
     RETURN QUERY SELECT TRUE, current_balance, NULL::TEXT, TRUE;
   END;
   $$;
   ```

4. **Execute Query**
   - Press `Ctrl+Enter` or click the play button
   - Wait ~3 seconds for execution

5. **Verify Success**
   - **Expected message**: "Query Completed" (green checkmark)
   - You should see no errors

### Verification (Optional but recommended):

After execution, run this verification query in a new SQL editor tab:

```sql
-- Check if reference_key column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coin_transactions' 
AND column_name = 'reference_key';
```

**Expected result**: One row showing `reference_key | text`

---

## Step 2: Get Test Credentials

The atomicity test requires a valid JWT token and user ID. You have two options:

### Option A: Create Test Account via Frontend (Recommended)

1. Start backend: `npm run dev` (if not already running)
2. Start frontend: `cd frontend && npm run dev`
3. Go to http://localhost:5173
4. Sign up with test email (e.g., `test@atomicity.com`)
5. After login, open browser DevTools (F12)
6. Go to Application → Local Storage → find `auth_token` or check response headers
7. Extract the JWT token and your user ID

### Option B: Use curl to Get Credentials

```bash
# Create test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test.atomicity@example.com","password":"TestPassword123!","name":"Test User"}'

# Response will include JWT token and user ID:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": "550e8400-e29b-41d4-a716-446655440000", ... }
# }
```

### Save Credentials

Once you have them, export as environment variables in PowerShell:

```powershell
$env:TEST_AUTH_TOKEN = "your_jwt_token_here"
$env:TEST_USER_ID = "your_uuid_here"
```

---

## Step 3: Run Atomicity Test

### Command:

```bash
cd C:\Users\panch\Desktop\Preploop\backend
$env:TEST_AUTH_TOKEN = "your_token"
$env:TEST_USER_ID = "your_uuid"
npm run test:coin:atomicity
```

### Expected Output:

```
🧪 Atomic Coin Transaction Regression Tests

Configuration:
  API Base: http://localhost:5000
  Test Problem ID: 42
  Concurrent Requests: 2
  Timeout: 5000ms

🔄 Running test with 2 concurrent submissions...
  Request 1 submitted at 1234567890ms
  Request 2 submitted at 1234567901ms
  
✅ SUCCESS: Atomic transactions working correctly!
   Race condition prevented: Only 10 coins awarded (not 20)
   Applied count: 1/2 (idempotency working)
```

### What This Tests:

- Two concurrent first-solve submissions for same problem by same user
- Race condition prevented: Only 1 coin award applied, not 2
- Idempotency verified: Second request marked as `applied: false, duplicate_reference`

---

## Step 4: Run Integration Tests

### Command:

```bash
cd C:\Users\panch\Desktop\Preploop\backend
npm run test:coin:integration
```

### Expected Output:

```
💰 Coin Integration Test Suite

Testing balanced endpoints:
  1. POST /api/coins/balance ...................... ✅ PASS
  2. POST /api/coins/earn ......................... ✅ PASS
  3. POST /api/coins/spend ........................ ✅ PASS
  4. Idempotent spend ............................ ✅ PASS
  5. Transaction history ......................... ✅ PASS
  6. Invalid transaction ......................... ✅ PASS
  7. Insufficient coins .......................... ✅ PASS

Result: 7/7 tests passed ✅
```

---

## Step 5: Verify Smoke Tests (Optional)

Ensure no regression in existing functionality:

```bash
cd C:\Users\panch\Desktop\Preploop
npm run smoke:interview-suite
```

Expected: All smoke tests pass ✅

---

## Step 6: Commit & Deploy

Once all tests pass:

```bash
cd C:\Users\panch\Desktop\Preploop

# Stage changes
git add -A

# Commit
git commit -m "feat: Add observability & fix coin transaction race condition

- Add Request ID middleware for distributed tracing
- Add structured JSON logging utility
- Implement atomic coin transactions with idempotency
- Add reference_key column and UNIQUE constraint to coin_transactions
- Update routes to use atomic transaction wrapper
- Add comprehensive test suites (atomicity + integration)
- Add deployment documentation"

# Push (if using remote)
git push origin main
```

---

## Troubleshooting

### Migration Fails with "Column already exists"
- This is OK! The migration uses `IF NOT EXISTS`, so it's idempotent
- Run verification query to confirm column exists

### Test Auth Token is Invalid
- Token expires: Create a fresh one by logging in again
- Bearer format: Token should not include "Bearer " prefix when exporting to env var
- Usage format: `Authorization: Bearer ${TEST_AUTH_TOKEN}` in requests (script handles this)

### Test Timeout
- Backend not running: Start with `npm run dev`
- Rate limiting: May be hitting auth limiter - wait 15 minutes and retry
- Network issue: Check `http://localhost:5000/health` returns `{"status":"ok"}`

### Insufficient Coins Error
- Test may not have coins after multiple runs
- Solution: Reset test user via admin panel or create new test user

---

## What Each Component Does

### Request ID Middleware
- Generates unique UUID for every request
- Propagates via X-Request-ID header
- Enables request tracing across logs
- Already registered in backend/index.js ✅

### Structured JSON Logger
- Logs as JSON (not unstructured strings)
- Includes timestamp, level, operation, context fields
- Integrates with: coin operations, query timeouts, API responses

### Atomic Coin Transactions
- Wrapper around coin_apply_transaction RPC
- Uses reference_key for idempotency
- Examples:
  - `problem_solve:userId:problemId` for first-solve bonus
  - `chat_query:userId:chatId:timestamp` for chat costs

### Database Migration
- Adds reference_key column to track operation identity
- Creates UNIQUE(user_id, reference_key) constraint
- Replaces coin_apply_transaction function with idempotent version
- Uses ON CONFLICT DO NOTHING for safe duplicates

---

## Quick Reference

| Component | File | Status |
|-----------|------|--------|
| Request ID Middleware | backend/middleware/requestId.js | ✅ Implemented & Registered |
| Structured Logger | backend/utils/structuredLogger.js | ✅ Implemented |
| Observable Transactions | backend/utils/coinTransactionsObservable.js | ✅ Implemented |
| Query Timeout Manager | backend/utils/queryTimeout.js | ✅ Implemented |
| Atomic Coin Transactions | backend/utils/coinTransactions.js | ✅ Implemented |
| Migration SQL | backend/db/migration_coin_transaction_idempotency.sql | ⏳ Ready to apply |
| Atomicity Test | backend/scripts/test_coin_atomicity.js | ✅ Ready to run |
| Integration Test | backend/scripts/test_coin_integration.js | ✅ Ready to run |
| Package.json Scripts | backend/package.json | ✅ Registered |
| Documentation | QUICK_START.md, OBSERVABILITY_DEPLOYMENT_GUIDE.md | ✅ Complete |

---

## Success Criteria

- [ ] Migration applied successfully
- [ ] Atomicity test passes (only 10 coins awarded, not 20)
- [ ] Integration tests pass (7/8 passing minimum)
- [ ] Smoke tests pass (no regression)
- [ ] Changes committed to git
- [ ] Deployment ready

---

**Estimated Time**: 15 minutes total
- Migration: 5 min
- Test setup: 5 min
- Tests: 3 min
- Commit: 2 min
