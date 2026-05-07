#!/usr/bin/env node

/**
 * Phase 1 Performance Optimization Runner
 * Executes all Phase 1 optimizations in sequence
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Starting Phase 1 Performance Optimization\n');
console.log('=' .repeat(70));

const steps = [
  {
    name: 'Frontend Bundle Analysis',
    command: 'cd frontend && npm run build',
    description: 'Build frontend and generate bundle analysis',
  },
  {
    name: 'Database Index Migration',
    command: 'node backend/scripts/optimize-database.js',
    description: 'Apply critical database indexes',
    optional: true, // Requires SUPABASE credentials
    skipMessage: 'Skipping database migration (missing Supabase credentials)',
  },
  {
    name: 'Cache Configuration Check',
    command: 'node backend/scripts/cacheStats.js',
    description: 'Verify Redis cache configuration',
  },
  {
    name: 'Backend Route Audit',
    command: 'node backend/scripts/performanceReport.js',
    description: 'Analyze API endpoint performance',
  },
];

let currentStep = 0;
const results = [];

for (const step of steps) {
  currentStep++;
  console.log(`\n[${currentStep}/${steps.length}] ${step.name}`);
  console.log('-'.repeat(70));
  console.log(`Description: ${step.description}\n`);
  
  // Check if step should be skipped
  if (step.optional) {
    // Check for required environment variables
    if (step.name.includes('Database')) {
      const hasSupabaseUrl = process.env.SUPABASE_URL;
      const hasSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!hasSupabaseUrl || !hasSupabaseKey) {
        console.log('⚠️  Skipping: Missing required environment variables');
        console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
        console.log(`   ${step.skipMessage}\n`);
        results.push({
          step: step.name,
          status: '⏭️  SKIPPED',
          reason: 'Missing environment variables',
        });
        continue;
      }
    }
  }
  
  try {
    const startTime = Date.now();
    
    // Execute command
    execSync(step.command, { 
      stdio: 'inherit',
      cwd: rootDir,
      env: process.env 
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    results.push({
      step: step.name,
      status: '✅ SUCCESS',
      duration: `${duration}s`,
    });
    
    console.log(`\n✅ ${step.name} completed in ${duration}s`);
  } catch (error) {
    results.push({
      step: step.name,
      status: '❌ FAILED',
      error: error.message,
    });
    
    console.error(`\n❌ ${step.name} failed:`, error.message);
    console.log('\n⚠️  Continuing with next step...\n');
  }
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 PHASE 1 OPTIMIZATION SUMMARY');
console.log('='.repeat(70));

results.forEach((result, index) => {
  console.log(`\n${index + 1}. ${result.step}`);
  console.log(`   Status: ${result.status}`);
  if (result.duration) {
    console.log(`   Duration: ${result.duration}`);
  }
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
});

const successCount = results.filter(r => r.status === '✅ SUCCESS').length;
const totalCount = results.length;

console.log('\n' + '='.repeat(70));
console.log(`\nOverall: ${successCount}/${totalCount} steps completed successfully\n`);

if (successCount === totalCount) {
  console.log('✅ All Phase 1 optimizations completed successfully!\n');
  console.log('Next Steps:');
  console.log('1. Review bundle analysis at frontend/dist/stats.html');
  console.log('2. Monitor database query performance');
  console.log('3. Check cache hit rates in production');
  console.log('4. Run load tests to verify improvements');
  console.log('5. Proceed to Phase 2: Security Hardening\n');
} else {
  console.log('⚠️  Some optimizations failed. Please review errors above.\n');
  console.log('You can still proceed, but some improvements may not be applied.\n');
}

console.log('='.repeat(70));
