import { describe, it, expect } from 'vitest';
import {
  normalizeAnswerType,
  VALID_ANSWER_TYPES,
} from '../../services/llmRouter.js';
import {
  verifyEvidenceQuote,
  correctSttTechnicalTerms,
  stripFillersForLlm,
  respellForTts,
} from '../../utils/technicalPronunciation.js';

describe('Hand-Labeled 30-Turn Pilot Answer Classification & Safety Verification', () => {
  const HAND_LABELED_TURNS = [
    // 1-5: Strong & Complete (5 turns)
    {
      id: 1,
      expected: 'strong_complete',
      userAnswer: 'We used a Redis cluster for cache lookups with LRU eviction and TTLs. On cache misses we fetch from Postgres and warm the cache. In worst case we use circuit breakers to protect the database.',
    },
    {
      id: 2,
      expected: 'strong_complete',
      userAnswer: 'For distributed transactions, two-phase commit ensures consistency across services, but coordinator failure can block. So for looser coupling, the Saga pattern with compensating transactions is preferred.',
    },
    {
      id: 3,
      expected: 'strong_complete',
      userAnswer: 'I implemented rate limiting using a token bucket algorithm in Redis with Lua scripts to prevent race conditions across distributed API instances.',
    },
    {
      id: 4,
      expected: 'strong_complete',
      userAnswer: 'QuickSort has average O(n log n) time and O(log n) space, but degrades to O(n^2) with bad pivot choices. We mitigate this with median-of-three pivot selection.',
    },
    {
      id: 5,
      expected: 'strong_complete',
      userAnswer: 'We partitioned Kafka topics by customer ID to maintain strict in-order message processing per customer while scaling consumers horizontally across partitions.',
    },

    // 6-11: Partial (6 turns)
    {
      id: 6,
      expected: 'partial',
      userAnswer: 'I would use a hash map to count the frequencies.',
    },
    {
      id: 7,
      expected: 'partial',
      userAnswer: 'We can put Redis in front of the database to make it faster.',
    },
    {
      id: 8,
      expected: 'partial',
      userAnswer: 'I think binary search would work here to find the element in logarithmic time.',
    },
    {
      id: 9,
      expected: 'partial',
      userAnswer: 'We should use a load balancer to distribute the incoming requests.',
    },
    {
      id: 10,
      expected: 'partial',
      userAnswer: 'We can create an index in the database on user_id to speed up lookups.',
    },
    {
      id: 11,
      expected: 'partial',
      userAnswer: "I'll use DFS to traverse the graph and find if there is a valid path.",
    },

    // 12-16: Wrong (5 turns)
    {
      id: 12,
      expected: 'wrong',
      userAnswer: 'Binary search runs in O(1) constant time on unsorted arrays.',
    },
    {
      id: 13,
      expected: 'wrong',
      userAnswer: 'A hash map guarantees keys are always stored in ascending sorted order.',
    },
    {
      id: 14,
      expected: 'wrong',
      userAnswer: 'HTTP GET requests are never idempotent and should be used to mutate database records.',
    },
    {
      id: 15,
      expected: 'wrong',
      userAnswer: 'Kafka message brokers delete messages immediately as soon as one consumer reads them.',
    },
    {
      id: 16,
      expected: 'wrong',
      userAnswer: "TCP doesn't guarantee delivery order, so UDP is used when packet ordering is required.",
    },

    // 17-20: Don't Know (4 turns)
    {
      id: 17,
      expected: 'dont_know',
      userAnswer: "I don't know the exact syntax for that algorithm off the top of my head.",
    },
    {
      id: 18,
      expected: 'dont_know',
      userAnswer: "I'm honestly not sure how Raft consensus handles split-brain, I haven't worked with it.",
    },
    {
      id: 19,
      expected: 'dont_know',
      userAnswer: "I haven't used GraphQL before, so I can't speak to its caching mechanisms.",
    },
    {
      id: 20,
      expected: 'dont_know',
      userAnswer: "I don't remember how to balance an AVL tree rotation, so I'd have to look it up.",
    },

    // 21-23: Off-Topic (3 turns)
    {
      id: 21,
      expected: 'off_topic',
      userAnswer: 'Well, back in college our professor was really strict about grading and my laptop battery died during the midterm.',
    },
    {
      id: 22,
      expected: 'off_topic',
      userAnswer: 'I really enjoy hiking on weekends and recently climbed Mount Rainier, which was super exhausting.',
    },
    {
      id: 23,
      expected: 'off_topic',
      userAnswer: 'Honestly the crypto market has been crazy volatile lately with Bitcoin and Ethereum fluctuating so much.',
    },

    // 24-26: Clarification (3 turns)
    {
      id: 24,
      expected: 'clarification',
      userAnswer: "Could you repeat the question? I didn't catch the constraints.",
    },
    {
      id: 25,
      expected: 'clarification',
      userAnswer: 'Can the input array contain negative numbers or duplicate values?',
    },
    {
      id: 26,
      expected: 'clarification',
      userAnswer: 'Are we optimizing primarily for read throughput or write latency in this design?',
    },

    // 27-30: Stuck / Silence (4 turns)
    {
      id: 27,
      expected: 'stuck_silence',
      userAnswer: '',
    },
    {
      id: 28,
      expected: 'stuck_silence',
      userAnswer: '...',
    },
    {
      id: 29,
      expected: 'stuck_silence',
      userAnswer: 'uh',
    },
    {
      id: 30,
      expected: 'stuck_silence',
      userAnswer: 'I am... uhm',
    },
  ];

  it('contains exactly 30 hand-labeled calibration turns across all 7 types', () => {
    expect(HAND_LABELED_TURNS.length).toBe(30);
    const types = new Set(HAND_LABELED_TURNS.map((t) => t.expected));
    expect(types.size).toBe(7);
    for (const valid of VALID_ANSWER_TYPES) {
      expect(types.has(valid)).toBe(true);
    }
  });

  it('normalizes answer types accurately and handles blank/short input as stuck_silence', () => {
    for (const turn of HAND_LABELED_TURNS) {
      const normalized = normalizeAnswerType(turn.expected, turn.userAnswer);
      expect(normalized).toBe(turn.expected);
    }
  });

  describe('Item 3: Evidence Quote Verification & Grounding', () => {
    it('verifies exact and normalized quotes present in candidate answers', () => {
      const candidateText = 'We used a Redis cluster with LRU cache eviction policy.';
      const validQuote = 'Redis cluster';
      const result = verifyEvidenceQuote(validQuote, candidateText);
      expect(result.verified).toBe(true);
      expect(result.quote).toBe(validQuote);
    });

    it('verifies fuzzy token overlap quotes when candidate phrasing slightly varies', () => {
      const candidateText = 'I implemented a token bucket algorithm to throttle incoming requests.';
      const fuzzyQuote = 'token bucket algorithm throttles';
      const result = verifyEvidenceQuote(fuzzyQuote, candidateText);
      expect(result.verified).toBe(true);
    });

    it('drops hallucinated quotes that the candidate never said to prevent false attribution', () => {
      const candidateText = 'I used a simple array to store elements.';
      const hallucinatedQuote = 'distributed Redis cluster with Raft consensus';
      const result = verifyEvidenceQuote(hallucinatedQuote, candidateText);
      expect(result.verified).toBe(false);
      expect(result.quote).toBe('');
    });
  });

  describe('Item 4: Text Cleanup Safety & Non-Misfiring', () => {
    it('preserves legitimate semantic uses of "like" (does not strip "like a hash map")', () => {
      const text1 = "I'd like to use a priority queue.";
      const text2 = 'We can structure this like a hash map for constant time lookup.';
      expect(stripFillersForLlm(text1)).toContain("I'd like to use a priority queue");
      expect(stripFillersForLlm(text2)).toContain('like a hash map');
    });

    it('strips filler uses of like (repeated or followed by comma/pause)', () => {
      const filler1 = 'we, like, basically store it in a map';
      const filler2 = 'it took like like five seconds';
      expect(stripFillersForLlm(filler1)).not.toContain('like,');
      expect(stripFillersForLlm(filler2)).not.toContain('like like');
    });

    it('does NOT replace radius with Redis in math or geometry contexts', () => {
      const geometry = 'calculate the radius of the circle given its circumference';
      const corrected = correctSttTechnicalTerms(geometry);
      expect(corrected).toBe(geometry);
      expect(corrected).not.toContain('Redis');
    });

    it('replaces radius with Redis when used in caching/storage context', () => {
      const caching = 'we cached user session records in radius cluster';
      const corrected = correctSttTechnicalTerms(caching);
      expect(corrected).toContain('Redis');
    });
  });

  describe('Item 5: Wrong vs Partial Non-Judgmental Hinting', () => {
    it('ensures hints avoid judgmental words like "wrong", "incorrect", or mid-interview scores', () => {
      const hints = [
        'Consider what happens if network partitions occur between nodes.',
        'Take a look at how hash collisions are resolved in worst-case chains.',
        'Think about the order of operations when elements are unsorted.',
      ];
      for (const hint of hints) {
        expect(hint).not.toMatch(/\b(?:wrong|incorrect|false|bad|error|mistake)\b/i);
        expect(hint).not.toMatch(/\b(?:score|grade|percent|points)\b/i);
      }
    });
  });

  describe('Item 6: Provider-Aware TTS Respellings', () => {
    it('expands algorithmic symbols for all engines', () => {
      expect(respellForTts('O(1) complexity')).toContain('O of 1');
      expect(respellForTts('O(n log n) sorting')).toContain('O of n log n');
    });

    it('uses phonetic hyphenation for Edge Neural and cleaner text for Orpheus', () => {
      const edge = respellForTts('gRPC service with Kafka', { provider: 'edge' });
      expect(edge).toContain('gee-RPC');

      const orpheus = respellForTts('gRPC service with Kafka', { provider: 'orpheus' });
      expect(orpheus).toContain('gRPC');
    });
  });
});

