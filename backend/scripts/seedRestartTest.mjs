import 'dotenv/config';
import { quotaGuard } from '../services/quotaGuard.js';
import { deferredJobQueue } from '../services/deferredJobQueue.js';
import { setSessionScorer, ROUTER_MODELS } from '../services/llmRouter.js';

async function seed() {
  console.log('Seeding pre-restart drill state to Supabase...');
  const testSessionId = `host_kill_drill_${Date.now()}`;

  quotaGuard.recordUsage({
    provider: 'gemini',
    model: ROUTER_MODELS.GEMINI_FLASH,
    totalTokens: 4200,
    userId: 'host_kill_candidate',
    ip: '10.0.0.42',
  });

  const job = deferredJobQueue.enqueueScoreTurn({
    sessionId: testSessionId,
    userId: 'host_kill_candidate',
    questionNumber: 2,
    previousQuestion: 'Explain Redis persistence.',
    userAnswer: 'RDB point-in-time snapshots and AOF write logs.',
  });

  setSessionScorer(testSessionId, 'gemini', ROUTER_MODELS.GEMINI_FLASH);
  await quotaGuard.flushSync();

  console.log(`✅ State seeded:`);
  console.log(`   Session ID:    ${testSessionId}`);
  console.log(`   Tokens:        4200`);
  console.log(`   Job ID:        ${job.jobId}`);
  console.log(`   Pinned Scorer: gemini (${ROUTER_MODELS.GEMINI_FLASH})`);
  console.log('\nNow kill the container or process (e.g. docker restart <id> or kill -9 <pid>).');
  console.log(`After restart, run: node scripts/verifyRestartState.mjs ${testSessionId}`);
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

