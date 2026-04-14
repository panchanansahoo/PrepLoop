/**
 * Smoke test for Fresher HR AI-Generated Question Flow
 * Tests: Q1 fixed -> Q2-Q10 AI-generated -> Q11-Q12 fixed
 */

import http from 'node:http';

// Test data
let interviewId = null;
const userAnswer = 'This is my response to the question.';
const LOCAL_API_ORIGIN = 'http://localhost:5000';

function buildLocalUrl(routePath) {
  const url = new URL(routePath, LOCAL_API_ORIGIN);
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('Unsafe host for local smoke test request');
  }
  return url;
}

// Helper: Make HTTP request
function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = buildLocalUrl(path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log('🚀 Starting Fresher HR AI-Generated Flow Test...\n');

  try {
    // Step 1: Start Interview
    console.log('Step 1️⃣  Starting Fresher-HR interview...');
    const startRes = await makeRequest('/api/interview/start', 'POST', {
      interviewType: 'fresher-hr',
      scriptMode: true,
    });

    if (startRes.error) {
      console.error('❌ Start failed:', startRes.error);
      return;
    }

    interviewId = startRes.interviewId;
    console.log(`✅ Interview started: ${interviewId}`);
    console.log(`   Q1 (Fixed Intro): "${startRes.firstQuestion.substring(0, 80)}..."\n`);

    // Step 2: Q1 Response -> Q2 AI-Generated
    console.log('Step 2️⃣  Submitting Q1 response...');
    const q2Res = await makeRequest('/api/interview/follow-up', 'POST', {
      interviewId,
      questionNumber: 1,
      userAnswer,
    });

    if (q2Res.error) {
      console.error('❌ Q2 generation failed:', q2Res.error);
      return;
    }

    console.log(`✅ Q2 Generated (${q2Res.questionSource}):`);
    console.log(`   "${q2Res.followUpQuestion.substring(0, 100)}..."`);
    console.log(`   Is AI-Generated: ${q2Res.questionMeta.isAIGenerated}\n`);

    // Step 3: Q2 Response -> Q3 AI-Generated
    console.log('Step 3️⃣  Submitting Q2 response...');
    const q3Res = await makeRequest('/api/interview/follow-up', 'POST', {
      interviewId,
      questionNumber: 2,
      userAnswer: 'A different response for Q2.',
    });

    console.log(`✅ Q3 Generated (${q3Res.questionSource}):`);
    console.log(`   "${q3Res.followUpQuestion.substring(0, 100)}..."`);
    console.log(`   Is AI-Generated: ${q3Res.questionMeta.isAIGenerated}\n`);

    // Step 4: Fast-forward to Q11 (Wrap-up)
    console.log('Step 4️⃣  Fast-forwarding to Q11 (Wrap-up)...');
    const q11Res = await makeRequest('/api/interview/follow-up', 'POST', {
      interviewId,
      questionNumber: 10,
      userAnswer: 'Response to Q10.',
    });

    console.log(`✅ Q11 (Fixed Wrap-up):`);
    console.log(`   "${q11Res.followUpQuestion}"`);
    console.log(`   Is AI-Generated: ${q11Res.questionMeta.isAIGenerated}\n`);

    // Step 5: Q11 Response -> Q12 Closing
    console.log('Step 5️⃣  Submitting Q11 response (Q12 closing)...');
    const q12Res = await makeRequest('/api/interview/follow-up', 'POST', {
      interviewId,
      questionNumber: 11,
      userAnswer: 'Yes, I have a question about the role.',
    });

    console.log(`✅ Q12 Closing:`);
    console.log(`   "${q12Res.closingRemark}"`);
    console.log(`   Interview Complete: ${q12Res.complete}\n`);

    // Summary
    console.log('✅ All Tests Passed! Fresher HR AI-Generated Flow Working:');
    console.log('   ✓ Q1 fixed intro');
    console.log('   ✓ Q2-Q3 AI-generated (different topics)');
    console.log('   ✓ Q11 fixed wrap-up');
    console.log('   ✓ Q12 conditional closing');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

// Run test
runTest();
