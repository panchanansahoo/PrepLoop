// @validate: structured
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_CASES = [
  { name: 'Improvement Plan Service', path: './services/improvementPlanService.js' },
  { name: 'Improvement Plan Routes', path: './routes/improvement-plan.js' },
  { name: 'Health Check Middleware', path: './middleware/healthCheck.js' },
  { name: 'Main Index File', path: './index.js' }
];

const RESULTS = [];

console.log('🔍 Starting validation of PrepLoop improvements...\n');

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
  './middleware/healthCheck.js'
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
  
  console.log(hasDetailedHealthCheckRoute ? '✅ Detailed health route: Added to index.js' : '❌ Detailed health route: Not found in index.js');
  
  RESULTS.push({
    name: 'Detailed health check route',
    passed: hasDetailedHealthCheckRoute,
    message: hasDetailedHealthCheckRoute ? 'Route added to index.js' : 'Route not found in index.js'
  });
} catch (error) {
  console.log(`❌ Could not read index file: ${error.message}`);
  RESULTS.push({
    name: 'Index.js route validation',
    passed: false,
    message: error.message
  });
}

// Summary
console.log('\n📊 Validation Summary:');
console.log('=====================');

let passedCount = 0;
let totalCount = RESULTS.length;

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