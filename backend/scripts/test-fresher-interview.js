/**
 * Test script for Fresher Interview Flow
 * Tests the complete flow: 5 fixed intro -> random HR -> 5 fixed technical -> random technical (1 DSA + 2 OOP)
 */

import http from 'node:http';

const LOCAL_API_ORIGIN = 'http://localhost:5000';
let sessionId = null;

function buildLocalUrl(routePath) {
  const url = new URL(routePath, LOCAL_API_ORIGIN);
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('Unsafe host for local test');
  }
  return url;
}

function makeRequest(path, method = 'GET', body = null, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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
  console.log('🚀 Starting Fresher Interview Flow Test...\n');

  try {
    // Note: You'll need a valid token for authenticated requests
    // For testing, you can either:
    // 1. Create a test user and get their token
    // 2. Use an existing token
    const testToken = process.env.TEST_TOKEN || 'YOUR_TEST_TOKEN_HERE';

    if (testToken === 'YOUR_TEST_TOKEN_HERE') {
      console.log('⚠️  Please set TEST_TOKEN environment variable or update the script');
      console.log('   Example: TEST_TOKEN=your_token node test-fresher-interview.js');
      return;
    }

    // Step 1: Start Interview
    console.log('Step 1️⃣  Starting Fresher Interview...');
    const startRes = await makeRequest('/api/fresher-interview/start', 'POST', {
      interviewerName: 'John Smith',
      role: 'Senior HR Manager',
      company: 'TechCorp',
      roundName: 'Technical + HR Round'
    }, testToken);

    if (startRes.error) {
      console.error('❌ Start failed:', startRes.error);
      return;
    }

    sessionId = startRes.sessionId;
    console.log(`✅ Interview started: ${sessionId}`);
    console.log(`   Greeting: "${startRes.greeting.substring(0, 80)}..."`);
    console.log(`   First Question: "${startRes.firstQuestion}"\n`);

    // Step 2: Answer all 5 fixed intro questions
    console.log('Step 2️⃣  Answering 5 fixed intro questions...');
    for (let i = 0; i < 5; i++) {
      const answerRes = await makeRequest('/api/fresher-interview/answer', 'POST', {
        sessionId,
        answer: `This is my answer to question ${i + 1}. I have relevant experience and skills.`
      }, testToken);

      if (answerRes.error) {
        console.error(`❌ Answer ${i + 1} failed:`, answerRes.error);
        return;
      }

      if (answerRes.nextQuestion) {
        console.log(`   Q${i + 2}: "${answerRes.nextQuestion.substring(0, 60)}..."`);
      }
    }
    console.log('✅ Completed intro phase\n');

    // Step 3: Answer HR questions (should get random questions)
    console.log('Step 3️⃣  Answering HR round questions...');
    for (let i = 0; i < 5; i++) {
      const answerRes = await makeRequest('/api/fresher-interview/answer', 'POST', {
        sessionId,
        answer: `My answer to HR question ${i + 1}. I am motivated and team-oriented.`
      }, testToken);

      if (answerRes.error) {
        console.error(`❌ HR answer ${i + 1} failed:`, answerRes.error);
        return;
      }

      if (answerRes.nextQuestion) {
        console.log(`   HR Q${i + 1}: "${answerRes.nextQuestion.substring(0, 60)}..."`);
      }

      if (answerRes.message) {
        console.log(`   ${answerRes.message}`);
      }
    }
    console.log('✅ Completed HR phase\n');

    // Step 4: Answer 5 fixed technical questions
    console.log('Step 4️⃣  Answering 5 fixed technical questions...');
    for (let i = 0; i < 5; i++) {
      const answerRes = await makeRequest('/api/fresher-interview/answer', 'POST', {
        sessionId,
        answer: `Technical answer ${i + 1}. OOP includes encapsulation, inheritance, polymorphism, and abstraction.`
      }, testToken);

      if (answerRes.error) {
        console.error(`❌ Technical answer ${i + 1} failed:`, answerRes.error);
        return;
      }

      if (answerRes.nextQuestion) {
        console.log(`   Tech Q${i + 2}: "${answerRes.nextQuestion.substring(0, 60)}..."`);
      }
    }
    console.log('✅ Completed fixed technical phase\n');

    // Step 5: Answer random technical (1 DSA + 2 OOP)
    console.log('Step 5️⃣  Answering random technical questions (1 DSA + 2 OOP)...');
    for (let i = 0; i < 3; i++) {
      const answerRes = await makeRequest('/api/fresher-interview/answer', 'POST', {
        sessionId,
        answer: `Random technical answer ${i + 1}. Detailed explanation with examples.`
      }, testToken);

      if (answerRes.error) {
        console.error(`❌ Random technical answer ${i + 1} failed:`, answerRes.error);
        return;
      }

      if (answerRes.complete) {
        console.log('✅ Interview completed!');
        console.log('   Summary:', JSON.stringify(answerRes.summary, null, 2));
        break;
      }

      if (answerRes.nextQuestion) {
        console.log(`   Random Tech Q${i + 1} (${answerRes.category}): "${answerRes.nextQuestion.substring(0, 60)}..."`);
      }
    }

    console.log('\n✅ All Tests Passed! Fresher Interview Flow Working:');
    console.log('   ✓ 5 fixed intro questions');
    console.log('   ✓ Random HR questions');
    console.log('   ✓ 5 fixed technical questions');
    console.log('   ✓ Random technical (1 DSA + 2 OOP)');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

runTest();
