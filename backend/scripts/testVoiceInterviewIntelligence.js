import assert from 'assert';
import voiceService, { detectFillerWords } from '../services/voiceService.js';
import aiService from '../services/aiService.js';

function testDetectFillerWords() {
  const words = [
    { word: 'um' },
    { word: 'I' },
    { word: 'like' },
    { word: 'this' },
    { word: 'you' },
    { word: 'know' },
  ];

  const result = detectFillerWords(words);
  assert.strictEqual(result.total, 3, 'should count single and multi-word fillers');
  assert.strictEqual(result.counts.um, 1, 'should count um');
  assert.strictEqual(result.counts.like, 1, 'should count like');
  assert.strictEqual(result.counts['you know'], 1, 'should count phrase fillers');
}

async function testAnalyzeAnswerQualityFallback() {
  const result = await aiService.analyzeAnswerQuality(
    'I improved the API latency from 350ms to 120ms by adding indexing and caching.',
    'Tell me about a project impact.'
  );

  assert.ok(result, 'should return analysis object');
  assert.ok(Number.isFinite(result.clarityScore), 'clarityScore should be numeric');
  assert.ok(Number.isFinite(result.specificityScore), 'specificityScore should be numeric');
  assert.ok(typeof result.needsFollowUp === 'boolean', 'needsFollowUp should be boolean');
  assert.ok(typeof result.followUpQuestion === 'string', 'followUpQuestion should be string');
}

async function testVoiceServiceExposesStreamMethod() {
  assert.ok(typeof voiceService.streamingTTS === 'function', 'streamingTTS should be exposed');
  const unavailable = await voiceService.streamingTTS('', 'friendly');
  assert.ok(unavailable.error, 'empty text should return error payload');
}

async function run() {
  testDetectFillerWords();
  await testAnalyzeAnswerQualityFallback();
  await testVoiceServiceExposesStreamMethod();
  console.log('PASS testVoiceInterviewIntelligence');
}

run().catch((error) => {
  console.error('FAIL testVoiceInterviewIntelligence');
  console.error(error);
  process.exit(1);
});
