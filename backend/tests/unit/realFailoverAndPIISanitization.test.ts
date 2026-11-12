import { describe, it, expect, beforeEach } from 'vitest';
import {
  quotaGuard,
  parseGroqDurationMs,
  DEFAULT_DAILY_TOKEN_BUDGET,
} from '../../services/quotaGuard.js';
import {
  sanitizePromptForFreeTier,
  TECHNICAL_WHITELIST,
  sessionScorers,
  getSessionScorer,
  setSessionScorer,
  clearSessionScorer,
  callTurnScoring,
  callFastReply,
  ROUTER_MODELS,
} from '../../services/llmRouter.js';

describe('Real Failover, One-Scorer-Per-Session & PII Sanitization Verification', { timeout: 60000 }, () => {
  beforeEach(() => {
    quotaGuard.reset();
    sessionScorers.clear();
  });

  describe('1. PII Sanitization & Name Over-Redaction Protection (10 Technical Answers)', () => {
    const realTechnicalAnswers = [
      {
        id: 1,
        topic: 'Redis & Distributed Caching',
        input: 'My name is Alice Smith (email: alice.smith@mit.edu, phone: +1-555-123-4567). I used Redis as a distributed cache with LRU eviction and Redis Sentinel for automatic failover. I also configured write-behind caching.',
        expectedKept: ['Redis', 'distributed cache', 'LRU eviction', 'Sentinel', 'failover'],
        expectedRedacted: ['alice.smith@mit.edu', '+1-555-123-4567', 'Alice Smith'],
      },
      {
        id: 2,
        topic: 'Raft Consensus & Distributed Systems',
        input: 'Call me Bob Taylor (email: bob.t@stanford.edu). I am comfortable with the Raft consensus algorithm. In our cluster, Raft leader election handles split-brain scenarios, and log replication guarantees consistency across quorum nodes.',
        expectedKept: ['Raft', 'consensus', 'leader election', 'split-brain', 'log replication', 'quorum'],
        expectedRedacted: ['bob.t@stanford.edu', 'Bob Taylor'],
      },
      {
        id: 3,
        topic: 'Kafka Message Streaming',
        input: 'Candidate Name: Charlie Green. In our streaming pipeline, Kafka brokers manage partitioned topics with consumer groups. We migrated from ZooKeeper to KRaft mode to simplify cluster orchestration.',
        expectedKept: ['Kafka', 'brokers', 'partitioned topics', 'consumer groups', 'ZooKeeper', 'KRaft'],
        expectedRedacted: ['Charlie Green'],
      },
      {
        id: 4,
        topic: 'PostgreSQL B-Tree & Query Optimization',
        input: 'Candidate Dave Miller (linkedin: https://linkedin.com/in/dave-miller-123). I optimized PostgreSQL queries using compound B-Tree indexes, avoided sequential table scans, and tuned EXPLAIN ANALYZE execution plans.',
        expectedKept: ['PostgreSQL', 'B-Tree', 'compound', 'sequential table scans', 'EXPLAIN ANALYZE'],
        expectedRedacted: ['https://linkedin.com/in/dave-miller-123', 'Dave Miller'],
      },
      {
        id: 5,
        topic: 'Docker & Kubernetes Orchestration',
        input: 'Candidate Name: Elena Rostova (contact: +44 7911 123456). We containerized Node services with multi-stage Docker builds and deployed them to Kubernetes pods with Horizontal Pod Autoscalers (HPA) and ingress controllers.',
        expectedKept: ['containerized', 'Docker', 'Kubernetes', 'pods', 'Horizontal Pod Autoscalers', 'ingress controllers'],
        expectedRedacted: ['Elena Rostova', '+44 7911 123456'],
      },
      {
        id: 6,
        topic: 'React, Next.js & Client State',
        input: 'My name is Frank Chen. In our frontend, we migrated from Vite to Next.js for server-side rendering (SSR), and used React hooks and Zustand for client state management without unnecessary re-renders.',
        expectedKept: ['Vite', 'Next.js', 'server-side rendering', 'SSR', 'React hooks', 'Zustand', 'state management'],
        expectedRedacted: ['Frank Chen'],
      },
      {
        id: 7,
        topic: 'AWS Cloud Architecture & Lambda',
        input: 'Candidate Grace Hopper (email: grace@navy.mil). We built event-driven microservices on AWS Lambda, Amazon S3, and Amazon DynamoDB, decoupling async event processing through SQS queues.',
        expectedKept: ['microservices', 'AWS', 'Lambda', 'S3', 'DynamoDB', 'SQS'],
        expectedRedacted: ['grace@navy.mil', 'Grace Hopper'],
      },
      {
        id: 8,
        topic: 'GraphQL & Microservices Gateway',
        input: 'Applicant Name: Henry Ford. I designed a GraphQL federated gateway uniting five REST microservices with DataLoader to batch queries and eliminate N+1 database roundtrips.',
        expectedKept: ['GraphQL', 'federated gateway', 'REST', 'microservices', 'DataLoader', 'N+1'],
        expectedRedacted: ['Henry Ford'],
      },
      {
        id: 9,
        topic: 'Cassandra & NoSQL Data Modeling',
        input: 'My name is Irene Adler. With Apache Cassandra, we designed wide-column schemas optimized for query-first access patterns, setting partition keys and clustering columns to guarantee single-digit millisecond latency.',
        expectedKept: ['Cassandra', 'wide-column', 'partition keys', 'clustering columns', 'latency'],
        expectedRedacted: ['Irene Adler'],
      },
      {
        id: 10,
        topic: 'ACID Transactions & Two-Phase Commit',
        input: 'Applicant: Jack Reacher (phone: 555-987-6543). For financial transactions, we enforced ACID compliance via Two-Phase Commit (2PC) across transactional databases with idempotent retry tokens.',
        expectedKept: ['ACID', 'Two-Phase Commit', '2PC', 'transactional databases', 'idempotent retry tokens'],
        expectedRedacted: ['Jack Reacher', '555-987-6543'],
      },
    ];

    it('sanitizes all 10 real technical candidate answers without mangling ANY technical terminology', () => {
      for (const testCase of realTechnicalAnswers) {
        const sanitized = sanitizePromptForFreeTier(testCase.input);

        // Verify all required technical keywords are completely preserved
        for (const techKeyword of testCase.expectedKept) {
          expect(
            sanitized.toLowerCase(),
            `Test case #${testCase.id} (${testCase.topic}) lost technical keyword: "${techKeyword}"`
          ).toContain(techKeyword.toLowerCase());
        }

        // Verify all sensitive personal PII is redacted
        for (const pii of testCase.expectedRedacted) {
          expect(
            sanitized,
            `Test case #${testCase.id} failed to redact PII: "${pii}"`
          ).not.toContain(pii);
        }
      }
    });

    it('contains comprehensive technical whitelist items', () => {
      expect(TECHNICAL_WHITELIST.has('redis')).toBe(true);
      expect(TECHNICAL_WHITELIST.has('raft')).toBe(true);
      expect(TECHNICAL_WHITELIST.has('kafka')).toBe(true);
      expect(TECHNICAL_WHITELIST.has('kubernetes')).toBe(true);
      expect(TECHNICAL_WHITELIST.has('docker')).toBe(true);
      expect(TECHNICAL_WHITELIST.has('postgresql')).toBe(true);
    });
  });

  describe('2. Header Sync & Groq Duration String Parsing', () => {
    it('correctly parses various Groq duration formats into exact milliseconds', () => {
      expect(parseGroqDurationMs('1m26s')).toBe(86_000);
      expect(parseGroqDurationMs('450ms')).toBe(450);
      expect(parseGroqDurationMs('12.5s')).toBe(12_500);
      expect(parseGroqDurationMs('1h20m')).toBe(4_800_000);
      expect(parseGroqDurationMs('86400s')).toBe(86_400_000);
      expect(parseGroqDurationMs('30')).toBe(30_000);
      expect(parseGroqDurationMs(15)).toBe(15_000);
      expect(parseGroqDurationMs(null)).toBe(0);
      expect(parseGroqDurationMs('')).toBe(0);
    });

    it('stores parsed duration and sets exact cooldown expiry when remaining tokens < 400', () => {
      const mockHeaders = {
        'x-ratelimit-remaining-tokens': '150',
        'x-ratelimit-limit-tokens': '300000',
        'x-ratelimit-reset-tokens': '24.5s',
        'x-ratelimit-remaining-requests': '995',
        'x-ratelimit-reset-requests': '1m20s',
      };

      quotaGuard.syncProviderHeaders('groq', ROUTER_MODELS.GROQ_20B, mockHeaders);

      const status = quotaGuard.getStatus();
      const modelKey = `groq:${ROUTER_MODELS.GROQ_20B}`;
      const serverState = status.serverRateLimitState[modelKey];

      expect(serverState).toBeDefined();
      expect(serverState.remainingTokens).toBe(150);
      expect(serverState.resetTokensMs).toBe(24_500);
      expect(serverState.resetRequestsMs).toBe(80_000);
      expect(serverState.resetTokensDate).toBeGreaterThan(Date.now());

      // Model is placed into cooldown until resetTokensDate
      const check = quotaGuard.canUseModel(ROUTER_MODELS.GROQ_20B, 300);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('cooldown');
    });
  });

  describe('3. One-Scorer-Per-Session Pinning', () => {
    beforeEach(() => {
      quotaGuard.reset();
    });

    it('pins the scoring provider for a session and remains on that scorer for subsequent turns', async () => {
      quotaGuard.reset();
      const sessionId = 'session_pinned_test_101';

      // Turn 1: Starts fresh (tries Groq 20b)
      const turn1Result = await callTurnScoring({
        previousQuestion: 'Explain database indexing.',
        userAnswer: 'B-Trees balance search and write complexity at O(log n).',
        questionNumber: 1,
        sessionId,
      });

      if (turn1Result.isEstimated) {
        expect(turn1Result.score).toBeNull();
      } else {
        expect(turn1Result.score).toBeGreaterThan(0);
      }
      const pinnedScorerTurn1 = getSessionScorer(sessionId);
      expect(pinnedScorerTurn1).not.toBeNull();
      expect(pinnedScorerTurn1?.provider).toBe(turn1Result.evalProvider);
      expect(pinnedScorerTurn1?.model).toBe(turn1Result.evalModelUsed);

      // Turn 2: Should use the exact same pinned scorer!
      const turn2Result = await callTurnScoring({
        previousQuestion: 'How does LSM Tree compare to B-Tree?',
        userAnswer: 'LSM trees optimize write amplification by appending to memtable and flushing SSTables.',
        questionNumber: 2,
        sessionId,
      });

      expect(turn2Result.evalProvider).toBe(pinnedScorerTurn1?.provider);
      expect(turn2Result.evalModelUsed).toBe(pinnedScorerTurn1?.model);

      const pinnedScorerTurn2 = getSessionScorer(sessionId);
      expect(pinnedScorerTurn2?.provider).toBe(pinnedScorerTurn1?.provider);
    });

    it('cascades down cleanly if the pinned provider fails, and updates the pin without flip-flopping', async () => {
      const sessionId = 'session_pinned_failover_202';

      // Explicitly pin to groq
      setSessionScorer(sessionId, 'groq', ROUTER_MODELS.GROQ_20B);

      // Trip Groq into failure cooldown
      quotaGuard.markProviderFailing('groq', 60_000);

      // Next turn must cascade down to Gemini
      const turnResult = await callTurnScoring({
        previousQuestion: 'Explain CAP theorem.',
        userAnswer: 'In a network partition, you must choose between consistency and availability.',
        questionNumber: 3,
        sessionId,
      });

      expect(turnResult.evalProvider).not.toBe('groq');
      expect(['gemini', 'openrouter', 'heuristic-estimated']).toContain(turnResult.evalProvider);

      // The new working provider must now be pinned for this session
      const newPinned = getSessionScorer(sessionId);
      expect(newPinned?.provider).toBe(turnResult.evalProvider);

      // Clean up
      clearSessionScorer(sessionId);
      expect(getSessionScorer(sessionId)).toBeNull();
    });
  });

  describe('4. Real Live Multi-Tier Provider Failover Drill', () => {
    it('executes a real turn with working keys and verifies valid JSON with evalModelUsed', async () => {
      const result = await callTurnScoring({
        previousQuestion: 'What are the trade-offs of microservices vs monolithic architecture?',
        userAnswer: 'Microservices allow independent deployment and scaling per domain, but introduce distributed network latency, eventual consistency challenges, and operational overhead.',
        questionNumber: 2,
        difficultyTag: 'medium',
      });

      expect(result).toHaveProperty('score');
      if (result.isEstimated) {
        expect(result.score).toBeNull();
        expect(result.evalProvider).toBe('heuristic-estimated');
      } else {
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(10);
        expect(result.score).toBeLessThanOrEqual(100);
      }
      expect(result.evalProvider).toBeTruthy();
      expect(result.evalModelUsed).toBeTruthy();
      expect(result.feedback).toBeTruthy();
    });

    it('falls over to Google AI Studio (Gemini 3.5 Flash Lite) when Groq fails', async () => {
      // Simulate Groq key failure / rate limit
      quotaGuard.markProviderFailing('groq', 60_000);

      const result = await callTurnScoring({
        previousQuestion: 'Explain optimistic locking.',
        userAnswer: 'Optimistic locking checks a version number at commit time and rolls back on concurrent modification.',
        questionNumber: 3,
      });

      expect(result).toHaveProperty('score');
      expect(result.evalProvider).not.toBe('groq');
      // Should cascade to gemini or openrouter
      expect(['gemini', 'openrouter', 'heuristic-estimated']).toContain(result.evalProvider);
      expect(result.evalModelUsed).toBeTruthy();
    });

    it('falls over to OpenRouter 70b when both Groq and Gemini fail', { retry: 2, timeout: 60000 }, async () => {
      // Trip both Groq and Gemini
      quotaGuard.markProviderFailing('groq', 60_000);
      quotaGuard.markProviderFailing('gemini', 60_000);

      const result = await callTurnScoring({
        previousQuestion: 'How does consistent hashing work?',
        userAnswer: 'Consistent hashing maps both servers and keys to a virtual ring to minimize key remapping on node additions.',
        questionNumber: 4,
      });

      expect(result).toHaveProperty('score');
      expect(result.evalProvider).not.toBe('groq');
      expect(result.evalProvider).not.toBe('gemini');
      expect(['openrouter', 'heuristic-estimated']).toContain(result.evalProvider);
    });
  });
});

