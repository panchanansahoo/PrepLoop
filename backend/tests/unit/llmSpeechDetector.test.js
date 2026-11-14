import { describe, it, expect } from 'vitest';
import {
  detectCannedPhrases,
  analyzeBurstinessAndPerplexity,
  detectTeleprompterCadence,
  detectAIGeneratedSpeech,
} from '../../utils/llmSpeechDetector.js';

describe('llmSpeechDetector (Pillar 3 AI-Generated Speech & Teleprompter Detection)', () => {
  describe('detectCannedPhrases', () => {
    it('detects stereotypical robotic LLM opening phrases', () => {
      const text = 'Certainly! In order to optimize database performance, we must implement caching.';
      const result = detectCannedPhrases(text);
      expect(result.detected).toBe(true);
      expect(result.matches.some((m) => m.includes('Certainly! In order to'))).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.5);
    });

    it('detects LLM cliché vocabulary and disclaimers', () => {
      const text = 'As a large language model, delving into the multifaceted architecture is a testament to scalability.';
      const result = detectCannedPhrases(text);
      expect(result.detected).toBe(true);
      expect(result.categoryBreakdown.ai_disclaimer).toBeGreaterThan(0);
      expect(result.categoryBreakdown.cliche_vocabulary).toBeGreaterThan(0);
    });

    it('returns clean score for genuine candidate responses', () => {
      const text = 'In my previous internship at Acme, we ran into race conditions with Postgres transactions.';
      const result = detectCannedPhrases(text);
      expect(result.detected).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('analyzeBurstinessAndPerplexity', () => {
    it('flags unnaturally uniform sentence cadence (robotic AI generation)', () => {
      // 4 sentences each having exactly 14 words
      const text = `
        We implemented a distributed redis cache to reduce unnecessary query latency across our services.
        The backend microservices communicate via asynchronous kafka message brokers for high event throughput.
        Database replicas handle heavy read queries while primary nodes process critical transactional writes safely.
        Monitoring systems track operational health metrics and trigger alerts when error thresholds are exceeded.
      `;
      const result = analyzeBurstinessAndPerplexity(text);
      expect(result.isUnnaturallyUniform).toBe(true);
      expect(result.burstinessCV).toBeLessThan(0.24);
      expect(result.score).toBeGreaterThanOrEqual(0.4);
    });

    it('recognizes natural human burstiness (mixed sentence lengths and fragments)', () => {
      const text = `
        Yeah, so basically we had latency issues.
        Our queries were taking up to two seconds because someone forgot to add a composite index on user ID and timestamp, which caused full table scans.
        So I fixed it.
      `;
      const result = analyzeBurstinessAndPerplexity(text);
      expect(result.isUnnaturallyUniform).toBe(false);
      expect(result.burstinessCV).toBeGreaterThan(0.4);
    });
  });

  describe('detectTeleprompterCadence', () => {
    it('flags long sterile text read without conversational disfluencies', () => {
      const sterileText = `
        To solve the problem of high concurrent traffic, we architected a multi-region deployment.
        Traffic is initially routed through Cloudflare CDN for edge caching and DDoS mitigation.
        Requests then hit the application gateway which load balances traffic across containerized Node.js clusters.
        Data persistence is handled by DynamoDB with provisioned capacity autoscaling.
      `;
      const result = detectTeleprompterCadence(sterileText, {
        audioMetadata: {
          durationSeconds: 22, // ~160 WPM
          pauseDurations: [0.3, 0.32, 0.29, 0.31], // perfectly uniform breath pauses
        },
      });

      expect(result.detected).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.5);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('identifies natural conversational delivery with disfluencies', () => {
      const naturalText = `
        Um, so when we designed the API, like, we had to choose between REST and GraphQL.
        Honestly, you know, REST was just simpler for the team because we didn't need the complex schema stitching.
        So, uh, we stuck with Express and OpenAPI.
      `;
      const result = detectTeleprompterCadence(naturalText);
      expect(result.detected).toBe(false);
      expect(result.metrics.disfluencyCount).toBeGreaterThan(2);
    });
  });

  describe('detectAIGeneratedSpeech Aggregation', () => {
    it('detects blatant ChatGPT / LLM answers with high risk level', () => {
      const chatGptAnswer = `
        Certainly! In order to effectively design a scalable distributed system, first and foremost, it is important to understand the multifaceted requirements.
        Firstly, we must establish a resilient caching strategy using Redis.
        Secondly, it is worth noting that asynchronous messaging with Kafka plays a pivotal role in decoupling services.
        Thirdly, we should implement database sharding to distribute read and write throughput evenly across clusters.
        In conclusion, by doing so, we ensure high availability and sub-millisecond response times.
      `;

      const result = detectAIGeneratedSpeech(chatGptAnswer);
      expect(result.isAIGenerated).toBe(true);
      expect(result.flagged).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.65);
      expect(['high', 'critical']).toContain(result.riskLevel);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.summary).toContain('AI-generated');
    });

    it('passes human conversational technical answer as clean', () => {
      const humanAnswer = `
        Well, in our final year project, um, we built a collaborative code editor.
        At first, we tried WebSockets with basic locking, but users kept overwriting each other's code.
        Like, it was a mess. So I looked into operational transformation and CRDTs.
        We ended up using Yjs with WebRTC for peer-to-peer sync, which solved the conflict issue.
      `;

      const result = detectAIGeneratedSpeech(humanAnswer);
      expect(result.isAIGenerated).toBe(false);
      expect(result.flagged).toBe(false);
      expect(result.confidence).toBeLessThan(0.4);
      expect(result.riskLevel).toBe('clean');
    });

    it('handles empty or brief input gracefully without false alarms', () => {
      const emptyResult = detectAIGeneratedSpeech('');
      expect(emptyResult.isAIGenerated).toBe(false);
      expect(emptyResult.confidence).toBe(0);
      expect(emptyResult.riskLevel).toBe('clean');
    });
  });
});
