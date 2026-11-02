import assert from 'assert';
import {
  PACING_MODES,
  getModeConfig,
  detectTerminalFiller,
  logInterviewTelemetry,
} from '../frontend/src/pages/aiInterviewTiming.js';

console.log('--- Testing Interview Timing Logic ---');

// Test 1: Pacing mode configurations
const relaxed = getModeConfig('relaxed');
assert.strictEqual(relaxed.nudgeMs, 20000, 'Relaxed nudge must be 20s');
assert.strictEqual(relaxed.checkInMs, 40000, 'Relaxed check-in must be 40s');
assert.strictEqual(relaxed.autoAdvanceMs, 60000, 'Relaxed auto-advance must be 60s');
assert.strictEqual(relaxed.postSpeechSubmitMs, 5000, 'Relaxed post-speech submit must be 5s');
assert.strictEqual(relaxed.fillerExtensionMs, 25000, 'Relaxed filler extension must be 25s');
assert.strictEqual(relaxed.maxNeedAMoment, 3, 'Relaxed max need a moment must be 3');
console.log('✓ Relaxed mode parameters verified.');

const realistic = getModeConfig('realistic');
assert.strictEqual(realistic.nudgeMs, 12000, 'Realistic nudge must be 12s');
assert.strictEqual(realistic.checkInMs, 25000, 'Realistic check-in must be 25s');
assert.strictEqual(realistic.autoAdvanceMs, 40000, 'Realistic auto-advance must be 40s');
assert.strictEqual(realistic.postSpeechSubmitMs, 3500, 'Realistic post-speech submit must be 3.5s');
assert.strictEqual(realistic.fillerExtensionMs, 20000, 'Realistic filler extension must be 20s');
assert.strictEqual(realistic.maxNeedAMoment, 2, 'Realistic max need a moment must be 2');
console.log('✓ Realistic mode parameters verified.');

// Test 2: Terminal filler phrase detection
assert.strictEqual(detectTerminalFiller('let me think'), true, 'Should detect "let me think"');
assert.strictEqual(detectTerminalFiller('Hmm, give me a second.'), true, 'Should detect "give me a second." with punctuation');
assert.strictEqual(detectTerminalFiller('That is a good question, one moment'), true, 'Should detect "one moment"');
assert.strictEqual(detectTerminalFiller('Hold on'), true, 'Should detect "Hold on" case-insensitively');

// Negative tests for terminal filler
assert.strictEqual(detectTerminalFiller('I would use second normal form here'), false, 'Should NOT trigger on "second" in middle');
assert.strictEqual(detectTerminalFiller('The second problem with this approach is latency'), false, 'Should NOT trigger on "second" in real answer');
assert.strictEqual(detectTerminalFiller('We can hold on to the pointer until the loop finishes'), false, 'Should NOT trigger on "hold on" in middle of explanation');

// Word count boundary test: > 15 words should be false
const longSentenceWithFillerAtEnd = 'In my previous project at Google we encountered a major bottleneck in our Redis cache cluster so let me think';
assert.strictEqual(detectTerminalFiller(longSentenceWithFillerAtEnd), false, 'Should NOT trigger if transcript exceeds 15 words');
console.log('✓ Terminal filler detection accurately ignores keywords in real answers.');

// Test 3: Telemetry logger safety
assert.doesNotThrow(() => {
  logInterviewTelemetry('test_event', { sample: 123 });
}, 'Telemetry logger must execute without errors');
console.log('✓ Telemetry logger executes safely.');

console.log('\nAll Timing and Filler Logic Tests Passed Successfully! (3/3)');

