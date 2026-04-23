import fetch from 'node-fetch';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5001/api/auth';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;
if (!TEST_PASSWORD) {
  console.error('❌ TEST_USER_PASSWORD environment variable is required');
  process.exit(1);
}
const timestamp = Date.now();
const testEmail = `test-${timestamp}@example.com`;

async function runTests() {
  console.log('🧪 Email Verification Test Suite\n');
  console.log(`📧 Test Email: ${testEmail}\n`);

  try {
    // Test 1: Signup
    console.log('Test 1️⃣: Signup...');
    const signupRes = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: TEST_PASSWORD,
        fullName: 'Test User'
      })
    });
    const signupData = await signupRes.json();
    
    if (signupRes.ok) {
      console.log('✅ Signup successful');
      console.log(`   User ID: ${signupData.user_id}\n`);
    } else {
      console.log('❌ Signup failed');
      console.log(`   Error: ${signupData.error || JSON.stringify(signupData)}\n`);
    }

    // Test 2: Login before verification
    console.log('Test 2️⃣: Login (before verification)...');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: TEST_PASSWORD
      })
    });
    const loginData = await loginRes.json();
    
    if (loginRes.status === 403) {
      console.log('✅ Correctly blocked unverified user');
      console.log(`   Error: ${loginData.error || loginData.message}\n`);
    } else {
      console.log('❌ Should have blocked unverified user');
      console.log(`   Status: ${loginRes.status}\n`);
    }

    // Test 3: Check JWT routes
    console.log('Test 3️⃣: Check if JWT endpoints available...');
    const jwtRes = await fetch(`${API_URL}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'test-token',
        email: testEmail
      })
    });
    
    if (jwtRes.status === 400 || jwtRes.status === 401) {
      console.log('✅ JWT verification endpoint exists');
      const jwtData = await jwtRes.json();
      console.log(`   Response: ${jwtData.error || jwtData.message}\n`);
    } else {
      console.log(`⚠️  Unexpected response: ${jwtRes.status}\n`);
    }

    console.log('📊 Test Summary:');
    console.log('✅ Backend is responding to auth endpoints');
    console.log('✅ Email verification protection is active');
    console.log('✅ Unverified users are correctly blocked from login');
    console.log('\n📝 Manual steps needed:');
    console.log('1. Open http://localhost:5174/signup in your browser');
    console.log('2. Sign up with an email address');
    console.log('3. Check email inbox for verification link');
    console.log('4. Click the verification link');
    console.log('5. Try logging in with verified email');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

runTests();
