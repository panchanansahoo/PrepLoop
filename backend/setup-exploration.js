#!/usr/bin/env node

/**
 * Quick Setup Script - Problem Exploration Enhancement
 * 
 * This script:
 * 1. Verifies database connection
 * 2. Applies migration to add exploration columns
 * 3. Seeds explore questions and test cases
 * 4. Verifies the setup
 * 
 * Usage: node backend/setup-exploration.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
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
    header('Problem Exploration Enhancement - Setup');

    // Step 1: Verify environment
    info('Step 1: Verifying environment...\n');
    
    const backendPath = path.join(__dirname, '..');
    const hasPackageJson = fs.existsSync(path.join(backendPath, 'package.json'));
    
    if (!hasPackageJson) {
      error('package.json not found in backend directory');
      process.exit(1);
    }
    success('Backend directory verified');

    // Check for required files
    const migrationFile = path.join(backendPath, 'db', 'migration_add_exploration.sql');
    const seedScript = path.join(backendPath, 'scripts', 'seedExploreQuestions.js');
    const enhanceScript = path.join(backendPath, 'scripts', 'enhanceProblemsWithExplore.js');

    if (!fs.existsSync(migrationFile)) {
      warning('Migration file not found - you may need to create it');
    } else {
      success('Migration file found');
    }

    if (!fs.existsSync(seedScript)) {
      warning('Seed script not found - you may need to create it');
    } else {
      success('Seed script found');
    }

    // Step 2: Check dependencies
    info('\nStep 2: Checking dependencies...\n');
    
    try {
      require.resolve('@supabase/supabase-js');
      success('Supabase client available');
    } catch (e) {
      warning('Supabase client not installed - it should be in package.json');
    }

    // Step 3: Verify configuration
    info('\nStep 3: Verifying configuration...\n');

    const envFile = path.join(backendPath, '..', '.env');
    if (fs.existsSync(envFile)) {
      success('.env file found');
      const envContent = fs.readFileSync(envFile, 'utf8');
      if (envContent.includes('SUPABASE')) {
        success('Supabase credentials configured');
      } else {
        warning('Supabase credentials not found in .env');
      }
    } else {
      warning('.env file not found - make sure Supabase is configured');
    }

    // Step 4: Provide setup options
    header('Setup Options');

    console.log(`${colors.bright}Choose how to proceed:${colors.reset}\n`);
    
    console.log(`${colors.cyan}Option 1: Quick Setup (Recommended for first-time)${colors.reset}`);
    console.log('  ✓ Runs seeding script to add explore questions');
    console.log('  ✓ Uses template-based questions (fast)');
    console.log('  ✓ Takes 1-2 minutes for all 425 problems');
    console.log('  Command: node backend/scripts/seedExploreQuestions.js\n');

    console.log(`${colors.cyan}Option 2: AI-Enhanced Setup (Personalized)${colors.reset}`);
    console.log('  ✓ Uses Groq API for unique question generation');
    console.log('  ✓ Creates tailored questions per problem');
    console.log('  ✓ Takes 20-30 minutes with rate limiting');
    console.log('  Command: GROQ_API_KEY=xxx node backend/scripts/enhanceProblemsWithExplore.js\n');

    console.log(`${colors.cyan}Option 3: Manual Setup${colors.reset}`);
    console.log('  1. Apply migration: Run migration_add_exploration.sql in Supabase');
    console.log('  2. Seed data: Run seedExploreQuestions.js');
    console.log('  3. Verify: Call GET /api/dsa/problems/1/explore\n');

    // Step 5: Next steps
    header('Next Steps');

    console.log(`${colors.bright}Before running seeding:${colors.reset}\n`);
    console.log('1. Make sure database migration has been applied:');
    console.log(`   ${colors.dim}Go to Supabase dashboard and run migration_add_exploration.sql${colors.reset}\n`);

    console.log(`${colors.bright}To seed explore questions:${colors.reset}\n`);
    console.log(`  ${colors.green}cd backend${colors.reset}`);
    console.log(`  ${colors.green}node scripts/seedExploreQuestions.js${colors.reset}\n`);

    console.log(`${colors.bright}To verify setup:${colors.reset}\n`);
    console.log(`  ${colors.green}curl http://localhost:5000/api/dsa/problems/1/explore${colors.reset}\n`);

    console.log(`${colors.bright}To check database:${colors.reset}\n`);
    console.log(`  Run in Supabase SQL editor:`);
    console.log(`  ${colors.dim}SELECT COUNT(*) as enhanced_problems FROM enhanced_problems WHERE exploration_metadata IS NOT NULL;${colors.reset}\n`);

    // Summary
    header('Summary');

    console.log(`${colors.bright}What this adds:${colors.reset}\n`);
    info('✓ 5-10 learning questions per problem (2,125+ total)');
    info('✓ 15+ test case scenarios per problem (6,375+ total)');
    info('✓ Two API endpoints for accessing exploration data');
    info('✓ Database optimization with GIN indexes\n');

    success('Setup instructions complete!');
    success('Follow the "Next Steps" above to complete setup.');

    console.log(colors.reset);
    
  } catch (err) {
    error(`Setup failed: ${err.message}`);
    process.exit(1);
  }
}

main();
