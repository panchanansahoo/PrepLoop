import { describe, it, expect } from 'vitest';
import aiService from '../../services/aiService.js';

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'right'];

function detectFillerWords(words: Array<{ word: string }>) {
  const counts: Record<string, number> = {};
  let total = 0;
  const wordTexts = words.map((w) => String(w.word || '').toLowerCase());

  for (let i = 0; i < wordTexts.length; i++) {
    if (i < wordTexts.length - 1) {
      const phrase = `${wordTexts[i]} ${wordTexts[i + 1]}`;
      if (FILLER_WORDS.includes(phrase)) {
        counts[phrase] = (counts[phrase] || 0) + 1;
        total++;
        i++;
        continue;
      }
    }
    if (FILLER_WORDS.includes(wordTexts[i])) {
      counts[wordTexts[i]] = (counts[wordTexts[i]] || 0) + 1;
      total++;
    }
  }

  return { total, counts };
}

describe('Voice Interview Intelligence & Speech Diagnostics', () => {
  it('accurately counts single and multi-word speech filler tokens', () => {
    const words = [
      { word: 'um' },
      { word: 'I' },
      { word: 'like' },
      { word: 'this' },
      { word: 'you' },
      { word: 'know' },
    ];

    const result = detectFillerWords(words);
    expect(result.total).toBe(3);
    expect(result.counts.um).toBe(1);
    expect(result.counts.like).toBe(1);
    expect(result.counts['you know']).toBe(1);
  });

  it('evaluates answer quality metrics and generates scoring metadata', async () => {
    const result = await aiService.analyzeAnswerQuality(
      'I improved the API latency from 350ms to 120ms by adding indexing and caching.',
      'Tell me about a project impact.'
    );

    expect(result).toBeDefined();
    expect(typeof result.clarityScore).toBe('number');
    expect(typeof result.specificityScore).toBe('number');
    expect(typeof result.needsFollowUp).toBe('boolean');
    expect(typeof result.followUpQuestion).toBe('string');
  });
});

