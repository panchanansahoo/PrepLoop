#!/usr/bin/env node

/**
 * MANUAL MIGRATION GUIDE
 * 
 * This script provides instructions for applying the coin transaction idempotency
 * migration through Supabase's web SQL Editor.
 * 
 * Use this when direct database connections aren't available.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '..');

function readBackendFileUtf8(relativePath) {
   const resolvedPath = path.resolve(BACKEND_ROOT, relativePath);
   if (!(resolvedPath === BACKEND_ROOT || resolvedPath.startsWith(`${BACKEND_ROOT}${path.sep}`))) {
      throw new Error(`Unsafe file path: ${relativePath}`);
   }
   return fs.readFileSync(resolvedPath, 'utf8');
}

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  SUPABASE MIGRATION - MANUAL SETUP GUIDE                  ║
║                                                                            ║
║  Direct database connection failed due to network restrictions.           ║
║  Using Supabase SQL Editor is the recommended approach.                   ║
╚════════════════════════════════════════════════════════════════════════════╝

📍 STEP 1: Open Supabase SQL Editor
   ──────────────────────────────────
   1. Go to: https://vxbwanobjlxnmwspmkwc.supabase.co/project/sql
   2. Or navigate to your Supabase dashboard and click "SQL Editor"
   3. Click "New Query" to create a new SQL query

📋 STEP 2: Copy the Migration SQL
   ───────────────────────────────
   The following SQL will be copied to your clipboard:
   File: backend/db/migration_coin_transaction_idempotency.sql

⚙️ STEP 3: Paste & Execute
   ────────────────────────
   1. Paste the migration SQL into the SQL Editor
   2. Click "Execute" or press Ctrl+Enter
   3. Wait for the query to complete (usually <5 seconds)

✅ STEP 4: Verify Success  
   ──────────────────────
   After execution, you should see:
   • "Query Completed" status
   • No error messages
   • The following objects created:
     - reference_key column on coin_transactions
     - idx_coin_transactions_user_reference_key index
     - coin_apply_transaction function

`);

// Read the migration SQL
const migrationSql = readBackendFileUtf8('db/migration_coin_transaction_idempotency.sql');

console.log('📄 MIGRATION SQL CODE:');
console.log('═'.repeat(80));
console.log(migrationSql);
console.log('═'.repeat(80));

console.log(`

🎯 WHAT THIS MIGRATION DOES:
   ──────────────────────────

   1. Adds reference_key column to coin_transactions table
      • Stores a unique identifier for each transaction request
      • Enables idempotency - same reference_key = no duplicate transaction

   2. Creates UNIQUE INDEX on (user_id, reference_key)
      • Prevents duplicate entries with the same reference_key
      • Ensures atomicity at the database level

   3. Updates coin_apply_transaction RPC function
      • Now accepts reference_key parameter
      • Uses ON CONFLICT clause to handle duplicates gracefully
      • Returns applied=FALSE if duplicate is detected

   💡 Result: Users can safely retry coin award API calls without
      creating duplicate transactions. Prevents race condition attacks.


📚 FOR MORE INFORMATION:
   ──────────────────────
   • Architecture: docs/ARCHITECTURE.md
   • Testing: npm run test:coin:atomicity
   • Documentation: OBSERVABILITY_DEPLOYMENT_GUIDE.md


🚀 NEXT STEPS (After Migration Complete):
   ──────────────────────────────────────
   1. Register requestId middleware:
      • Edit: backend/index.js
      • Add: app.use(requestIdMiddleware); (after cors)

   2. Run integration tests:
      npm run test:coin:integration

   3. Run atomicity tests:
      npm run test:coin:atomicity

   4. Verify all tests pass ✅

   5. Deploy to production


❓ IS THE MIGRATION ALREADY APPLIED?
   ──────────────────────────────────
   Run this query in Supabase SQL Editor to check:

   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'coin_transactions' 
   AND column_name = 'reference_key';

   If this returns a row with "reference_key", the migration is DONE! ✅


⚠️ TROUBLESHOOTING:
   ─────────────────

   Q: I see an error "Column reference_key already exists"
   A: The migration was already applied! That's good news. Run:
      npm run test:coin:atomicity
      
   Q: The migration hangs or times out
   A: This is normal for large deployments. Wait 30 seconds, then 
      check the status with the verification query above.

   Q: I see permission errors
   A: Ensure you're logged in as the Supabase admin/owner account.
      The SUPABASE_SERVICE_ROLE_KEY should have full permissions.


═════════════════════════════════════════════════════════════════════════════

Once you've applied this migration in Supabase SQL Editor, restart the
backend and run:

  npm run test:coin:atomicity

to verify the race condition is fixed! 🎯

═════════════════════════════════════════════════════════════════════════════
`);
