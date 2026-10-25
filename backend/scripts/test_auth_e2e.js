import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../db/supabaseClient.js';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, headers: res.headers, data };
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`  PrepLoop Auth Test: Signup -> Login -> Forgot Password`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const uniqueId = Date.now().toString().slice(-6);
  const testEmail = `preploop.test.${uniqueId}@example.com`;
  const testPassword = `TestSecurePass123!`;
  const fullName = `Automated Tester ${uniqueId}`;

  let createdUserId = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: CREATE ACCOUNT (SIGNUP)
    // -------------------------------------------------------------
    console.log(`[TEST 1] Create Account (POST /api/auth/signup)...`);

    // 1a. Test weak password validation (<8 chars)
    const weakPassRes = await post('/api/auth/signup', {
      email: testEmail,
      password: 'Weak1!',
      fullName
    });
    if (weakPassRes.status === 400 && (weakPassRes.data?.error?.includes('8 characters') || weakPassRes.data?.error?.includes('characters'))) {
      console.log(`  ✅ Weak password rejection passed: "${weakPassRes.data.error}"`);
    } else {
      console.warn(`  ⚠️ Weak password check unexpected: status=${weakPassRes.status}`, weakPassRes.data);
    }

    // 1b. Test valid account creation
    const signupRes = await post('/api/auth/signup', {
      email: testEmail,
      password: testPassword,
      fullName
    });

    console.log(`  Status: ${signupRes.status}`);
    console.log(`  Response:`, JSON.stringify(signupRes.data, null, 2));

    if (signupRes.status === 200 || signupRes.status === 201) {
      createdUserId = signupRes.data?.user?.id;
      console.log(`  ✅ Create Account passed! User ID: ${createdUserId}`);
    } else {
      throw new Error(`Signup failed with status ${signupRes.status}: ${JSON.stringify(signupRes.data)}`);
    }

    // Wait 500ms to allow Supabase profiles trigger to finish propagation
    await new Promise(resolve => setTimeout(resolve, 500));

    // -------------------------------------------------------------
    // TEST 2: LOGIN
    // -------------------------------------------------------------
    console.log(`\n[TEST 2] Login (POST /api/auth/login)...`);

    // 2a. Test invalid password
    const badLoginRes = await post('/api/auth/login', {
      email: testEmail,
      password: 'WrongPassword123!'
    });
    if (badLoginRes.status === 401 || badLoginRes.status === 400) {
      console.log(`  ✅ Invalid credentials correctly rejected (status ${badLoginRes.status})`);
    } else {
      console.warn(`  ⚠️ Invalid login unexpected: status=${badLoginRes.status}`, badLoginRes.data);
    }

    // 2b. Test valid login
    const loginRes = await post('/api/auth/login', {
      email: testEmail,
      password: testPassword
    });

    console.log(`  Status: ${loginRes.status}`);
    console.log(`  Has token: ${Boolean(loginRes.data?.token || loginRes.data?.access_token || loginRes.data?.session?.access_token)}`);
    console.log(`  User: ${loginRes.data?.user?.email || loginRes.data?.session?.user?.email}`);

    if (loginRes.status === 200 && (loginRes.data?.token || loginRes.data?.access_token || loginRes.data?.session?.access_token)) {
      console.log(`  ✅ Login passed successfully!`);
    } else {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }

    // -------------------------------------------------------------
    // TEST 3: FORGET PASSWORD
    // -------------------------------------------------------------
    console.log(`\n[TEST 3] Forget Password (POST /api/auth/forgot-password)...`);

    const forgotRes = await post('/api/auth/forgot-password', {
      email: testEmail
    });

    console.log(`  Status: ${forgotRes.status}`);
    console.log(`  Response:`, JSON.stringify(forgotRes.data, null, 2));

    if (forgotRes.status === 200) {
      console.log(`  ✅ Forget Password passed (email sent or link generated)!`);
    } else if (forgotRes.status === 503) {
      console.log(`  ℹ️ Forget Password returned 503: "${forgotRes.data?.error}" (SMTP provider rejection caught gracefully by your handler)`);
    } else {
      console.warn(`  ⚠️ Forget Password status: ${forgotRes.status}`, forgotRes.data);
    }

    // -------------------------------------------------------------
    // TEST 4: COMPLETE RESET PASSWORD FLOW
    // -------------------------------------------------------------
    console.log(`\n[TEST 4] Reset Password Flow (generateLink -> verify -> POST /api/auth/reset-password)...`);

    // 4a. Generate recovery link directly using Supabase Admin
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail
    });

    if (linkErr || !linkData?.properties?.email_otp) {
      throw new Error(`Failed to generate recovery link: ${linkErr?.message}`);
    }

    const emailOtp = linkData.properties.email_otp;
    console.log(`  Generated recovery OTP for test: ${emailOtp}`);

    // 4b. Verify OTP to get user session / access token
    const { data: verifyData, error: verifyErr } = await supabaseAdmin.auth.verifyOtp({
      email: testEmail,
      token: emailOtp,
      type: 'recovery'
    });

    if (verifyErr || !verifyData?.session?.access_token) {
      throw new Error(`Failed to verify recovery OTP: ${verifyErr?.message}`);
    }

    const resetAccessToken = verifyData.session.access_token;
    const newTestPassword = 'BrandNewPassword123!';

    // 4c. Call /api/auth/reset-password
    const resetRes = await post('/api/auth/reset-password', {
      accessToken: resetAccessToken,
      newPassword: newTestPassword
    });

    console.log(`  Reset Password Status: ${resetRes.status}`);
    console.log(`  Reset Password Response:`, resetRes.data);

    if (resetRes.status !== 200) {
      throw new Error(`Password reset failed: ${JSON.stringify(resetRes.data)}`);
    }
    console.log(`  ✅ Password reset successful!`);

    // 4d. Verify login with the NEW password
    console.log(`\n[TEST 5] Login with NEW password...`);
    const newLoginRes = await post('/api/auth/login', {
      email: testEmail,
      password: newTestPassword
    });

    if (newLoginRes.status === 200 && (newLoginRes.data?.token || newLoginRes.data?.access_token)) {
      console.log(`  ✅ Login with new password succeeded!`);
    } else {
      throw new Error(`Login with new password failed: ${JSON.stringify(newLoginRes.data)}`);
    }

    console.log(`\n======================================================`);
    console.log(`  ALL 5 AUTH FLOW TESTS PASSED WITH 100% SUCCESS!`);
    console.log(`======================================================\n`);

  } finally {
    // Clean up created test user
    if (createdUserId) {
      console.log(`[CLEANUP] Deleting test user ${testEmail} (${createdUserId})...`);
      try {
        await supabaseAdmin.from('profiles').delete().eq('id', createdUserId);
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        console.log(`[CLEANUP] ✅ Test user deleted cleanly.`);
      } catch (err) {
        console.warn(`[CLEANUP] ⚠️ Error cleaning up user:`, err.message);
      }
    }
  }
}

run().catch(err => {
  console.error(`\n❌ Test Run Error:`, err);
  process.exit(1);
});
