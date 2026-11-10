import { describe, expect, it } from 'vitest';

import {
  correctSttTechnicalTerms,
  COMMON_ENGLISH_WORDS,
  FUZZY_TECHNICAL_TARGETS,
  levenshteinDistance,
  normalizedLevenshteinSimilarity,
} from './aiInterviewVoiceUtils';

describe('Milestone 1 STT Empirical Adversarial Stress Test Suite', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Multi-clause sentences mixing technical keywords and homophones in natural senses
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Multi-clause sentences mixing technical keywords and homophones', () => {
    it('preserves all homophones in the primary challenge sentence', () => {
      const sentence =
        'We discuss caching strategies while watching the movie sequel within a 10-mile radius of the boat dock after getting some rest.';
      const output = correctSttTechnicalTerms(sentence, { enabled: true });

      expect(output).toBe(sentence);
      expect(output).toContain('radius');
      expect(output).toContain('sequel');
      expect(output).toContain('dock');
      expect(output).toContain('rest');
      expect(output).not.toContain('Redis');
      expect(output).not.toContain('SQL');
      expect(output).not.toContain('Docker');
      expect(output).not.toContain('REST API');
    });

    it('preserves homophones in diverse multi-clause non-technical contexts', () => {
      const cases = [
        {
          text: 'The cache server was installed near the boat dock where tourists rest after seeing the film sequel.',
          check: (out) => {
            expect(out).toContain('dock');
            expect(out).toContain('rest');
            expect(out).toContain('sequel');
            expect(out).not.toContain('Docker');
          },
        },
        {
          text: 'During the sequel to the film, they plotted the blast radius while sitting by the dock to rest.',
          check: (out) => {
            expect(out).toContain('dock');
            expect(out).toContain('rest');
            expect(out).toContain('sequel');
            expect(out).toContain('radius');
            expect(out).not.toContain('Redis');
            expect(out).not.toContain('Docker');
          },
        },
        {
          text: 'Even though we talked about caching data, we walked along the dock within a 5-mile radius and had a good rest.',
          check: (out) => {
            expect(out).toContain('dock');
            expect(out).toContain('rest');
            expect(out).toContain('radius');
            expect(out).not.toContain('Redis');
            expect(out).not.toContain('Docker');
          },
        },
        {
          text: 'The database was mentioned in the book sequel while the team took a rest at the dock.',
          check: (out) => {
            expect(out).toContain('dock');
            expect(out).toContain('rest');
            expect(out).toContain('sequel');
            expect(out).not.toContain('Docker');
          },
        },
        {
          text: 'We were caching files on our laptop while watching a movie sequel at a cabin within a 15-km radius of the boat dock, enjoying our well-deserved rest.',
          check: (out) => {
            expect(out).toContain('dock');
            expect(out).toContain('rest');
            expect(out).toContain('sequel');
            expect(out).toContain('radius');
            expect(out).not.toContain('Redis');
            expect(out).not.toContain('Docker');
          },
        },
        {
          text: 'While discussing cache eviction, we walked along the harbor dock and watched the movie sequel before taking a long rest.',
          check: (out) => {
            expect(out).toContain('dock');
            expect(out).toContain('rest');
            expect(out).toContain('sequel');
            expect(out).not.toContain('Docker');
          },
        },
        {
          text: 'The film director decided the movie sequel should feature a dock within a ten-mile radius where sailors rest.',
          check: (out) => {
            expect(out).toContain('dock');
            expect(out).toContain('rest');
            expect(out).toContain('sequel');
            expect(out).toContain('radius');
            expect(out).not.toContain('Redis');
            expect(out).not.toContain('Docker');
          },
        },
        {
          text: 'The boat arrived at the dock within a 2-mile radius while we enjoyed our weekend rest and discussed the novel sequel.',
          check: (out) => {
            expect(out).toContain('dock');
            expect(out).toContain('rest');
            expect(out).toContain('sequel');
            expect(out).toContain('radius');
            expect(out).not.toContain('Redis');
            expect(out).not.toContain('Docker');
          },
        },
      ];

      for (const item of cases) {
        const output = correctSttTechnicalTerms(item.text, { enabled: true });
        item.check(output);
      }
    });

    it('preserves radius when distance context exists even with technical words present', () => {
      const cases = [
        'We cache geographic data for users within a 10-mile radius.',
        'We store location points within a 50-kilometer radius in our cache.',
        'The server computes restaurant recommendations within a 3-mile radius.',
        'Our cluster monitors weather stations in a 25-mile radius.',
        'We cache search hits within a radius of 5 miles.',
      ];

      for (const text of cases) {
        const output = correctSttTechnicalTerms(text, { enabled: true });
        expect(output).toContain('radius');
        expect(output).not.toMatch(/\bRedis\b/);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Distance patterns
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Distance patterns guardrail verification', () => {
    const distancePatterns = [
      '5 miles radius',
      'radius of 5 miles',
      'radius: 10km',
      'within 20 meters radius',
      '10-meter radius',
      'within a 5-mile radius',
      'in a 10km radius',
      'turning radius of 15 feet',
      'outer radius of 30 cm',
      'inner radius of 4 inches',
      'blast radius of 500 meters',
      'search radius was 12 kilometers',
      'within 20 meters radius',
      'radius: 5 miles',
      'within a 2-mile radius',
      'The radius of the circle is five meters.',
      'The turning radius of this delivery truck is narrow.',
      'All stores within a 50-km radius were notified.',
      'Points within a 100-yard radius were inspected.',
      'The explosion had a 300-meter radius of impact.',
    ];

    it.each(distancePatterns)('preserves radius in distance phrase: "%s"', (phrase) => {
      const output = correctSttTechnicalTerms(phrase, { enabled: true });
      expect(output).toBe(phrase);
      expect(output.toLowerCase()).toContain('radius');
      expect(output).not.toContain('Redis');
    });

    it('preserves radius in distance phrases even when cache/storage keywords are present', () => {
      const distanceWithCache = [
        'We cache search results within 5 miles radius of the user.',
        'We cache points of interest within a radius of 5 miles.',
        'We store location results for query radius: 10km in memory.',
        'The cache holds delivery locations within 20 meters radius.',
        'We cache store locations within a 10-meter radius for instant lookup.',
        'The in-memory storage tracks ambulances within a 15-mile radius.',
      ];

      for (const phrase of distanceWithCache) {
        const output = correctSttTechnicalTerms(phrase, { enabled: true });
        expect(output).toContain('radius');
        expect(output).not.toContain('Redis');
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Common conversational & technical words near similarity >= 0.82
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Common conversational & technical words protection against fuzzy matching', () => {
    const candidateWords = [
      'system',
      'request',
      'server',
      'cluster',
      'process',
      'storage',
      'network',
      'client',
      'database',
      'service',
      'project',
      'program',
      'function',
      'variable',
      'endpoint',
      'method',
      'class',
      'module',
      'interface',
      'protocol',
      'architecture',
      'component',
      'platform',
      'infrastructure',
      'deployment',
      'configuration',
      'performance',
      'optimization',
      'monitoring',
      'analytics',
      'transaction',
      'consistency',
      'availability',
      'partition',
    ];

    it.each(candidateWords)('verifies word "%s" is NEVER mutated by Levenshtein distance', (word) => {
      const sentence = `The engineer analyzed the ${word} during the meeting.`;
      const output = correctSttTechnicalTerms(sentence, { enabled: true });
      expect(output).toBe(sentence);
      expect(output).toContain(word);
    });

    it('mathematically verifies no candidate word collides with any FUZZY_TECHNICAL_TARGETS without protection', () => {
      for (const word of candidateWords) {
        for (const target of FUZZY_TECHNICAL_TARGETS) {
          const sim = normalizedLevenshteinSimilarity(word.toLowerCase(), target.term.toLowerCase());
          if (sim >= 0.82) {
            // If similarity is >= 0.82, it MUST be protected by COMMON_ENGLISH_WORDS
            const isProtected = COMMON_ENGLISH_WORDS.has(word.toLowerCase());
            expect(
              isProtected,
              `Collision detected! Word "${word}" has similarity ${sim} to target "${target.term}" but is NOT in COMMON_ENGLISH_WORDS`
            ).toBe(true);
          }
        }
      }
    });

    it('verifies that all target candidate words are present in COMMON_ENGLISH_WORDS set', () => {
      const coreWords = ['system', 'request', 'server', 'process', 'storage'];
      for (const w of coreWords) {
        expect(COMMON_ENGLISH_WORDS.has(w), `Word "${w}" should be in COMMON_ENGLISH_WORDS`).toBe(true);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Positive boundary cases (legitimate technical intent)
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Positive boundary cases (legitimate technical intent retained or normalized)', () => {
    const positiveCases = [
      {
        description: 'Redis cache for user sessions',
        input: 'I set up a Redis cache for user sessions',
        expected: 'I set up a Redis cache for user sessions',
      },
      {
        description: 'Deployed containers with Kubernetes',
        input: 'We deployed our containers with Kubernetes',
        expected: 'We deployed our containers with Kubernetes',
      },
      {
        description: 'Phonetic homophone radius cache -> Redis cache',
        input: 'We used radius cache for session storage',
        expected: 'We used Redis cache for session storage',
      },
      {
        description: 'Phonetic homophone radius server -> Redis server',
        input: 'The application connects to a radius server for caching',
        expected: 'The application connects to a Redis server for caching',
      },
      {
        description: 'Phonetic homophone coobernetes -> Kubernetes',
        input: 'We deployed pods to coobernetes cluster',
        expected: 'We deployed pods to Kubernetes cluster',
      },
      {
        description: 'Phonetic homophone k8s and kubectl',
        input: 'We used cube c t l to manage our k eights cluster',
        expected: 'We used kubectl to manage our K8s cluster',
      },
      {
        description: 'Phonetic homophone sequel query -> SQL query',
        input: 'We wrote a sequel query against the database table',
        expected: 'We wrote a SQL query against the database table',
      },
      {
        description: 'Phonetic homophone dock container -> Docker container',
        input: 'We packaged the service into a dock container and deployed it',
        expected: 'We packaged the service into a Docker container and deployed it',
      },
      {
        description: 'Phonetic homophone rest api -> REST API and jason payload -> JSON',
        input: 'The client calls the rest api endpoint using jason payload over http',
        expected: 'The client calls the REST API endpoint using JSON over http',
      },
      {
        description: 'Phonetic homophone apache cough car -> Apache Kafka',
        input: 'Events are ingested into apache cough car topics',
        expected: 'Events are ingested into Apache Kafka topics',
      },
      {
        description: 'Phonetic homophone pie torch -> PyTorch with ML context',
        input: 'The model was trained with pie torch on a cluster of gpus',
        expected: 'The model was trained with PyTorch on a cluster of gpus',
      },
      {
        description: 'Phonetic homophone pie spark -> PySpark with big data context',
        input: 'We processed dataframe partitions with pie spark on hadoop',
        expected: 'We processed dataframe partitions with PySpark on hadoop',
      },
      {
        description: 'Phonetic homophone big query -> BigQuery with cloud analytics context',
        input: 'We queried petabytes in big query on google cloud',
        expected: 'We queried petabytes in BigQuery on google cloud',
      },
      {
        description: 'Phonetic homophone engine x -> NGINX',
        input: 'We placed an engine x reverse proxy in front of the web servers',
        expected: 'We placed an NGINX reverse proxy in front of the web servers',
      },
      {
        description: 'Phonetic homophone gee rpc -> gRPC',
        input: 'Services talk over gee rpc with protobuf definitions',
        expected: 'Services talk over gRPC with protobuf definitions',
      },
      {
        description: 'Phonetic homophone my sequel to post gres',
        input: 'We migrated from my sequel to post gres',
        expected: 'We migrated from MySQL to Postgres',
      },
      {
        description: 'Phonetic homophone dynamo db -> DynamoDB',
        input: 'We stored user profiles in dynamo db',
        expected: 'We stored user profiles in DynamoDB',
      },
      {
        description: 'Phonetic homophone jay dub dub tee -> JWT',
        input: 'The auth service verifies jay dub dub tee signatures',
        expected: 'The auth service verifies JWT signatures',
      },
      {
        description: 'ACID properties and CAP theorem',
        input: 'Transactions adhere to a cid properties and c a p theorem',
        expected: 'Transactions adhere to ACID properties and CAP theorem',
      },
      {
        description: 'B-tree and N+1 problem',
        input: 'The index is a b tree and we avoided the n plus one queries',
        expected: 'The index is a B-tree and we avoided the N+1 queries',
      },
      {
        description: 'Big-O notation',
        input: 'Hash lookups run in big o of one and search is big o of log n',
        expected: 'Hash lookups run in O(1) and search is O(log n)',
      },
      {
        description: 'Fuzzy typo kubernets -> Kubernetes',
        input: 'We deployed kubernets clusters',
        expected: 'We deployed Kubernetes clusters',
      },
      {
        description: 'Fuzzy typo postgressql -> PostgreSQL',
        input: 'We configured postgressql database',
        expected: 'We configured PostgreSQL database',
      },
      {
        description: 'Fuzzy typo elasticseach -> Elasticsearch',
        input: 'We searched indices in elasticseach cluster',
        expected: 'We searched indices in Elasticsearch cluster',
      },
    ];

    it.each(positiveCases)('$description', ({ input, expected }) => {
      const output = correctSttTechnicalTerms(input, { enabled: true });
      expect(output).toBe(expected);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Edge cases & Fuzzing robustness
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Edge cases & Fuzzing robustness', () => {
    it('handles empty, null, undefined, and non-string inputs safely without throwing', () => {
      expect(correctSttTechnicalTerms('', { enabled: true })).toBe('');
      expect(correctSttTechnicalTerms(null, { enabled: true })).toBe('');
      expect(correctSttTechnicalTerms(undefined, { enabled: true })).toBe('');
      expect(correctSttTechnicalTerms(12345, { enabled: true })).toBe(12345);
      expect(correctSttTechnicalTerms({}, { enabled: true })).toEqual({});
    });

    it('handles punctuation-heavy strings correctly', () => {
      const input = 'We cached search results within a 5-mile radius... Right? Yes!';
      const output = correctSttTechnicalTerms(input, { enabled: true });
      expect(output).toBe(input);
    });

    it('handles uppercase acronyms without accidental fuzzy mangling', () => {
      const acronyms = ['NASA', 'HTML', 'CSS', 'HTTP', 'SAML', 'SMTP', 'UUID', 'FIFO', 'LIFO'];
      for (const acr of acronyms) {
        const sentence = `The protocol uses ${acr} standard.`;
        const output = correctSttTechnicalTerms(sentence, { enabled: true });
        expect(output).toBe(sentence);
      }
    });
  });
});
