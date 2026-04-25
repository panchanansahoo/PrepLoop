/**
 * Tests for the Better AI Interview intelligence features:
 * - Problem bank loading & dedup
 * - Clarification detection
 * - Progressive hint system
 * - Score cue builder
 * - Turn summary generation
 * - Topic extraction
 * - Interview benchmarks
 */
import assert from 'assert';

// ── Problem Bank Tests ──────────────────────────────────────────────────
async function testProblemBank() {
  const { readFileSync } = await import('fs');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const bankPath = join(__dirname, '..', 'data', 'interviewProblemBank.json');

  const bank = JSON.parse(readFileSync(bankPath, 'utf-8'));

  // Verify all 4 types exist
  assert.ok(bank.dsa, 'DSA section exists');
  assert.ok(bank.system_design, 'System Design section exists');
  assert.ok(bank.behavioral, 'Behavioral section exists');
  assert.ok(bank.hr, 'HR section exists');

  // Verify each type has 3 difficulty tiers
  for (const type of ['dsa', 'system_design', 'behavioral', 'hr']) {
    assert.ok(bank[type].easy, `${type} has easy tier`);
    assert.ok(bank[type].medium, `${type} has medium tier`);
    assert.ok(bank[type].hard, `${type} has hard tier`);

    // Verify minimum pool size (at least 6 per tier)
    for (const diff of ['easy', 'medium', 'hard']) {
      assert.ok(bank[type][diff].length >= 6,
        `${type}.${diff} has ${bank[type][diff].length} problems (min 6)`);
    }
  }

  // Verify each problem has required fields
  let totalProblems = 0;
  for (const type of Object.keys(bank)) {
    for (const diff of Object.keys(bank[type])) {
      for (const problem of bank[type][diff]) {
        assert.ok(problem.id, `Problem has id: ${problem.id}`);
        assert.ok(problem.statement, `Problem ${problem.id} has statement`);
        assert.ok(problem.requirements, `Problem ${problem.id} has requirements`);
        assert.ok(Array.isArray(problem.tags), `Problem ${problem.id} has tags array`);
        totalProblems++;
      }
    }
  }

  // Verify no duplicate IDs
  const allIds = [];
  for (const type of Object.keys(bank)) {
    for (const diff of Object.keys(bank[type])) {
      for (const problem of bank[type][diff]) {
        assert.ok(!allIds.includes(problem.id), `No duplicate ID: ${problem.id}`);
        allIds.push(problem.id);
      }
    }
  }

  console.log(`✅ Problem bank: ${totalProblems} problems, ${allIds.length} unique IDs, all valid`);
}

// ── Clarification Detection Tests ───────────────────────────────────────
async function testClarificationDetection() {
  // Dynamic import to access the static method
  const { InterviewSimulatorService } = await import('../services/aiService.js');

  // Should detect repeat requests
  const repeatCases = [
    'what?', 'huh?', 'sorry?', 'can you repeat that?',
    "didn't catch that", "didn't hear you", 'pardon',
    'come again', 'repeat', 'say that again',
  ];
  for (const input of repeatCases) {
    const result = InterviewSimulatorService._detectClarificationRequest(input);
    assert.ok(result.isClarification, `Should detect repeat: "${input}"`);
    assert.strictEqual(result.type, 'repeat', `Type should be "repeat" for: "${input}"`);
  }

  // Should detect clarify requests
  const clarifyCases = [
    'can you clarify the question?',
    'what do you mean by that?',
    'could you explain more?',
    "i don't understand",
    'can you rephrase?',
    'not sure i follow',
  ];
  for (const input of clarifyCases) {
    const result = InterviewSimulatorService._detectClarificationRequest(input);
    assert.ok(result.isClarification, `Should detect clarify: "${input}"`);
    assert.strictEqual(result.type, 'clarify', `Type should be "clarify" for: "${input}"`);
  }

  // Should NOT detect real answers
  const realAnswers = [
    'I would use a hash map to solve this problem because it gives O(1) lookup time',
    'The time complexity would be O(n log n) because we need to sort first',
    'In my previous job, I led a team of five engineers working on the payment system',
    'I would design the system with three main components: an API gateway, a message queue, and a database',
  ];
  for (const input of realAnswers) {
    const result = InterviewSimulatorService._detectClarificationRequest(input);
    assert.ok(!result.isClarification, `Should NOT detect real answer: "${input.slice(0, 40)}..."`);
  }

  // Edge: empty and null
  assert.ok(!InterviewSimulatorService._detectClarificationRequest('').isClarification);
  assert.ok(!InterviewSimulatorService._detectClarificationRequest(null).isClarification);

  console.log('✅ Clarification detection: all cases pass');
}

// ── Progressive Hint System Tests ───────────────────────────────────────
async function testProgressiveHints() {
  const { InterviewSimulatorService } = await import('../services/aiService.js');

  // Test all 4 types × 3 tiers
  for (const type of ['dsa', 'system_design', 'behavioral', 'hr']) {
    for (let tier = 1; tier <= 3; tier++) {
      const hint = InterviewSimulatorService._buildProgressiveHint(type, tier);
      assert.ok(hint.hintMessage, `${type} tier ${tier} has hint message`);
      assert.strictEqual(hint.hintTier, tier, `${type} tier ${tier} has correct tier`);
      assert.ok(hint.isHint, `${type} tier ${tier} isHint flag`);
    }
  }

  // Tier clamping: stuck count 0 → tier 1, stuck count 5 → tier 3
  const low = InterviewSimulatorService._buildProgressiveHint('dsa', 0);
  assert.strictEqual(low.hintTier, 1, 'stuckCount 0 → tier 1');

  const high = InterviewSimulatorService._buildProgressiveHint('dsa', 5);
  assert.strictEqual(high.hintTier, 3, 'stuckCount 5 → tier 3 (capped)');

  // Unknown type falls back to DSA hints
  const unknown = InterviewSimulatorService._buildProgressiveHint('unknown_type', 1);
  assert.ok(unknown.hintMessage, 'Unknown type still produces hints');

  console.log('✅ Progressive hint system: all tiers and types pass');
}

// ── Score Cue Tests ─────────────────────────────────────────────────────
async function testScoreCue() {
  const { InterviewSimulatorService } = await import('../services/aiService.js');

  // Strong answer
  const strong = InterviewSimulatorService._buildScoreCue({ overall: 9 }, 'dsa');
  assert.strictEqual(strong.level, 'strong');
  assert.strictEqual(strong.color, 'green');

  // Good answer — type-specific text
  const goodDsa = InterviewSimulatorService._buildScoreCue({ overall: 7 }, 'dsa');
  assert.strictEqual(goodDsa.level, 'good');
  assert.ok(goodDsa.text.includes('complexity'), 'DSA cue mentions complexity');

  const goodBeh = InterviewSimulatorService._buildScoreCue({ overall: 7 }, 'behavioral');
  assert.strictEqual(goodBeh.level, 'good');
  assert.ok(goodBeh.text.includes('impact'), 'Behavioral cue mentions impact');

  // Fair answer
  const fair = InterviewSimulatorService._buildScoreCue({ overall: 5 }, 'dsa');
  assert.strictEqual(fair.level, 'fair');

  // Weak answer
  const weak = InterviewSimulatorService._buildScoreCue({ overall: 2 }, 'dsa');
  assert.strictEqual(weak.level, 'weak');

  // Null handling
  assert.strictEqual(InterviewSimulatorService._buildScoreCue(null, 'dsa'), null);
  assert.strictEqual(InterviewSimulatorService._buildScoreCue({}, 'dsa'), null);

  console.log('✅ Score cue builder: all levels and types pass');
}

// ── Turn Summary Tests ──────────────────────────────────────────────────
async function testTurnSummary() {
  const { InterviewSimulatorService } = await import('../services/aiService.js');

  // Behavioral with STAR elements
  const bhSummary = InterviewSimulatorService._generateTurnSummary(
    'In our situation at the startup, I decided to implement a new caching layer which resulted in a 40% latency reduction',
    'behavioral',
    {},
  );
  assert.ok(bhSummary.includes('described a situation'), 'Detects situation');
  assert.ok(bhSummary.includes('explained personal actions'), 'Detects personal actions');
  assert.ok(bhSummary.includes('shared measurable outcome'), 'Detects outcome');

  // DSA with complexity
  const dsaSummary = InterviewSimulatorService._generateTurnSummary(
    'I would use a hash map for O(1) lookups and handle the edge case of empty arrays',
    'dsa',
    { hasComplexity: true, hasEdgeCases: true },
  );
  assert.ok(dsaSummary.includes('analyzed complexity'), 'DSA detects complexity');
  assert.ok(dsaSummary.includes('covered edge cases'), 'DSA detects edge cases');

  // Very short response
  const shortSummary = InterviewSimulatorService._generateTurnSummary('um', 'dsa', {});
  assert.ok(shortSummary.includes('brief'), 'Short response detected');

  console.log('✅ Turn summary generation: all cases pass');
}

// ── Topic Extraction Tests ──────────────────────────────────────────────
async function testTopicExtraction() {
  const { InterviewSimulatorService } = await import('../services/aiService.js');

  const cases = [
    ['What is the time complexity of your solution?', 'complexity analysis'],
    ['Have you considered edge cases like empty arrays?', 'edge cases'],
    ['What are the trade-offs between SQL and NoSQL here?', 'trade-offs'],
    ['How would you scale this to handle 10M users?', 'scalability'],
    ['Can you walk me through the result of that situation?', 'STAR structure'],
    ['Why did you choose that approach? Walk me through your reasoning', 'reasoning depth'],
    ['How would you test this implementation?', 'testing strategy'],
    ['Can you optimize that further?', 'optimization'],
  ];

  for (const [message, expectedTopic] of cases) {
    const topic = InterviewSimulatorService._extractPrimaryTopic(message, 'dsa');
    assert.strictEqual(topic, expectedTopic, `"${message.slice(0, 30)}..." → "${expectedTopic}"`);
  }

  // Null cases
  assert.strictEqual(InterviewSimulatorService._extractPrimaryTopic('', 'dsa'), null);
  assert.strictEqual(InterviewSimulatorService._extractPrimaryTopic(null, 'dsa'), null);
  assert.strictEqual(InterviewSimulatorService._extractPrimaryTopic('hello', 'dsa'), null);

  console.log('✅ Topic extraction: all patterns match correctly');
}

// ── Benchmark Tests ─────────────────────────────────────────────────────
async function testBenchmarks() {
  const { getBenchmarkTier, generatePerQuestionBreakdown, computeTimingAnalysis } = await import('../utils/interviewBenchmarks.js');

  // Tier thresholds — DSA
  assert.strictEqual(getBenchmarkTier(90, 'dsa').label, 'Strong Hire');
  assert.strictEqual(getBenchmarkTier(75, 'dsa').label, 'Lean Hire');
  assert.strictEqual(getBenchmarkTier(60, 'dsa').label, 'Borderline');
  assert.strictEqual(getBenchmarkTier(30, 'dsa').label, 'Needs Practice');

  // Type-specific thresholds — behavioral is more lenient
  assert.strictEqual(getBenchmarkTier(70, 'behavioral').label, 'Lean Hire');
  assert.strictEqual(getBenchmarkTier(70, 'dsa').label, 'Lean Hire');

  // HR thresholds
  assert.strictEqual(getBenchmarkTier(80, 'hr').label, 'Strong Hire');
  assert.strictEqual(getBenchmarkTier(50, 'hr').label, 'Borderline');

  // System design alias
  assert.strictEqual(getBenchmarkTier(85, 'system-design').label, 'Strong Hire');

  // Edge: unknown type falls back to DSA
  assert.strictEqual(getBenchmarkTier(90, 'unknown').label, 'Strong Hire');

  // Per-question breakdown with transcript
  const transcript = [
    { role: 'interviewer', text: 'Design an LRU cache', timestamp: '2024-01-01T00:00:00Z' },
    { role: 'candidate', text: 'I would use a hash map and doubly linked list', timestamp: '2024-01-01T00:00:30Z' },
    { role: 'interviewer', text: 'What about the time complexity?', timestamp: '2024-01-01T00:01:00Z' },
    { role: 'candidate', text: 'Both get and put are O(1)', timestamp: '2024-01-01T00:01:45Z' },
  ];
  const breakdown = generatePerQuestionBreakdown(transcript, {});
  assert.strictEqual(breakdown.length, 2, 'Two Q&A pairs found');
  assert.strictEqual(breakdown[0].questionNumber, 1);
  assert.ok(breakdown[0].question.includes('LRU'));

  // Timing analysis
  const timing = computeTimingAnalysis(transcript);
  assert.strictEqual(timing.totalTurns, 2);
  assert.ok(timing.avgResponseSeconds >= 30, 'Avg response time calculated');

  // Empty transcript
  const emptyTiming = computeTimingAnalysis([]);
  assert.strictEqual(emptyTiming.totalTurns, 0);
  assert.strictEqual(emptyTiming.avgResponseSeconds, 0);

  console.log('✅ Interview benchmarks: all tier, breakdown, and timing tests pass');
}

// ── Run all tests ───────────────────────────────────────────────────────
async function main() {
  console.log('\n🧪 Running Better AI Interview Intelligence Tests...\n');

  await testProblemBank();
  await testClarificationDetection();
  await testProgressiveHints();
  await testScoreCue();
  await testTurnSummary();
  await testTopicExtraction();
  await testBenchmarks();

  console.log('\n🎉 All intelligence tests passed!\n');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
