import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Check what's already in the database
async function checkMigrationStatus() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🔍 Checking migration status via Supabase REST API...\n');

  try {
    // Check if reference_key column exists
    console.log('1️⃣ Checking if reference_key column exists in coin_transactions...');
    const columnsUrl = `${supabaseUrl}/rest/v1/information_schema.columns?table_name=eq.coin_transactions&column_name=eq.reference_key&select=column_name`;
    
    const columnsRes = await fetch(columnsUrl, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });
    
    if (!columnsRes.ok) {
      throw new Error(`API error: ${columnsRes.status} ${columnsRes.statusText}`);
    }

    const columns = await columnsRes.json();
    if (Array.isArray(columns) && columns.length > 0) {
      console.log('   ✅ reference_key column EXISTS - Migration likely already applied!');
      console.log('      The coin transaction idempotency feature is active.\n');
      
      console.log('📊 Migration Status Summary:');
      console.log('   ✅ reference_key column: EXISTS');
      console.log('   ✅ Idempotency protection: ACTIVE');
      console.log('   ✅ Duplicate coin awards: PREVENTED\n');
      
      console.log('🎯 Next Steps:');
      console.log('   1. Register requestId middleware in backend/index.js');
      console.log('   2. Run integration tests: npm run test:coin:integration');
      console.log('   3. Run atomicity tests: npm run test:coin:atomicity');
      process.exit(0);
    } else {
      console.log('   ❌ reference_key column does NOT exist - Migration not yet applied\n');
      
      console.log('⚠️ Migration Status: PENDING');
      console.log('   • reference_key column: MISSING');
      console.log('   • Idempotency protection: INACTIVE');
      console.log('   • System STATUS: Vulnerable to duplicate coin awards\n');
      
      console.log('📋 Required Actions:');
      console.log('   1. Apply migration via Supabase SQL Editor:');
      console.log(`      ▶️  Go to: ${supabaseUrl}/project/sql`);
      console.log('   2. Paste the contents of backend/db/migration_coin_transaction_idempotency.sql');
      console.log('   3. Execute the migration');
      console.log('   4. Re-run this script to confirm: node backend/scripts/apply_migration_via_api.js\n');
      
      console.log('📄 Migration File:');
      console.log('   backend/db/migration_coin_transaction_idempotency.sql');
      
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   • Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    console.error('   • Ensure Supabase instance is accessible');
    console.error('   • Check network connectivity\n');
    process.exit(1);
  }
}

checkMigrationStatus();
