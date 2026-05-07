// @validate: structured
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_CASES = [
  { name: 'Improvement Plan Service', path: './services/improvementPlanService.js' },
  { name: 'Improvement Plan Routes', path: './routes/improvement-plan.js' },
  { name: 'Health Check Middleware', path: './middleware/healthCheck.js' },
  { name: 'Monitoring Middleware', path: './middleware/monitoring.js' },
  { name: 'Main Index File', path: './index.js' },
  { name: 'Database Migration Script', path: './db/migration_improvement_plan_indexes.sql' }
];

const RESULTS = [];

console.log('🔍 Starting comprehensive validation of PrepLoop improvements...\n');

// Test 1: Check if files exist and are readable
for (const testCase of TEST_CASES) {
  try {
    const fullPath = path.join(process.cwd(), testCase.path);
    const stat = fs.statSync(fullPath);
    
    RESULTS.push({
      name: testCase.name,
      passed: stat.isFile(),
      message: stat.isFile() ? 'File exists' : 'File does not exist'
    });
    
    console.log(`✅ ${testCase.name}: File exists`);
  } catch (error) {
    RESULTS.push({
      name: testCase.name,
      passed: false,
      message: error.message
    });
    
    console.log(`❌ ${testCase.name}: ${error.message}`);
  }
}

// Test 2: Syntax validation for key files
const JS_FILES_TO_VALIDATE = [
  './services/improvementPlanService.js',
  './routes/improvement-plan.js',
  './middleware/healthCheck.js',
  './middleware/monitoring.js'
];

for (const jsFile of JS_FILES_TO_VALIDATE) {
  try {
    execSync(`node --check ${path.join(process.cwd(), jsFile)}`, { stdio: 'pipe' });
    console.log(`✅ ${jsFile}: Syntax OK`);
    
    const result = RESULTS.find(r => r.name.includes(jsFile.split('/')[1]));
    if (result) {
      result.syntaxValid = true;
    } else {
      RESULTS.push({
        name: `Syntax check: ${jsFile}`,
        passed: true,
        message: 'Syntax is valid'
      });
    }
  } catch (error) {
    console.log(`❌ ${jsFile}: Syntax error - ${error.message}`);
    
    RESULTS.push({
      name: `Syntax check: ${jsFile}`,
      passed: false,
      message: error.message
    });
  }
}

// Test 3: Check for the new endpoints in the improvement plan routes
try {
  const routesContent = fs.readFileSync(path.join(process.cwd(), './routes/improvement-plan.js'), 'utf8');
  
  const newEndpoints = [
    { name: 'GET /:planId', check: /router\.get\('\/:planId',/ },
    { name: 'POST /:planId/complete', check: /router\.post\('\/:planId\/complete',/ }
  ];
  
  for (const endpoint of newEndpoints) {
    const found = endpoint.check.test(routesContent);
    console.log(found ? `✅ ${endpoint.name}: Endpoint exists` : `❌ ${endpoint.name}: Endpoint missing`);
    
    RESULTS.push({
      name: `Route: ${endpoint.name}`,
      passed: found,
      message: found ? 'Endpoint implemented' : 'Endpoint not found'
    });
  }
} catch (error) {
  console.log(`❌ Could not read routes file: ${error.message}`);
  RESULTS.push({
    name: 'Routes validation',
    passed: false,
    message: error.message
  });
}

// Test 4: Check for the new detailed health check function
try {
  const healthCheckContent = fs.readFileSync(path.join(process.cwd(), './middleware/healthCheck.js'), 'utf8');
  const hasDetailedHealthCheck = /export.*detailedHealthCheck/.test(healthCheckContent);
  
  console.log(hasDetailedHealthCheck ? '✅ detailedHealthCheck: Function exists' : '❌ detailedHealthCheck: Function missing');
  
  RESULTS.push({
    name: 'Detailed health check function',
    passed: hasDetailedHealthCheck,
    message: hasDetailedHealthCheck ? 'Function implemented' : 'Function not found'
  });
} catch (error) {
  console.log(`❌ Could not read health check file: ${error.message}`);
  RESULTS.push({
    name: 'Health check validation',
    passed: false,
    message: error.message
  });
}

// Test 5: Check if the detailed health check route was added to index.js
try {
  const indexContent = fs.readFileSync(path.join(process.cwd(), './index.js'), 'utf8');
  const hasDetailedHealthCheckRoute = /app\.get\(.*detail.*detailedHealthCheck\)/.test(indexContent);
  const hasMetricsRoute = /app\.get\(.*metrics.*metricsEndpoint\)/.test(indexContent);
  const hasErrorTracking = /errorTrackingMiddleware/.test(indexContent);
  
  console.log(hasDetailedHealthCheckRoute ? '✅ Detailed health route: Added to index.js' : '❌ Detailed health route: Not found in index.js');
  console.log(hasMetricsRoute ? '✅ Metrics route: Added to index.js' : '❌ Metrics route: Not found in index.js');
  console.log(hasErrorTracking ? '✅ Error tracking: Added to index.js' : '❌ Error tracking: Not found in index.js');
  
  RESULTS.push({
    name: 'Detailed health check route',
    passed: hasDetailedHealthCheckRoute,
    message: hasDetailedHealthCheckRoute ? 'Route added to index.js' : 'Route not found in index.js'
  });
  
  RESULTS.push({
    name: 'Metrics route',
    passed: hasMetricsRoute,
    message: hasMetricsRoute ? 'Route added to index.js' : 'Route not found in index.js'
  });
  
  RESULTS.push({
    name: 'Error tracking middleware',
    passed: hasErrorTracking,
    message: hasErrorTracking ? 'Middleware added to index.js' : 'Middleware not found in index.js'
  });
} catch (error) {
  console.log(`❌ Could not read index file: ${error.message}`);
  RESULTS.push({
    name: 'Index.js route validation',
    passed: false,
    message: error.message
  });
}

// Test 6: Check monitoring functionality
try {
  const monitoringContent = fs.readFileSync(path.join(process.cwd(), './middleware/monitoring.js'), 'utf8');
  const hasMetricsEndpoint = /export.*metricsEndpoint/.test(monitoringContent);
  const hasRequestMetrics = /export.*requestMetricsMiddleware/.test(monitoringContent);
  const hasErrorTracking = /export.*errorTrackingMiddleware/.test(monitoringContent);
  
  console.log(hasMetricsEndpoint ? '✅ Metrics endpoint: Function exists' : '❌ Metrics endpoint: Function missing');
  console.log(hasRequestMetrics ? '✅ Request metrics middleware: Function exists' : '❌ Request metrics middleware: Function missing');
  console.log(hasErrorTracking ? '✅ Error tracking middleware: Function exists' : '❌ Error tracking middleware: Function missing');
  
  RESULTS.push({
    name: 'Metrics endpoint function',
    passed: hasMetricsEndpoint,
    message: hasMetricsEndpoint ? 'Function implemented' : 'Function not found'
  });
  
  RESULTS.push({
    name: 'Request metrics middleware',
    passed: hasRequestMetrics,
    message: hasRequestMetrics ? 'Function implemented' : 'Function not found'
  });
  
  RESULTS.push({
    name: 'Error tracking middleware',
    passed: hasErrorTracking,
    message: hasErrorTracking ? 'Function implemented' : 'Function not found'
  });
} catch (error) {
  console.log(`❌ Could not read monitoring file: ${error.message}`);
  RESULTS.push({
    name: 'Monitoring validation',
    passed: false,
    message: error.message
  });
}

// Test 7: Check database migration exists
try {
  const migrationPath = path.join(process.cwd(), './db/migration_improvement_plan_indexes.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const hasIndexes = /CREATE INDEX CONCURRENTLY/.test(migrationContent);
  
  console.log(migrationExists ? '✅ Database migration: File exists' : '❌ Database migration: File missing');
  console.log(hasIndexes ? '✅ Database indexes: SQL commands exist' : '❌ Database indexes: SQL commands missing');
  
  RESULTS.push({
    name: 'Database migration file',
    passed: migrationExists,
    message: migrationExists ? 'File exists' : 'File does not exist'
  });
  
  RESULTS.push({
    name: 'Database indexes SQL',
    passed: hasIndexes,
    message: hasIndexes ? 'SQL commands exist' : 'SQL commands missing'
  });
} catch (error) {
  console.log(`❌ Could not read database migration: ${error.message}`);
  RESULTS.push({
    name: 'Database migration validation',
    passed: false,
    message: error.message
  });
}

// Summary
console.log('\n📊 Validation Summary:');
console.log('=====================');

let passedCount = 0;
const totalCount = RESULTS.length;

for (const result of RESULTS) {
  if (result.passed) {
    passedCount++;
    console.log(`✅ ${result.name}: PASSED`);
  } else {
    console.log(`❌ ${result.name}: FAILED - ${result.message}`);
  }
}

console.log(`\n📈 Results: ${passedCount}/${totalCount} tests passed`);

const overallSuccess = passedCount === totalCount;
console.log(`\n🎯 Overall Status: ${overallSuccess ? 'SUCCESS' : 'FAILURE'}`);

// Exit with appropriate code
process.exit(overallSuccess ? 0 : 1);