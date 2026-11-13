import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const connectionString =
  process.env.DATABASE_URL ||
  (projectRef && process.env.SUPABASE_DB_PASSWORD
    ? `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`
    : null);

if (!supabaseUrl || !supabaseServiceKey || !connectionString) {
  console.error('❌ Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL / SUPABASE_DB_PASSWORD in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying improvement_plans migration...\n');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'db', 'migration_improvement_plans.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL via pg...\n');

    await client.connect();
    await client.query(migrationSQL);

    console.log('\n✅ Migration applied successfully!\n');
    console.log('📋 Verifying table creation...');

    // Verify the table exists
    const { error } = await supabase
      .from('improvement_plans')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Table created (empty)');
      } else {
        console.error('❌ Verification failed:', error.message);
        console.log('\n⚠️  You may need to apply the migration manually via Supabase dashboard');
        console.log('📄 Migration file: backend/db/migration_improvement_plans.sql');
      }
    } else {
      console.log('✅ Table verified and accessible');
    }

    console.log('\n🎉 Deployment complete!');
    console.log('\n📚 Next steps:');
    console.log('1. Restart your backend server if running');
    console.log('2. Test the API endpoints');
    console.log('3. Implement the frontend component');
    console.log('\n📖 Documentation: docs/AI_IMPROVEMENT_PLAN.md');
    console.log('🚀 Quick Start: IMPROVEMENT_PLAN_QUICK_START.md');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Manual migration steps:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy contents of: backend/db/migration_improvement_plans.sql');
    console.log('3. Paste and run the SQL');
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

applyMigration();
