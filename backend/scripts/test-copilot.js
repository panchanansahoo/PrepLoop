/**
 * AI Job Copilot Backend Test Script
 * 
 * Tests the /api/copilot endpoints
 * Run with: npm run test:copilot
 */

const API_BASE = process.env.API_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCopilotAsk() {
  log('\n📝 Testing POST /api/copilot/ask', 'blue');
  
  try {
    const response = await fetch(`${API_BASE}/api/copilot/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        query: 'How do I answer "Why do you want to work at Google?"',
        context: 'Target role: Software Engineer',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      log('✅ Ask endpoint working', 'green');
      log(`Response preview: ${data.response?.substring(0, 100)}...`, 'reset');
      return true;
    } else {
      log(`❌ Ask endpoint failed: ${data.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Ask endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function testCopilotJobFit() {
  log('\n🎯 Testing POST /api/copilot/job-fit', 'blue');
  
  try {
    const response = await fetch(`${API_BASE}/api/copilot/job-fit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        jobTitle: 'Senior Frontend Developer',
        jobDescription: 'We are looking for an experienced React developer with 5+ years of experience. Must have strong TypeScript skills and experience with modern frontend tooling.',
        userProfile: {
          skills: ['React', 'TypeScript', 'JavaScript', 'CSS'],
          experience: '4 years',
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      log('✅ Job-fit endpoint working', 'green');
      log(`Analysis preview: ${data.analysis?.substring(0, 100)}...`, 'reset');
      return true;
    } else {
      log(`❌ Job-fit endpoint failed: ${data.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Job-fit endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function testValidation() {
  log('\n🔍 Testing input validation', 'blue');
  
  try {
    const response = await fetch(`${API_BASE}/api/copilot/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        query: '',
      }),
    });

    const data = await response.json();

    if (response.status === 400 && data.error) {
      log('✅ Validation working correctly', 'green');
      return true;
    } else {
      log(`❌ Validation not working as expected (status: ${response.status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Validation test error: ${error.message}`, 'red');
    return false;
  }
}

async function testUnauthenticatedProtection() {
  log('\n🔒 Testing Auth-Gate Protection (Unauthenticated)', 'blue');
  
  try {
    // 1. Missing token
    const resNoToken = await fetch(`${API_BASE}/api/copilot/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Hello' }),
    });
    const passNoToken = resNoToken.status === 401;

    // 2. Malformed token
    const resBadToken = await fetch(`${API_BASE}/api/copilot/job-fit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-12345',
      },
      body: JSON.stringify({ jobTitle: 'Developer' }),
    });
    const passBadToken = resBadToken.status === 401 || resBadToken.status === 403;

    if (passNoToken && passBadToken) {
      log('✅ Copilot routes strictly enforce authentication (401)', 'green');
      return true;
    } else {
      log(`❌ Auth gate failed: missing=${resNoToken.status}, invalid=${resBadToken.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Auth gate test error: ${error.message}`, 'red');
    return false;
  }
}

async function checkServerHealth() {
  log('\n🏥 Checking server health', 'blue');
  
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();

    if (response.ok && data.status === 'ok') {
      log('✅ Server is healthy', 'green');
      return true;
    } else {
      log('❌ Server health check failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Cannot connect to server: ${error.message}`, 'red');
    log(`Make sure the backend is running on ${API_BASE}`, 'yellow');
    return false;
  }
}

async function runTests() {
  log('🚀 AI Job Copilot Backend Tests', 'blue');
  log('================================\n', 'blue');

  const serverHealthy = await checkServerHealth();
  
  if (!serverHealthy) {
    log('\n⚠️  Server is not running. Start it with: npm run dev', 'yellow');
    process.exit(1);
  }

  if (AUTH_TOKEN) {
    log('Mode: AUTHENTICATED (Running live inference tests)', 'green');
    const results = {
      ask: await testCopilotAsk(),
      jobFit: await testCopilotJobFit(),
      validation: await testValidation(),
    };

    log('\n📊 Test Results', 'blue');
    log('===============', 'blue');
    log(`Ask Endpoint: ${results.ask ? '✅ PASS' : '❌ FAIL'}`, results.ask ? 'green' : 'red');
    log(`Job-Fit Endpoint: ${results.jobFit ? '✅ PASS' : '❌ FAIL'}`, results.jobFit ? 'green' : 'red');
    log(`Validation: ${results.validation ? '✅ PASS' : '❌ FAIL'}`, results.validation ? 'green' : 'red');

    const allPassed = Object.values(results).every(r => r);
    process.exit(allPassed ? 0 : 1);
  } else {
    log('Mode: UNAUTHENTICATED (Verifying security auth gates)', 'yellow');
    log('💡 Note: Set TEST_AUTH_TOKEN to run live Copilot AI inference tests.', 'yellow');
    
    const authGatePassed = await testUnauthenticatedProtection();
    log('\n📊 Test Results', 'blue');
    log('===============', 'blue');
    log(`Copilot Auth Guard: ${authGatePassed ? '✅ PASS' : '❌ FAIL'}`, authGatePassed ? 'green' : 'red');

    process.exit(authGatePassed ? 0 : 1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
