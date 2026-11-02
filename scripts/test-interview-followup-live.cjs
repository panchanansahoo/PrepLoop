const http = require('http');

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Running AI Interview Follow-up & Repetition Tests...\n');

  // Test 1: Start Interview
  console.log('Test 1: Starting technical interview...');
  const startRes = await postJson('http://localhost:5000/api/company-interview/start', {
    company: 'Google',
    role: 'Full Stack Engineer',
    stage: 'Technical',
    difficulty: 'medium',
    totalQuestions: 5,
  });

  if (startRes.status !== 200 || !startRes.data?.question) {
    console.error('❌ Failed to start interview:', startRes);
    process.exit(1);
  }
  const q1 = startRes.data.question;
  console.log(`✅ Q1: "${q1.slice(0, 100)}..."\n`);

  // Test 2: Follow-up Turn 1
  console.log('Test 2: Submitting candidate answer for Turn 1...');
  const followUp1 = await postJson('http://localhost:5000/api/company-interview/follow-up', {
    previousQuestion: q1,
    userAnswer: 'I architected a distributed messaging system using Apache Kafka and Redis caching to handle high-throughput event processing with under 10ms latency.',
    questionNumber: 2,
    totalQuestions: 5,
    company: 'Google',
    role: 'Full Stack Engineer',
    stage: 'Technical',
    difficulty: 'medium',
    conversationHistory: [
      { role: 'interviewer', content: q1 },
    ],
  });

  if (followUp1.status !== 200 || !followUp1.data?.followUpQuestion) {
    console.error('❌ Failed follow-up turn 1:', followUp1);
    process.exit(1);
  }
  const q2 = followUp1.data.followUpQuestion;
  console.log(`✅ Q2 Follow-up: "${q2.slice(0, 100)}..."`);
  console.log(`   Feedback: "${followUp1.data.feedback?.slice(0, 80)}..."`);
  console.log(`   Score: ${followUp1.data.score}\n`);

  // Test 3: Follow-up Turn 2
  console.log('Test 3: Submitting candidate answer for Turn 2...');
  const followUp2 = await postJson('http://localhost:5000/api/company-interview/follow-up', {
    previousQuestion: q2,
    userAnswer: 'To ensure at-least-once delivery, we configured Kafka producer acks=all and used idempotent producers with partition keys based on user IDs.',
    questionNumber: 3,
    totalQuestions: 5,
    company: 'Google',
    role: 'Full Stack Engineer',
    stage: 'Technical',
    difficulty: 'medium',
    conversationHistory: [
      { role: 'interviewer', content: q1 },
      { role: 'candidate', content: 'I architected a distributed messaging system...' },
      { role: 'interviewer', content: q2 },
    ],
  });

  if (followUp2.status !== 200 || !followUp2.data?.followUpQuestion) {
    console.error('❌ Failed follow-up turn 2:', followUp2);
    process.exit(1);
  }
  const q3 = followUp2.data.followUpQuestion;
  console.log(`✅ Q3 Follow-up: "${q3.slice(0, 100)}..."`);
  console.log(`   Score: ${followUp2.data.score}\n`);

  // Test 4: Follow-up Turn 3
  console.log('Test 4: Submitting candidate answer for Turn 3...');
  const followUp3 = await postJson('http://localhost:5000/api/company-interview/follow-up', {
    previousQuestion: q3,
    userAnswer: 'We handled backpressure on the consumer side with a bounded queue and exponential backoff dead-letter topic routing.',
    questionNumber: 4,
    totalQuestions: 5,
    company: 'Google',
    role: 'Full Stack Engineer',
    stage: 'Technical',
    difficulty: 'medium',
    conversationHistory: [
      { role: 'interviewer', content: q1 },
      { role: 'candidate', content: 'I architected a distributed messaging system...' },
      { role: 'interviewer', content: q2 },
      { role: 'candidate', content: 'To ensure at-least-once delivery...' },
      { role: 'interviewer', content: q3 },
    ],
  });

  if (followUp3.status !== 200 || !followUp3.data?.followUpQuestion) {
    console.error('❌ Failed follow-up turn 3:', followUp3);
    process.exit(1);
  }
  const q4 = followUp3.data.followUpQuestion;
  console.log(`✅ Q4 Follow-up: "${q4.slice(0, 100)}..."`);
  console.log(`   Score: ${followUp3.data.score}\n`);

  // Test 5: Verify all questions are unique
  console.log('Test 5: Verifying question uniqueness...');
  const questions = [q1, q2, q3, q4];
  const uniqueQuestions = new Set(questions);
  if (uniqueQuestions.size !== questions.length) {
    console.error('❌ Repeated question detected!');
    questions.forEach((q, i) => console.log(`Q${i+1}: ${q}`));
    process.exit(1);
  }
  console.log('✅ ALL QUESTIONS ARE DISTINCT AND UNIQUE! No repetition!\n');

  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('💥 Test execution error:', err);
  process.exit(1);
});
