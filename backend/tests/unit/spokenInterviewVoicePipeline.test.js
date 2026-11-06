import { describe, it, expect } from 'vitest';
import {
  correctSttTechnicalTerms,
  stripFillersForLlm,
  respellForTts,
} from '../../utils/technicalPronunciation.js';
import {
  normalizeAnswerType,
  VALID_ANSWER_TYPES,
} from '../../services/llmRouter.js';
import {
  getThinkingDelayMs,
  isUnfinishedTurn,
  isFinishedTurn,
  getSemanticSilenceThreshold,
} from '../../../frontend/src/pages/aiInterviewTiming.js';
import pregeneratedReactions from '../../data/pregeneratedReactionLines.json';

describe('Spoken Interview Voice & Answer Handling Pipeline', () => {
  describe('Part A.1 & B.1: Technical Pronunciation and STT Correction Dictionary', () => {
    it('corrects common speech-to-text recognition errors for technical terms', () => {
      expect(correctSttTechnicalTerms('we cached session data in radius cluster')).toContain('Redis');
      expect(correctSttTechnicalTerms('we streamed events through apache cough car')).toContain('Apache Kafka');
      expect(correctSttTechnicalTerms('deployed on coobernetes cluster')).toContain('Kubernetes');
      expect(correctSttTechnicalTerms('communicating over gee rpc microservices')).toContain('gRPC');
      expect(correctSttTechnicalTerms('migrated from see sequel to no sequel')).toContain('SQL');
      expect(correctSttTechnicalTerms('migrated from see sequel to no sequel')).toContain('NoSQL');
      expect(correctSttTechnicalTerms('stored user records in post grass')).toContain('Postgres');
      expect(correctSttTechnicalTerms('trained a model with pie torch')).toContain('PyTorch');
      expect(correctSttTechnicalTerms('avoiding the n plus one query trap')).toContain('N+1');
    });

    it('strips conversational filler words for the LLM while keeping core meaning', () => {
      const raw = 'Um, uh, basically, we use a hash map to get constant time lookups.';
      const cleaned = stripFillersForLlm(raw);
      expect(cleaned).not.toMatch(/\bum\b/i);
      expect(cleaned).not.toMatch(/\buh\b/i);
      expect(cleaned).toContain('we use a hash map to get constant time lookups');
    });

    it('phonetically respells technical symbols and terms for human-sounding TTS', () => {
      expect(respellForTts('the lookup complexity is O(1)')).toContain('O of 1');
      expect(respellForTts('sorting takes O(n log n)')).toContain('O of n log n');
      expect(respellForTts('we expose gRPC APIs')).toContain('gee-RPC');
      expect(respellForTts('orchestrated by Kubernetes')).toContain('Koo-ber-net-ees');
      expect(respellForTts('Kafka event broker')).toContain('Kaff-ka');
      expect(respellForTts('Redis in-memory store')).toContain('Red-iss');
    });
  });

  describe('Part A.3: Answer Classification Matrix', () => {
    it('recognizes all 7 answer types in the fast-reply classification matrix', () => {
      expect(VALID_ANSWER_TYPES).toEqual([
        'strong_complete',
        'partial',
        'wrong',
        'dont_know',
        'off_topic',
        'clarification',
        'stuck_silence',
      ]);
    });

    it('normalizes answer types and handles blank/stuck silence gracefully', () => {
      expect(normalizeAnswerType('STRONG_COMPLETE')).toBe('strong_complete');
      expect(normalizeAnswerType('partial')).toBe('partial');
      expect(normalizeAnswerType('wrong')).toBe('wrong');
      expect(normalizeAnswerType('dont_know')).toBe('dont_know');
      expect(normalizeAnswerType('off_topic')).toBe('off_topic');
      expect(normalizeAnswerType('clarification')).toBe('clarification');
      expect(normalizeAnswerType('stuck_silence')).toBe('stuck_silence');
      expect(normalizeAnswerType('unknown', '')).toBe('stuck_silence');
      expect(normalizeAnswerType('unknown', 'I would use a priority queue here')).toBe('partial');
    });
  });

  describe('Part A.2 & B.3: Adaptive Silence & Reply Gap Timing', () => {
    it('bounds reply thinking gap strictly within 400ms - 900ms', () => {
      const shortDelay = getThinkingDelayMs('Short answer', { deterministic: true });
      expect(shortDelay).toBeGreaterThanOrEqual(400);
      expect(shortDelay).toBeLessThanOrEqual(900);

      const longDelay = getThinkingDelayMs('A very long and exhaustive answer detailing distributed consensus algorithms, Raft, Paxos, replication logs, and leader election mechanics.', { deterministic: true });
      expect(longDelay).toBeGreaterThanOrEqual(400);
      expect(longDelay).toBeLessThanOrEqual(900);
    });

    it('correctly detects unfinished candidate turns (trailing and, so, because, comma)', () => {
      expect(isUnfinishedTurn('we used a binary search tree and')).toBe(true);
      expect(isUnfinishedTurn('the latency dropped by twenty percent so')).toBe(true);
      expect(isUnfinishedTurn('we picked Postgres because')).toBe(true);
      expect(isUnfinishedTurn('first we sort the array,')).toBe(true);
      expect(isUnfinishedTurn('the time complexity is...')).toBe(true);
    });

    it('correctly detects finished candidate turns (that is it, complete clause with pause)', () => {
      expect(isFinishedTurn("That's it.")).toBe(true);
      expect(isFinishedTurn('and that concludes my answer.')).toBe(true);
      expect(isFinishedTurn('We can maintain a frequency map of elements to find duplicates in linear time.')).toBe(true);
    });

    it('bounds semantic silence thresholds strictly between 1500ms and 3600ms', () => {
      const finishedThreshold = getSemanticSilenceThreshold({ stage: 'Technical', text: "That's it." });
      expect(finishedThreshold).toBe(1500);

      const unfinishedThreshold = getSemanticSilenceThreshold({ stage: 'Technical', text: 'we use a hash map and' });
      expect(unfinishedThreshold).toBeGreaterThanOrEqual(2000);
      expect(unfinishedThreshold).toBeLessThanOrEqual(3600);

      const fillerThreshold = getSemanticSilenceThreshold({ stage: 'Technical', text: 'the algorithm is... umm' });
      expect(fillerThreshold).toBeGreaterThanOrEqual(2000);
      expect(fillerThreshold).toBeLessThanOrEqual(3600);
    });
  });

  describe('Part B.3 & B.free-tier: Pre-generated Reaction Clips', () => {
    it('contains 40 pregenerated reaction and backchannel lines', () => {
      expect(pregeneratedReactions.length).toBe(40);
      const types = new Set(pregeneratedReactions.map((r) => r.type));
      expect(types.has('strong_complete')).toBe(true);
      expect(types.has('partial')).toBe(true);
      expect(types.has('wrong')).toBe(true);
      expect(types.has('dont_know')).toBe(true);
      expect(types.has('off_topic')).toBe(true);
      expect(types.has('clarification')).toBe(true);
      expect(types.has('stuck_silence')).toBe(true);
      expect(types.has('backchannel')).toBe(true);
    });
  });
});

