import 'dotenv/config';
import { quotaGuard } from '../services/quotaGuard.js';
import { deferredJobQueue } from '../services/deferredJobQueue.js';
import { loadSessionScorer } from '../services/llmRouter.js';

async function verify() {
  const sessionId = process.argv[2];
  console.log(`Verifying post-restart state restoration${sessionId ? ` for session ${sessionId}` : ''}...`);

  await quotaGuard.loadFromSupabase();
  await deferredJobQueue.loadPendingJobsFromSupabase();

  const status = quotaGuard.getStatus();
  console.log(`- Total Tokens Loaded Today: ${status.totalTokensToday}`);
  console.log(`- Pending Deferred Jobs in Queue: ${deferredJobQueue.getQueueLength()}`);

  if (sessionId) {
    const scorer = await loadSessionScorer(sessionId);
    console.log(`- Session Pinned Scorer:`, scorer);
    if (scorer && scorer.provider === 'gemini') {
      console.log('✅ Real Host Process Restart Drill PASSED: Pinned scorer cleanly recovered from Supabase!');
      process.exit(0);
    }
  }

  if (status.totalTokensToday > 0) {
    console.log('✅ Real Host Process Restart Drill PASSED: Token usage counters cleanly restored from Supabase!');
    process.exit(0);
  } else {
    console.error('❌ Real Host Process Restart Drill FAILED: State was not restored from Supabase.');
    process.exit(1);
  }
}

verify().catch((e) => { console.error(e); process.exit(1); });
