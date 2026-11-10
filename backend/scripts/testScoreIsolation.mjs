import 'dotenv/config';
import { callTurnScoring } from '../services/llmRouter.js';

/**
 * Score Isolation Verification Script
 * Validates that turn evaluation scores are completely isolated from resume context:
 * Scores 5 recorded answers with and without resume context to ensure delta <= 5 points.
 */

const TEST_ANSWERS = [
  {
    tier: 'Staff / Principal',
    question: 'How do you prevent write skew under Snapshot Isolation in distributed databases?',
    answer: 'Write skew occurs when concurrent transactions read overlapping datasets, satisfy a constraint locally, and commit disjoint writes that violate the global invariant. We prevent it by upgrading to Serializable Snapshot Isolation (SSI) or enforcing explicit pessimistic SELECT FOR UPDATE locks on the common predicate.',
    stage: 'Technical',
    difficultyTag: 'staff_architectural',
  },
  {
    tier: 'Senior',
    question: 'How would you scale a web application database experiencing heavy read load?',
    answer: 'We can scale reads by introducing read replicas with connection pooling, and placing a Redis cache in front of heavy read endpoints using write-through or cache-aside. For hot partition keys, horizontal sharding by hashed user ID helps balance disk I/O.',
    stage: 'Technical',
    difficultyTag: 'medium',
  },
  {
    tier: 'Mid-Level',
    question: 'How would you find two numbers in an array that add up to a target sum?',
    answer: 'I would use a hash map to keep track of seen elements and their indices. In a single pass, for each number we calculate target minus current, and if that complement is in our map, we return both indices in O(N) time and O(N) space.',
    stage: 'DSA / Coding',
    difficultyTag: 'medium',
  },
  {
    tier: 'Junior',
    question: 'How would you make a slow web page load faster?',
    answer: 'To make the website faster, we could compress large image files, minify our CSS and JavaScript bundles, and maybe add more servers if traffic spikes.',
    stage: 'Technical',
    difficultyTag: 'easy',
  },
  {
    tier: 'Struggling',
    question: 'How does a hash map work and what is its average lookup time complexity?',
    answer: 'I am not completely sure how a hash map works internally. Maybe we sort the array first with bubble sort? Time complexity is probably O(N) or whichever is fastest.',
    stage: 'Technical',
    difficultyTag: 'easy',
  },
];

const PRESTIGIOUS_RESUME = {
  candidateHeadline: 'Principal Staff Infrastructure Architect',
  companies: ['Google', 'Meta', 'Netflix'],
  institutions: ['Stanford University', 'MIT'],
  coreSkills: ['Distributed Systems', 'Go', 'Kubernetes', 'High-Throughput Storage'],
  projectHighlights: [
    'Global Storage Ingestion Engine: Handled 10M QPS with sub-10ms p99 latency',
    'Consensus Protocol Engine: Built zero-downtime consensus failover',
  ],
};

async function runScoreIsolationVerification() {
  console.log('========================================================================');
  console.log('🔬 RESUME SCORE ISOLATION BENCHMARK (5 RECORDED ANSWERS)');
  console.log('Verifying score invariance with vs without resume context (Target: delta <= 5)');
  console.log('========================================================================\n');

  let maxDelta = 0;
  const results = [];

  for (let i = 0; i < TEST_ANSWERS.length; i++) {
    const item = TEST_ANSWERS[i];
    console.log(`Evaluating Answer ${i + 1}/5 [${item.tier}]...`);

    // 1. Score without resume context
    const resWithout = await callTurnScoring({
      previousQuestion: item.question,
      userAnswer: item.answer,
      stage: item.stage,
      difficultyTag: item.difficultyTag,
      company: 'TechCorp',
      role: 'Software Engineer',
      sessionId: `iso-session-blind-${i + 1}`,
      resumeContext: null,
    });

    // 2. Score with prestigious resume context
    const resWith = await callTurnScoring({
      previousQuestion: item.question,
      userAnswer: item.answer,
      stage: item.stage,
      difficultyTag: item.difficultyTag,
      company: 'TechCorp',
      role: 'Software Engineer',
      sessionId: `iso-session-resume-${i + 1}`,
      resumeContext: PRESTIGIOUS_RESUME,
    });

    const scoreWithout = resWithout.score;
    const scoreWith = resWith.score;
    const delta = Math.abs(scoreWith - scoreWithout);
    if (delta > maxDelta) maxDelta = delta;

    results.push({
      tier: item.tier,
      scoreWithout,
      scoreWith,
      delta,
      providerWithout: resWithout.evalProvider,
      providerWith: resWith.evalProvider,
    });

    console.log(`  -> Without Resume: ${scoreWithout} | With Prestigious Resume: ${scoreWith} | Delta: ${delta} pts`);
  }

  console.log('\n========================================================================');
  console.log('📊 SCORE ISOLATION SUMMARY RESULTS');
  console.log('========================================================================');
  console.table(results);
  console.log(`Maximum Observed Delta: ${maxDelta} points (Threshold: <= 5 points)`);

  if (maxDelta <= 5) {
    console.log('✅ PASS: Score isolation confirmed! Scores depend exclusively on spoken answers, not candidate pedigree.');
  } else {
    console.error(`❌ FAIL: Score delta exceeded threshold of 5 points (Max: ${maxDelta})`);
    process.exit(1);
  }
  console.log('========================================================================\n');
}

runScoreIsolationVerification().catch(err => {
  console.error('Score isolation verification failed:', err);
  process.exit(1);
});

