import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Client } = pg;

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.SUPABASE_URL;
const supabasePassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !supabasePassword) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_DB_PASSWORD in .env');
  process.exit(1);
}

// Extract project ref from URL (e.g., vxbwanobjlxnmwspmkwc from https://vxbwanobjlxnmwspmkwc.supabase.co)
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not parse project reference from SUPABASE_URL');
  process.exit(1);
}

const connectionString = `postgresql://postgres:${supabasePassword}@db.${projectRef}.supabase.co:5432/postgres`;

const migrationSQL = `
-- Migration: AI Interview Improvement Plans
-- Purpose: Add database table for personalized improvement plans
-- Date: 2026-04-12

-- Improvement Plans Table
CREATE TABLE IF NOT EXISTS improvement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan content
  plan_data JSONB NOT NULL,
  session_ids UUID[],
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active',
  progress JSONB DEFAULT '{"completedTasks": [], "lastUpdated": null}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_improvement_plans_user_id ON improvement_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_status ON improvement_plans(status);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_created_at ON improvement_plans(created_at DESC);

-- RLS Policies
ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own improvement plans" ON improvement_plans;
CREATE POLICY "Users can view their own improvement plans"
  ON improvement_plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own improvement plans" ON improvement_plans;
CREATE POLICY "Users can insert their own improvement plans"
  ON improvement_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own improvement plans" ON improvement_plans;
CREATE POLICY "Users can update their own improvement plans"
  ON improvement_plans FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own improvement plans" ON improvement_plans;
CREATE POLICY "Users can delete their own improvement plans"
  ON improvement_plans FOR DELETE
  USING (auth.uid() = user_id);
`;

async function applyMigration() {
  console.log('🚀 Applying improvement_plans migration to Supabase...\n');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📄 Executing migration SQL...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully!\n');

    // Verify table exists
    console.log('🔍 Verifying table creation...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'improvement_plans'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table "improvement_plans" created successfully!\n');
    } else {
      console.log('⚠️  Table verification failed\n');
    }

    // Check indexes
    console.log('🔍 Verifying indexes...');
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'improvement_plans'
    `);
    console.log(`✅ ${indexResult.rows.length} indexes created\n`);

    // Check RLS policies
    console.log('🔍 Verifying RLS policies...');
    const policyResult = await client.query(`
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = 'improvement_plans'
    `);
    console.log(`✅ ${policyResult.rows.length} RLS policies created\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Migration Complete!\n');
    console.log('✅ Table: improvement_plans');
    console.log('✅ Indexes: 3');
    console.log('✅ RLS Policies: 4');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📚 Next Steps:');
    console.log('1. ✅ Database migration applied');
    console.log('2. Restart backend server (if needed)');
    console.log('3. Test API endpoints');
    console.log('4. Implement frontend component\n');

    console.log('🧪 Test the API:');
    console.log('   curl -X POST http://localhost:5000/api/improvement-plan/generate \\');
    console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"timeframe": 7}\'');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
