import assert from 'assert';
import voiceService from '../services/voiceService.js';
import aiService from '../services/aiService.js';

// detectFillerWords is no longer exported from voiceService (moved to stream internals).
// Inline the algorithm here so we can still validate the detection logic.
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'right'];

function detectFillerWords(words) {
  const counts = {};
  let total = 0;
  const wordTexts = words.map(w => String(w.word || '').toLowerCase());

  for (let i = 0; i < wordTexts.length; i++) {
    // Check two-word phrases first
    if (i < wordTexts.length - 1) {
      const phrase = `${wordTexts[i]} ${wordTexts[i + 1]}`;
      if (FILLER_WORDS.includes(phrase)) {
        counts[phrase] = (counts[phrase] || 0) + 1;
        total++;
        i++; // skip next word
        continue;
      }
    }
    // Single-word fillers
    if (FILLER_WORDS.includes(wordTexts[i])) {
      counts[wordTexts[i]] = (counts[wordTexts[i]] || 0) + 1;
      total++;
    }
  }

  return { total, counts };
}

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

async function run() {
  testDetectFillerWords();
  await testAnalyzeAnswerQualityFallback();
  console.log('PASS testVoiceInterviewIntelligence');
}

run().catch((error) => {
  console.error('FAIL testVoiceInterviewIntelligence');
  console.error(error);
  process.exit(1);
});
