import 'dotenv/config';
import { callFastReply } from '../services/llmRouter.js';

// 30 Hand-Labeled Calibration Turns with realistic interview questions & answers.
// Contains 10 human-relabeled realistic software engineering turns (marked humanRelabeled: true)
// to ensure human-grounded evaluation across all 7 answer types.
export const BENCHMARK_TURNS = [
  // 1-5: Strong & Complete (5 turns)
  {
    id: 1,
    humanRelabeled: true,
    previousQuestion: 'How would you scale our read-heavy product catalog to handle 50,000 requests per second?',
    userAnswer: 'We used a Redis cluster for cache lookups with LRU eviction and TTLs. On cache misses we fetch from Postgres and warm the cache. In worst case we use circuit breakers to protect the database.',
    expected: 'strong_complete',
  },
  {
    id: 2,
    humanRelabeled: true,
    previousQuestion: 'How do you maintain data consistency across distributed microservices when a checkout order spans payment and inventory?',
    userAnswer: 'For distributed transactions, two-phase commit ensures consistency across services, but coordinator failure can block. So for looser coupling, the Saga pattern with compensating transactions is preferred.',
    expected: 'strong_complete',
  },
  {
    id: 3,
    humanRelabeled: false,
    previousQuestion: 'How would you prevent abusive API clients from overwhelming our public REST endpoints?',
    userAnswer: 'I implemented rate limiting using a token bucket algorithm in Redis with Lua scripts to prevent race conditions across distributed API instances.',
    expected: 'strong_complete',
  },
  {
    id: 4,
    humanRelabeled: false,
    previousQuestion: 'Can you explain the runtime characteristics of QuickSort and how you avoid its worst case?',
    userAnswer: 'QuickSort has average O(n log n) time and O(log n) space, but degrades to O(n^2) with bad pivot choices. We mitigate this with median-of-three pivot selection.',
    expected: 'strong_complete',
  },
  {
    id: 5,
    humanRelabeled: false,
    previousQuestion: 'How do you ensure message ordering in Apache Kafka when scaling across multiple consumers?',
    userAnswer: 'We partitioned Kafka topics by customer ID to maintain strict in-order message processing per customer while scaling consumers horizontally across partitions.',
    expected: 'strong_complete',
  },

  // 6-11: Partial (6 turns)
  {
    id: 6,
    humanRelabeled: true,
    previousQuestion: 'Given an array of strings, how would you find the top K most frequent elements?',
    userAnswer: 'I would use a hash map to count the frequencies.',
    expected: 'partial',
  },
  {
    id: 7,
    humanRelabeled: true,
    previousQuestion: 'Our database query times spike during peak morning traffic. What immediate architectural changes would you propose?',
    userAnswer: 'We can put Redis in front of the database to make it faster.',
    expected: 'partial',
  },
  {
    id: 8,
    humanRelabeled: false,
    previousQuestion: 'How would you locate an element in a sorted rotated array?',
    userAnswer: 'I think binary search would work here to find the element in logarithmic time.',
    expected: 'partial',
  },
  {
    id: 9,
    humanRelabeled: false,
    previousQuestion: 'How do you handle high incoming HTTP traffic across multiple backend instances?',
    userAnswer: 'We should use a load balancer to distribute the incoming requests.',
    expected: 'partial',
  },
  {
    id: 10,
    humanRelabeled: false,
    previousQuestion: 'Our queries filtering by user_id are performing full table scans. How would you optimize this?',
    userAnswer: 'We can create an index in the database on user_id to speed up lookups.',
    expected: 'partial',
  },
  {
    id: 11,
    humanRelabeled: false,
    previousQuestion: 'How would you determine if there is a path connecting two vertices in a directed graph?',
    userAnswer: "I'll use DFS to traverse the graph and find if there is a valid path.",
    expected: 'partial',
  },

  // 12-16: Wrong (5 turns)
  {
    id: 12,
    humanRelabeled: true,
    previousQuestion: 'What is the time complexity of binary search, and can you run it directly on an unsorted array?',
    userAnswer: 'Binary search runs in O(1) constant time on unsorted arrays.',
    expected: 'wrong',
  },
  {
    id: 13,
    humanRelabeled: true,
    previousQuestion: 'How does an unordered hash map internally store keys, and does it guarantee sorted iteration order?',
    userAnswer: 'A hash map guarantees keys are always stored in ascending sorted order.',
    expected: 'wrong',
  },
  {
    id: 14,
    humanRelabeled: true,
    previousQuestion: 'Which HTTP method should be used to update existing resources according to REST principles?',
    userAnswer: 'HTTP GET requests are never idempotent and should be used to mutate database records.',
    expected: 'wrong',
  },
  {
    id: 15,
    humanRelabeled: false,
    previousQuestion: 'How does message retention work in Apache Kafka compared to traditional queues like RabbitMQ?',
    userAnswer: 'Kafka message brokers delete messages immediately as soon as one consumer reads them.',
    expected: 'wrong',
  },
  {
    id: 16,
    humanRelabeled: false,
    previousQuestion: 'When would you pick TCP versus UDP for a real-time multiplayer game network layer?',
    userAnswer: "TCP doesn't guarantee delivery order, so UDP is used when packet ordering is required.",
    expected: 'wrong',
  },

  // 17-20: Don't Know (4 turns)
  {
    id: 17,
    humanRelabeled: true,
    previousQuestion: 'Could you implement the A* pathfinding heuristic and priority queue updates?',
    userAnswer: "I don't know the exact syntax for that algorithm off the top of my head.",
    expected: 'dont_know',
  },
  {
    id: 18,
    humanRelabeled: true,
    previousQuestion: 'How does Raft leader election handle a network partition between the leader and minority nodes?',
    userAnswer: "I'm honestly not sure how Raft consensus handles split-brain, I haven't worked with it.",
    expected: 'dont_know',
  },
  {
    id: 19,
    humanRelabeled: false,
    previousQuestion: 'How do you implement client-side normalized caching with Apollo GraphQL?',
    userAnswer: "I haven't used GraphQL before, so I can't speak to its caching mechanisms.",
    expected: 'dont_know',
  },
  {
    id: 20,
    humanRelabeled: false,
    previousQuestion: 'Can you show me the code for performing a double rotation on an unbalanced AVL tree?',
    userAnswer: "I don't remember how to balance an AVL tree rotation, so I'd have to look it up.",
    expected: 'dont_know',
  },

  // 21-23: Off-Topic (3 turns)
  {
    id: 21,
    humanRelabeled: true,
    previousQuestion: 'How do you profile and debug high memory consumption in a Node.js process?',
    userAnswer: 'Well, back in college our professor was really strict about grading and my laptop battery died during the midterm.',
    expected: 'off_topic',
  },
  {
    id: 22,
    humanRelabeled: false,
    previousQuestion: 'What strategies do you use for zero-downtime database schema migrations?',
    userAnswer: 'I really enjoy hiking on weekends and recently climbed Mount Rainier, which was super exhausting.',
    expected: 'off_topic',
  },
  {
    id: 23,
    humanRelabeled: false,
    previousQuestion: 'Explain the difference between optimistic and pessimistic locking in SQL databases.',
    userAnswer: 'Honestly the crypto market has been crazy volatile lately with Bitcoin and Ethereum fluctuating so much.',
    expected: 'off_topic',
  },

  // 24-26: Clarification (3 turns)
  {
    id: 24,
    humanRelabeled: false,
    previousQuestion: 'Given an array of integers, return the indices of the two numbers such that they add up to target.',
    userAnswer: "Could you repeat the question? I didn't catch the constraints.",
    expected: 'clarification',
  },
  {
    id: 25,
    humanRelabeled: false,
    previousQuestion: 'Design an algorithm to find the maximum sub-array sum in linear time.',
    userAnswer: 'Can the input array contain negative numbers or duplicate values?',
    expected: 'clarification',
  },
  {
    id: 26,
    humanRelabeled: false,
    previousQuestion: 'Design a key-value store similar to Redis.',
    userAnswer: 'Are we optimizing primarily for read throughput or write latency in this design?',
    expected: 'clarification',
  },

  // 27-30: Stuck / Silence (4 turns)
  {
    id: 27,
    humanRelabeled: false,
    previousQuestion: 'How would you detect memory leaks in a microservices deployment?',
    userAnswer: '',
    expected: 'stuck_silence',
  },
  {
    id: 28,
    humanRelabeled: false,
    previousQuestion: 'What is the advantage of using a B-Tree index over an LSM-Tree for write-heavy workloads?',
    userAnswer: '...',
    expected: 'stuck_silence',
  },
  {
    id: 29,
    humanRelabeled: false,
    previousQuestion: 'How does TLS 1.3 differ from TLS 1.2 in terms of handshake round trips?',
    userAnswer: 'uh',
    expected: 'stuck_silence',
  },
  {
    id: 30,
    humanRelabeled: false,
    previousQuestion: 'Explain how inverted indexes work in Elasticsearch.',
    userAnswer: 'I am... uhm',
    expected: 'stuck_silence',
  },

  // 31-38: Subtle Partial Answers (8 turns)
  // Crucial test cases: Candidates name a tool or concept, but provide NO depth, trade-offs, or implementation details.
  // Must NOT be classified as strong_complete, otherwise interviewer skips probing!
  {
    id: 31,
    humanRelabeled: true,
    previousQuestion: 'How would you handle duplicate order submissions from clients with flaky network connections?',
    userAnswer: 'I would generate a unique UUID for each request on the client side.',
    expected: 'partial',
  },
  {
    id: 32,
    humanRelabeled: true,
    previousQuestion: 'How do you detect memory leaks in a long-running Node.js service?',
    userAnswer: "I'd look at the memory usage metrics in Grafana or Datadog.",
    expected: 'partial',
  },
  {
    id: 33,
    humanRelabeled: true,
    previousQuestion: 'How would you design a leaderboard system for a mobile game with 10 million daily active players?',
    userAnswer: 'You could use Redis sorted sets to store player scores.',
    expected: 'partial',
  },
  {
    id: 34,
    humanRelabeled: true,
    previousQuestion: 'How do you design a database schema for an e-commerce inventory system to prevent negative stock during flash sales?',
    userAnswer: 'We can wrap the inventory update in a database transaction.',
    expected: 'partial',
  },
  {
    id: 35,
    humanRelabeled: true,
    previousQuestion: 'How would you implement a debounce function in JavaScript from scratch?',
    userAnswer: 'Use setTimeout and clearTimeout to delay the execution.',
    expected: 'partial',
  },
  {
    id: 36,
    humanRelabeled: true,
    previousQuestion: 'How would you implement mutual exclusion for critical sections across distributed server pods?',
    userAnswer: 'We can use a distributed lock.',
    expected: 'partial',
  },
  {
    id: 37,
    humanRelabeled: true,
    previousQuestion: 'How does HTTPS encrypt client-server communication?',
    userAnswer: 'It uses an SSL certificate to encrypt all the traffic.',
    expected: 'partial',
  },
  {
    id: 38,
    humanRelabeled: true,
    previousQuestion: 'How do you design an efficient pagination API for a feed with billions of rows?',
    userAnswer: 'I would use limit and offset in the SQL query.',
    expected: 'partial',
  },

  // 39-42: Wrong Answers / Misconceptions (4 turns)
  {
    id: 39,
    humanRelabeled: true,
    previousQuestion: 'Can an asynchronous Node.js application take advantage of multiple CPU cores out of the box on a single process?',
    userAnswer: 'Yes, Node.js automatically distributes JavaScript execution threads across all available CPU cores.',
    expected: 'wrong',
  },
  {
    id: 40,
    humanRelabeled: true,
    previousQuestion: 'How does database indexing impact write performance in relational databases?',
    userAnswer: 'Adding more secondary indexes always speeds up database INSERT and UPDATE queries.',
    expected: 'wrong',
  },
  {
    id: 41,
    humanRelabeled: true,
    previousQuestion: 'What happens when two threads in Java write to a non-volatile primitive variable simultaneously without synchronization?',
    userAnswer: 'Java memory model guarantees thread-safe atomic writes for all 64-bit primitive variables automatically.',
    expected: 'wrong',
  },
  {
    id: 42,
    humanRelabeled: true,
    previousQuestion: 'How does Redis persist data to disk, and is Redis purely an in-memory database with zero persistence?',
    userAnswer: 'Redis is strictly volatile RAM-only and cannot write snapshots or write-ahead logs to disk.',
    expected: 'wrong',
  },

  // 43-45: Don't Know / Candidate Gaps (3 turns)
  {
    id: 43,
    humanRelabeled: true,
    previousQuestion: 'Can you explain how consistent hashing with virtual nodes handles node addition and removal?',
    userAnswer: "I have heard the term consistent hashing, but I haven't implemented it and don't know the math behind virtual nodes.",
    expected: 'dont_know',
  },
  {
    id: 44,
    humanRelabeled: true,
    previousQuestion: 'How does the Paxos consensus algorithm achieve agreement in the presence of message loss?',
    userAnswer: "I'm not familiar with Paxos internals, I've only read high-level summaries.",
    expected: 'dont_know',
  },
  {
    id: 45,
    humanRelabeled: true,
    previousQuestion: 'What is the difference between B-Trees and LSM-Trees in terms of read vs write amplification?',
    userAnswer: "I honestly don't know the exact trade-offs between those two storage engine architectures.",
    expected: 'dont_know',
  },

  // 46-48: Strong & Complete (3 turns)
  {
    id: 46,
    humanRelabeled: true,
    previousQuestion: 'How would you design a URL shortener service that handles 10,000 writes and 100,000 reads per second?',
    userAnswer: "I'd use Base62 encoding on an auto-incrementing ID or distributed snowflake ID to generate 7-character hashes. Cache hot URLs in Redis with LRU eviction to serve reads from RAM, and store mappings in Postgres partitioned by short_code hash with a read replica pool.",
    expected: 'strong_complete',
  },
  {
    id: 47,
    humanRelabeled: true,
    previousQuestion: 'How would you prevent the Thundering Herd problem when a hot cache key expires?',
    userAnswer: 'We can use mutex locking / singleflight so only one worker thread fetches from the DB on cache miss while others wait, or implement probabilistic early expiration (XFetch algorithm) to refresh the cache before it expires.',
    expected: 'strong_complete',
  },
  {
    id: 48,
    humanRelabeled: true,
    previousQuestion: 'How do you handle schema evolution in event-driven microservices using Kafka?',
    userAnswer: 'We use Avro or Protobuf with a central Confluent Schema Registry enforcing backward compatibility. Producers register schema versions, and consumers gracefully ignore unknown new fields without failing deserialization.',
    expected: 'strong_complete',
  },

  // 49-50: Clarification (2 turns)
  {
    id: 49,
    humanRelabeled: true,
    previousQuestion: 'Design a rate limiter for our public API.',
    userAnswer: 'Should this rate limiter be enforced per IP address, per authenticated user ID, or across global endpoints?',
    expected: 'clarification',
  },
  {
    id: 50,
    humanRelabeled: true,
    previousQuestion: 'Find the longest substring without repeating characters in a given string.',
    userAnswer: 'Does the string consist only of standard ASCII characters, or can it contain arbitrary Unicode symbols?',
    expected: 'clarification',
  },
];

async function runEvaluation() {
  console.log('========================================================================');
  console.log('🚀 LIVE BENCHMARK: 50-Turn Hand-Labeled Answer Classification Accuracy');
  console.log('Includes 30 human-relabeled turns with subtle partials & edge cases');
  console.log('========================================================================\n');

  let correctCount = 0;
  let quoteVerifiedCount = 0;
  let genericFallbackCount = 0;
  let technicalContentTurnsCount = 0;
  let technicalVerifiedCount = 0;
  let technicalFallbackCount = 0;
  const confusionMatrix = {};
  const wrongVsPartial = {
    expectedWrongPredictedPartial: 0,
    expectedPartialPredictedWrong: 0,
  };
  const partialVsStrong = {
    expectedPartialPredictedStrong: 0,
    expectedStrongPredictedPartial: 0,
  };

  const results = [];

  for (let i = 0; i < BENCHMARK_TURNS.length; i++) {
    const turn = BENCHMARK_TURNS[i];
    process.stdout.write(`[${i + 1}/${BENCHMARK_TURNS.length}] Evaluating Turn #${turn.id} (${turn.expected})... `);

    const startTime = Date.now();
    try {
      const reply = await callFastReply({
        previousQuestion: turn.previousQuestion,
        userAnswer: turn.userAnswer,
        company: 'Google',
        role: 'Senior Software Engineer',
        stage: 'Technical',
        questionNumber: turn.id,
        adaptivePrompt: '',
        history: [],
      });

      const elapsed = Date.now() - startTime;
      const isMatch = reply.answerType === turn.expected;
      if (isMatch) correctCount++;
      if (reply.quoteVerified) quoteVerifiedCount++;

      const isTechnicalContent = ['strong_complete', 'partial', 'wrong'].includes(turn.expected);
      if (isTechnicalContent) {
        technicalContentTurnsCount++;
        if (reply.quoteVerified) {
          technicalVerifiedCount++;
        } else {
          technicalFallbackCount++;
        }
      }

      // Confusion matrix tracking
      const pairKey = `${turn.expected} -> ${reply.answerType}`;
      confusionMatrix[pairKey] = (confusionMatrix[pairKey] || 0) + 1;

      if (turn.expected === 'wrong' && reply.answerType === 'partial') {
        wrongVsPartial.expectedWrongPredictedPartial++;
      } else if (turn.expected === 'partial' && reply.answerType === 'wrong') {
        wrongVsPartial.expectedPartialPredictedWrong++;
      }

      if (turn.expected === 'partial' && reply.answerType === 'strong_complete') {
        partialVsStrong.expectedPartialPredictedStrong++;
      } else if (turn.expected === 'strong_complete' && reply.answerType === 'partial') {
        partialVsStrong.expectedStrongPredictedPartial++;
      }

      results.push({
        id: turn.id,
        expected: turn.expected,
        predicted: reply.answerType,
        isMatch,
        provider: reply.provider,
        model: reply.modelUsed,
        quoteVerified: reply.quoteVerified,
        evidenceQuote: reply.evidenceQuote,
        followUp: reply.followUpQuestion,
        elapsed,
      });

      console.log(`${isMatch ? '✅ MATCH' : '❌ MISMATCH'} (Pred: ${reply.answerType}, ${elapsed}ms, ${reply.provider})`);
    } catch (err) {
      console.log(`💥 ERROR: ${err.message}`);
      results.push({
        id: turn.id,
        expected: turn.expected,
        predicted: 'error',
        isMatch: false,
        error: err.message,
      });
    }
    // Brief pause to stay well within free tier rate limits
    await new Promise((r) => setTimeout(r, 600));
  }

  const accuracyPct = ((correctCount / BENCHMARK_TURNS.length) * 100).toFixed(1);
  const overallQuoteVerifiedPct = ((quoteVerifiedCount / BENCHMARK_TURNS.length) * 100).toFixed(1);
  const contentQuoteVerifiedPct = technicalContentTurnsCount > 0 ? ((technicalVerifiedCount / technicalContentTurnsCount) * 100).toFixed(1) : '0.0';
  const contentFallbackRatePct = technicalContentTurnsCount > 0 ? ((technicalFallbackCount / technicalContentTurnsCount) * 100).toFixed(1) : '0.0';

  console.log('\n========================================================================');
  console.log('📊 BENCHMARK SUMMARY & CONFUSION REPORT');
  console.log('========================================================================');
  console.log(`Total Turns Evaluated: ${BENCHMARK_TURNS.length}`);
  console.log(`Overall Accuracy:      ${accuracyPct}% (${correctCount}/${BENCHMARK_TURNS.length})`);
  console.log(`Technical Turns Evaluated: ${technicalContentTurnsCount}`);
  console.log(`Technical Quote Verified: ${contentQuoteVerifiedPct}% (${technicalVerifiedCount}/${technicalContentTurnsCount})`);
  console.log(`Technical Fallback Rate:  ${contentFallbackRatePct}% (${technicalFallbackCount}/${technicalContentTurnsCount})`);
  console.log('------------------------------------------------------------------------');
  console.log('🎯 Wrong vs Partial & Subtle Partial Risk Tracking:');
  console.log(`  - Expected "wrong" but classified as "partial":            ${wrongVsPartial.expectedWrongPredictedPartial}`);
  console.log(`  - Expected "partial" but classified as "wrong":            ${wrongVsPartial.expectedPartialPredictedWrong}`);
  console.log(`  - Expected "partial" but classified as "strong_complete":  ${partialVsStrong.expectedPartialPredictedStrong} (Critical: skips follow-up probe)`);
  console.log(`  - Expected "strong_complete" classified as "partial":      ${partialVsStrong.expectedStrongPredictedPartial}`);
  console.log('------------------------------------------------------------------------');
  console.log('Confusion Pairs Breakdown:');
  for (const [pair, count] of Object.entries(confusionMatrix)) {
    const [from, to] = pair.split(' -> ');
    const symbol = from === to ? '✓' : '⚠️';
    console.log(`  ${symbol} ${pair.padEnd(35)} : ${count}`);
  }
  console.log('========================================================================\n');

  if (Number(contentFallbackRatePct) > 20) {
    console.warn(`⚠️ WARNING: Technical fallback rate (${contentFallbackRatePct}%) exceeds 20% pilot tolerance threshold.`);
  } else {
    console.log(`✅ Technical fallback rate (${contentFallbackRatePct}%) is well within pilot budget (<= 20%).`);
  }

  return {
    accuracyPct,
    correctCount,
    total: BENCHMARK_TURNS.length,
    wrongVsPartial,
    confusionMatrix,
    contentFallbackRatePct,
    results,
  };
}

runEvaluation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });
