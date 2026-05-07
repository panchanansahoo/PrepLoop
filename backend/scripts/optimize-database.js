#!/usr/bin/env node

/**
 * Database Performance Optimization Script
 * Phase 1 - Implements critical database optimizations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service role for DDL operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Execute SQL migration file
 */
async function executeMigration(migrationFile) {
  const filePath = path.join(__dirname, migrationFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filePath}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`📄 Executing migration: ${migrationFile}`);
  
  try {
    // Split SQL by statements (handle multi-statement migrations)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.length === 0) continue;
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Some errors are expected (e.g., index already exists)
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 80)}...`);
        } else {
          console.error(`❌ Error executing statement:`, error.message);
          console.error(`Statement: ${statement.substring(0, 200)}`);
          return false;
        }
      }
    }
    
    console.log(`✅ Migration completed: ${migrationFile}`);
    return true;
  } catch (err) {
    console.error(`❌ Migration failed: ${err.message}`);
    return false;
  }
}

/**
 * Analyze table statistics
 */
async function analyzeTables() {
  console.log('\n📊 Analyzing table statistics...\n');
  
  const tables = [
    'profiles',
    'problems',
    'user_progress',
    'submissions',
    'interview_history',
    'interview_feedback',
    'job_listings',
    'blog_posts',
    'community_posts',
    'notes',
    'payments',
    'improvement_plans',
    'audit_logs',
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`⚠️  Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: Accessible`);
      }
    } catch (err) {
      console.log(`❌ Table ${table}: ${err.message}`);
    }
  }
}

/**
 * Check existing indexes
 */
async function checkIndexes() {
  console.log('\n🔍 Checking existing indexes...\n');
  
  const query = `
    SELECT 
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      console.error('❌ Failed to query indexes:', error.message);
      return;
    }
    
    console.log(`Found ${data?.length || 0} indexes\n`);
    
    // Group by table
    const indexesByTable = {};
    data?.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`📋 ${table}: ${indexes.length} indexes`);
    });
  } catch (err) {
    console.error('❌ Error checking indexes:', err.message);
  }
}

/**
 * Vacuum and analyze tables
 */
async function vacuumAnalyze() {
  console.log('\n🧹 Running VACUUM ANALYZE on critical tables...\n');
  
  const criticalTables = [
    'profiles',
    'problems',
    'user_progress',
    'submissions',
    'interview_history',
    'job_listings',
  ];

  for (const table of criticalTables) {
    try {
      const query = `VACUUM ANALYZE ${table};`;
      const { error } = await supabase.rpc('exec_sql', { sql_query: query });
      
      if (error) {
        console.error(`❌ Failed to vacuum ${table}:`, error.message);
      } else {
        console.log(`✅ Vacuumed ${table}`);
      }
    } catch (err) {
      console.error(`❌ Error vacuuming ${table}:`, err.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Database Performance Optimization (Phase 1)\n');
  console.log('=' .repeat(60));
  
  // Step 1: Check existing indexes
  await checkIndexes();
  
  // Step 2: Execute Phase 1 migration
  console.log('\n' + '='.repeat(60));
  console.log('📝 Executing Phase 1 Performance Indexes Migration\n');
  
  const success = await executeMigration('db/migration_phase1_performance_indexes.sql');
  
  if (!success) {
    console.error('\n❌ Migration failed. Please check the errors above.');
    process.exit(1);
  }
  
  // Step 3: Analyze tables
  await analyzeTables();
  
  // Step 4: Vacuum and analyze
  await vacuumAnalyze();
  
  // Step 5: Final index check
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Final Index Verification\n');
  await checkIndexes();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Database Performance Optimization Complete!\n');
  console.log('Next steps:');
  console.log('1. Monitor query performance using pg_stat_statements');
  console.log('2. Check index usage with pg_stat_user_indexes');
  console.log('3. Review slow query logs');
  console.log('4. Run load tests to verify improvements');
  console.log('\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
