#!/usr/bin/env node

/**
 * AI Features - Database Migration Verification Script
 * Checks if all required tables and indexes exist in Supabase
 * Usage: npm run verify:migration
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import '../config/env.js';

const { Client } = pg;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const DATABASE_URL =
  process.env.DATABASE_URL ||
  (projectRef && process.env.SUPABASE_DB_PASSWORD
    ? `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`
    : null);

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Expected schema
const EXPECTED_TABLES = [
  'code_review_sessions',
  'interview_sessions',
  'interview_feedback_history',
  'code_review_improvements',
  'interview_performance_trends',
  'ai_service_logs',
];

const EXPECTED_COLUMNS = {
  code_review_sessions: [
    'id',
    'user_id',
    'problem_id',
    'code',
    'language',
    'code_quality_score',
    'efficiency_score',
    'maintainability_score',
    'feedback',
    'complexity_analysis',
    'test_recommendations',
    'created_at',
    'updated_at',
  ],
  interview_sessions: [
    'id',
    'user_id',
    'interview_type',
    'difficulty',
    'company_focus',
    'transcript',
    'performance_metrics',
    'score',
    'status',
    'started_at',
    'completed_at',
    'created_at',
  ],
  interview_feedback_history: [
    'id',
    'interview_session_id',
    'feedback_round',
    'type',
    'context',
    'created_at',
  ],
  code_review_improvements: [
    'id',
    'code_review_session_id',
    'improvement_category',
    'description',
    'implementation_status',
    'created_at',
  ],
  interview_performance_trends: [
    'id',
    'user_id',
    'interview_type',
    'interview_count',
    'avg_score',
    'best_score',
    'worst_score',
    'score_trend',
    'updated_at',
  ],
  ai_service_logs: [
    'id',
    'user_id',
    'feature_type',
    'model_used',
    'tokens_used',
    'latency_ms',
    'status',
    'error',
    'created_at',
  ],
};

const EXPECTED_INDEXES = [
  'idx_code_review_user_id',
  'idx_code_review_problem_id',
  'idx_code_review_created_at',
  'idx_interview_user_id',
  'idx_interview_type_difficulty',
  'idx_interview_created_at',
  'idx_trends_user_type',
  'idx_logs_user_created',
  'idx_feedback_session_id',
  'idx_improvements_review_id',
];

/**
 * Check if tables exist
 */
async function checkTables(supabase) {
  console.log(`\n${colors.blue}Checking Tables:${colors.reset}`);

  for (const table of EXPECTED_TABLES) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error && error.code === 'PGRST116') {
        // Table not found
        console.log(`${colors.red}✗ ${table} - NOT FOUND${colors.reset}`);
      } else if (error) {
        console.log(`${colors.yellow}⚠ ${table} - ${error.message}${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ ${table}${colors.reset}`);
      }
    } catch (err) {
      console.log(`${colors.red}✗ ${table} - ERROR: ${err.message}${colors.reset}`);
    }
  }
}

/**
 * Check table columns using information_schema via direct PostgreSQL connection
 */
async function checkColumns(pgClient) {
  console.log(`\n${colors.blue}Checking Table Columns:${colors.reset}`);

  if (!pgClient) {
    console.log(`${colors.cyan}→ Skipping column verification (DATABASE_URL / SUPABASE_DB_PASSWORD not set)${colors.reset}`);
    return;
  }

  for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
    try {
      const { rows } = await pgClient.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      const existingColumns = rows.map((c) => c.column_name);
      const missing = columns.filter((c) => !existingColumns.includes(c));

      if (missing.length === 0) {
        console.log(`${colors.green}✓ ${table} - All ${columns.length} columns present${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ ${table} - Missing columns: ${missing.join(', ')}${colors.reset}`);
      }
    } catch (err) {
      console.log(`${colors.yellow}⚠ ${table} - Cannot verify columns: ${err.message}${colors.reset}`);
    }
  }
}

/**
 * Check indexes using pg_indexes via direct PostgreSQL connection
 */
async function checkIndexes(pgClient) {
  console.log(`\n${colors.blue}Checking Indexes:${colors.reset}`);

  if (!pgClient) {
    console.log(`${colors.cyan}→ Skipping index verification (DATABASE_URL / SUPABASE_DB_PASSWORD not set)${colors.reset}`);
    return;
  }

  try {
    const { rows } = await pgClient.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
    );
    const existingIndexes = rows.map((i) => i.indexname);

    for (const expectedIndex of EXPECTED_INDEXES) {
      if (existingIndexes.includes(expectedIndex)) {
        console.log(`${colors.green}✓ ${expectedIndex}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠ ${expectedIndex} - Not found (optional)${colors.reset}`);
      }
    }
  } catch (err) {
    console.log(`${colors.yellow}⚠ Cannot verify indexes: ${err.message}${colors.reset}`);
  }
}

/**
 * Check RLS policies
 */
async function checkRLS(supabase) {
  console.log(`\n${colors.blue}Checking Row-Level Security (RLS):${colors.reset}`);

  for (const table of EXPECTED_TABLES) {
    try {
      // Try to select from table without auth context
      // If RLS is enabled and no policy allows it, will get error
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error?.code === 'PGRST116') {
        console.log(`${colors.yellow}⚠ ${table} - Table not found${colors.reset}`);
      } else if (error?.code === 'PGRST119') {
        // Access denied = RLS is working
        console.log(`${colors.green}✓ ${table} - RLS enabled (access denied)${colors.reset}`);
      } else {
        console.log(`${colors.cyan}→ ${table} - Status unknown${colors.reset}`);
      }
    } catch (err) {
      console.log(`${colors.yellow}⚠ ${table} - Check failed: ${err.message}${colors.reset}`);
    }
  }
}

/**
 * Test API connectivity
 */
async function testConnectivity(supabase) {
  console.log(`\n${colors.blue}Testing Connectivity:${colors.reset}`);

  try {
    const { error } = await supabase.auth.getSession();
    if (error && !error.message.includes('Not authenticated')) {
      console.log(`${colors.yellow}⚠ Auth check: ${error.message}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Supabase API responsive${colors.reset}`);
    }
  } catch (err) {
    console.log(`${colors.red}✗ Connection failed: ${err.message}${colors.reset}`);
  }
}

/**
 * Main verification script
 */
async function verifyMigration() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  AI Features - Migration Verification     ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════╝${colors.reset}`);

  // Check environment
  if (!SUPABASE_URL) {
    console.log(`\n${colors.red}ERROR: SUPABASE_URL not set in .env${colors.reset}`);
    console.log(`${colors.yellow}Please set SUPABASE_URL in backend/.env${colors.reset}`);
    process.exit(1);
  }

  if (!SUPABASE_KEY) {
    console.log(`\n${colors.red}ERROR: SUPABASE_ANON_KEY not set in .env${colors.reset}`);
    console.log(`${colors.yellow}Please set SUPABASE_ANON_KEY in backend/.env${colors.reset}`);
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  let pgClient = null;
  if (DATABASE_URL) {
    pgClient = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await pgClient.connect();
    } catch (err) {
      console.log(`${colors.yellow}⚠ Direct PostgreSQL connection unavailable: ${err.message}${colors.reset}`);
      pgClient = null;
    }
  }

  try {
    // Run all checks
    await testConnectivity(supabase);
    await checkTables(supabase);
    await checkColumns(pgClient);
    await checkIndexes(pgClient);
    await checkRLS(supabase);
  } finally {
    await pgClient?.end().catch(() => {});
  }

  // Summary
  console.log(`\n${colors.blue}Verification Summary:${colors.reset}`);
  console.log(`${colors.green}✓ = Table exists and is working${colors.reset}`);
  console.log(`${colors.yellow}⚠ = Warning or optional check${colors.reset}`);
  console.log(`${colors.cyan}→ = Information only${colors.reset}`);
  console.log(`${colors.red}✗ = Critical issue${colors.reset}`);

  console.log(
    `\n${colors.green}Migration verification complete!${colors.reset}\n`
  );
  console.log(`${colors.blue}Next steps:${colors.reset}`);
  console.log(`1. If green checkmarks above, migration was successful`);
  console.log(`2. Start backend: cd backend && npm start`);
  console.log(`3. Start frontend: cd frontend && npm run dev`);
  console.log(`4. Run tests: npm run test:ai-features\n`);
}

// Run verification
verifyMigration().catch((error) => {
  console.error(`${colors.red}Verification failed: ${error.message}${colors.reset}`);
  process.exit(1);
});
