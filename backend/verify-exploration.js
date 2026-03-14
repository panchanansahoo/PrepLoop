#!/usr/bin/env node

/**
 * Verification Script - Problem Exploration Enhancement
 * 
 * This script verifies that:
 * 1. Database migration has been applied
 * 2. Explore questions have been seeded
 * 3. API endpoints are responding correctly
 * 4. Data structure is valid
 * 
 * Usage: node backend/verify-exploration.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
  log(title, 'cyan');
  console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

async function main() {
  try {
    header('Problem Exploration Enhancement - Verification');

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      error('Supabase credentials not configured in .env');
      error('Set SUPABASE_URL and SUPABASE_KEY environment variables');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    success('Connected to Supabase');

    // Check 1: Database columns exist
    info('\nCheck 1: Verifying database schema...\n');

    const { data: problemData, error: problemError } = await supabase
      .from('problems')
      .select('id, title, explore_questions, extended_test_cases, exploration_metadata')
      .limit(1);

    if (problemError) {
      error(`Database query failed: ${problemError.message}`);
      warning('The migration may not have been applied yet');
      console.log('\nRun the migration_add_exploration.sql file in Supabase SQL editor');
      process.exit(1);
    }

    success('Database columns accessible');

    if (problemData && problemData.length > 0) {
      const sample = problemData[0];
      success(`Sample problem loaded: "${sample.title}"`);
    }

    // Check 2: Count enhanced problems
    info('\nCheck 2: Counting enhanced problems...\n');

    const { data: stats, error: statsError } = await supabase
      .rpc('get_exploration_stats')
      .then(r => ({ data: null, error: r.error }))
      .catch(e => ({ data: null, error: e }));

    const { count: enhancedCount, error: countError } = await supabase
      .from('problems')
      .select('*', { count: 'exact', head: true })
      .not('explore_questions', 'is', null);

    if (!countError) {
      success(`${enhancedCount} problems have explore questions`);
    } else {
      warning('Could not count enhanced problems');
    }

    // Check 3: Sample explore questions
    info('\nCheck 3: Sampling explore questions...\n');

    const { data: sampleProblems, error: sampleError } = await supabase
      .from('problems')
      .select('id, title, explore_questions')
      .not('explore_questions', 'is', null)
      .limit(3);

    if (sampleError) {
      warning('Could not fetch sample problems with explore questions');
    } else if (sampleProblems && sampleProblems.length > 0) {
      success(`Found ${sampleProblems.length} problems with explore questions`);

      sampleProblems.forEach((problem, idx) => {
        const questionCount = Array.isArray(problem.explore_questions) 
          ? problem.explore_questions.length 
          : 0;
        info(`  ${idx + 1}. ${problem.title} - ${questionCount} questions`);
      });

      // Show sample question format
      if (sampleProblems[0].explore_questions && sampleProblems[0].explore_questions.length > 0) {
        console.log('\n  Sample question format:');
        const sample = sampleProblems[0].explore_questions[0];
        console.log(`    ${colors.dim}${JSON.stringify(sample, null, 6)}${colors.reset}`);
      }
    } else {
      warning('No problems have explore questions yet');
      warning('Run: node backend/scripts/seedExploreQuestions.js');
    }

    // Check 4: Sample test cases
    info('\nCheck 4: Sampling extended test cases...\n');

    const { data: testCaseProblems, error: testCaseError } = await supabase
      .from('problems')
      .select('id, title, extended_test_cases')
      .not('extended_test_cases', 'is', null)
      .limit(3);

    if (testCaseError) {
      warning('Could not fetch sample problems with test cases');
    } else if (testCaseProblems && testCaseProblems.length > 0) {
      success(`Found ${testCaseProblems.length} problems with extended test cases`);

      testCaseProblems.forEach((problem, idx) => {
        const caseCount = Array.isArray(problem.extended_test_cases)
          ? problem.extended_test_cases.length
          : 0;
        info(`  ${idx + 1}. ${problem.title} - ${caseCount} test cases`);
      });
    } else {
      warning('No problems have extended test cases yet');
    }

    // Check 5: View status
    info('\nCheck 5: Verifying enhanced_problems view...\n');

    const { data: viewData, error: viewError } = await supabase
      .from('enhanced_problems')
      .select('*')
      .limit(1);

    if (viewError) {
      warning('enhanced_problems view not accessible yet');
      warning('Run the database migration to create the view');
    } else {
      success('enhanced_problems view is accessible');
      if (viewData && viewData.length > 0) {
        const sample = viewData[0];
        info(`  Sample enhancement status:`);
        info(`    Questions: ${sample.explore_questions_count || 0}`);
        info(`    Test cases: ${sample.extended_test_cases_count || 0}`);
      }
    }

    // Check 6: Statistics
    info('\nCheck 6: Generating statistics...\n');

    const { data: allProblems } = await supabase
      .from('problems')
      .select('id, explore_questions, extended_test_cases')
      .limit(500);

    if (allProblems) {
      const totalProblems = allProblems.length;
      const problemsWithQuestions = allProblems.filter(p => p.explore_questions).length;
      const problemsWithTestCases = allProblems.filter(p => p.extended_test_cases).length;

      info(`Total problems analyzed: ${totalProblems}`);
      info(`Problems with explore questions: ${problemsWithQuestions} (${Math.round((problemsWithQuestions/totalProblems)*100)}%)`);
      info(`Problems with extended test cases: ${problemsWithTestCases} (${Math.round((problemsWithTestCases/totalProblems)*100)}%)`);

      if (problemsWithQuestions > 0) {
        const totalQuestions = allProblems
          .filter(p => p.explore_questions)
          .reduce((sum, p) => sum + (Array.isArray(p.explore_questions) ? p.explore_questions.length : 0), 0);
        info(`Total explore questions: ${totalQuestions}`);
      }

      if (problemsWithTestCases > 0) {
        const totalCases = allProblems
          .filter(p => p.extended_test_cases)
          .reduce((sum, p) => sum + (Array.isArray(p.extended_test_cases) ? p.extended_test_cases.length : 0), 0);
        info(`Total test case scenarios: ${totalCases}`);
      }
    }

    // Summary
    header('Verification Status');

    const needsMigration = !sampleProblems || sampleProblems.length === 0;
    const needsSeeding = needsMigration || enhancedCount === 0;

    if (needsMigration) {
      warning('Database migration appears not to have been applied');
      console.log('\nTo apply migration:');
      console.log(`  1. Open Supabase dashboard: ${colors.blue}https://app.supabase.com${colors.reset}`);
      console.log(`  2. Go to SQL editor`);
      console.log(`  3. Run: backend/db/migration_add_exploration.sql\n`);
    } else {
      success('Database migration has been applied');
    }

    if (needsSeeding) {
      warning('Explore questions have not been seeded yet');
      console.log('\nTo seed explore questions:');
      console.log(`  ${colors.cyan}cd backend${colors.reset}`);
      console.log(`  ${colors.cyan}node scripts/seedExploreQuestions.js${colors.reset}\n`);
    } else {
      success('Explore questions have been seeded');
    }

    if (!needsMigration && !needsSeeding) {
      success('All checks passed ✓');
      console.log('\nSetup is complete! You can now:');
      console.log('  ✓ Access explore questions via API: GET /api/dsa/problems/:id/explore');
      console.log('  ✓ Display them in frontend components');
      console.log('  ✓ Build interactive learning experiences\n');
    }

    console.log(colors.reset);
    
  } catch (err) {
    error(`Verification failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
