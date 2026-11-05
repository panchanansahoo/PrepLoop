import { describe, it, expect, beforeEach } from 'vitest';
import { recordTurnScore, scoreDistributionStats } from '../../routes/company-interview/interaction.js';
import { clampToTwoSentences } from '../../routes/company-interview/helpers.js';
import { getTtsCacheStats } from '../../services/voiceService.js';

describe('Fast Reply, Turn Scoring & Score Calibration', () => {
  describe('Score Calibration & Distribution Tracker', () => {
    it('initializes and records scores across distinct calibration buckets', () => {
      // Record a wide spread of candidate scores
      recordTurnScore(45); // <50
      recordTurnScore(60); // 50-64
      recordTurnScore(72); // 65-79
      recordTurnScore(85); // 80-89
      recordTurnScore(95); // >=90

      expect(scoreDistributionStats.totalScores).toBeGreaterThanOrEqual(5);
      expect(scoreDistributionStats.buckets['<50']).toBeGreaterThanOrEqual(1);
      expect(scoreDistributionStats.buckets['50-64']).toBeGreaterThanOrEqual(1);
      expect(scoreDistributionStats.buckets['65-79']).toBeGreaterThanOrEqual(1);
      expect(scoreDistributionStats.buckets['80-89']).toBeGreaterThanOrEqual(1);
      expect(scoreDistributionStats.buckets['>=90']).toBeGreaterThanOrEqual(1);

      // Verify scores are not artificially clustered around 70
      expect(scoreDistributionStats.min).toBeLessThanOrEqual(45);
      expect(scoreDistributionStats.max).toBeGreaterThanOrEqual(95);
    });

    it('ignores non-numeric or NaN scores gracefully', () => {
      const countBefore = scoreDistributionStats.totalScores;
      recordTurnScore(NaN);
      recordTurnScore('invalid' as any);
      recordTurnScore(undefined as any);
      expect(scoreDistributionStats.totalScores).toBe(countBefore);
    });
  });

  describe('Byte-Budget LRU TTS Cache Monitoring', () => {
    it('exposes cache statistics with byte count and capacity boundaries', () => {
      const stats = getTtsCacheStats();
      expect(stats).toHaveProperty('itemCount');
      expect(stats).toHaveProperty('currentBytes');
      expect(stats).toHaveProperty('maxBytes');
      expect(stats).toHaveProperty('maxItems');
      expect(stats.maxBytes).toBe(30 * 1024 * 1024); // 30 MB
      expect(stats.maxItems).toBe(150);
      expect(stats.currentBytes).toBeGreaterThanOrEqual(0);
      expect(stats.itemCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Spoken Sentence Clamping (clampToTwoSentences)', () => {
    it('leaves responses of 1 or 2 sentences untouched', () => {
      const one = 'That sounds like a solid design.';
      expect(clampToTwoSentences(one)).toBe(one);

      const two = 'That makes sense. How would you handle database replication lag?';
      expect(clampToTwoSentences(two)).toBe(two);
    });

    it('preserves the question sentence in 3-sentence responses and drops early preamble', () => {
      const three = "That's a solid strategy. Handling distributed consensus introduces network latency. How would you avoid split-brain scenarios?";
      const clamped = clampToTwoSentences(three);
      expect(clamped).toContain('How would you avoid split-brain scenarios?');
      expect(clamped.endsWith('?')).toBe(true);
      const sentences = clamped.match(/[^.!?]+[.!?]+/g) || [];
      expect(sentences.length).toBeLessThanOrEqual(2);
    });

    it('preserves the final question in 4-sentence responses', () => {
      const four = "Understood. Redis caching can speed up lookups. But cache invalidation is tricky. What eviction policy would you configure?";
      const clamped = clampToTwoSentences(four);
      expect(clamped).toContain('What eviction policy would you configure?');
      expect(clamped.endsWith('?')).toBe(true);
      const sentences = clamped.match(/[^.!?]+[.!?]+/g) || [];
      expect(sentences.length).toBeLessThanOrEqual(2);
    });

    it('clamps to first 2 sentences if no question mark exists', () => {
      const statement = "First point here. Second point here. Third point here. Fourth point here.";
      const clamped = clampToTwoSentences(statement);
      expect(clamped).toBe('First point here. Second point here.');
    });
  });
});

