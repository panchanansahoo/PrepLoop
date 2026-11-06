import 'dotenv/config';
import { textToSpeech } from '../services/voiceService.js';

const TEST_SENTENCES = [
  { label: 'Short Reaction', text: 'Got it, makes sense.' },
  { label: 'Technical Follow-Up', text: 'You mentioned a Redis cluster. How do you handle cache invalidation on database writes?' },
  { label: 'Symbolic & Complexity', text: 'With QuickSort, average time complexity is O of n log n, but what triggers worst-case O of n squared?' },
  { label: 'Distributed Systems', text: 'When scaling across partitions in Kafka, how do you prevent consumer lag when rebalancing occurs?' },
  { label: 'Production Monitoring', text: 'That is a solid approach. Walk me through how you would monitor latency and error rates in production.' },
];

async function runEdgeTtsDiagnostic() {
  console.log('========================================================================');
  console.log('🎙️ EDGE TTS LATENCY & REAL-HOST SYNTHESIS DIAGNOSTIC');
  console.log('Tests Microsoft Azure Neural endpoint reachability and measures audio latency');
  console.log('========================================================================\n');

  const latencies = [];
  let successCount = 0;

  for (let i = 0; i < TEST_SENTENCES.length; i++) {
    const item = TEST_SENTENCES[i];
    process.stdout.write(`[${i + 1}/${TEST_SENTENCES.length}] Synthesizing "${item.label}"... `);

    const t0 = Date.now();
    try {
      // Force edge provider to test live Microsoft endpoint (skip memory cache)
      const res = await textToSpeech(item.text, 'friendly', 'edge', 'en', 'female', { skipStaticClips: true });
      const elapsed = Date.now() - t0;
      latencies.push(elapsed);
      successCount++;

      const bufferBytes = res?.audio ? res.audio.length : 0;
      console.log(`✅ SUCCESS in ${elapsed}ms (${bufferBytes} bytes, voice: ${res?.voice || 'en-US-AriaNeural'})`);
    } catch (err) {
      const elapsed = Date.now() - t0;
      console.log(`❌ FAILED in ${elapsed}ms: ${err.message}`);
    }

    // Brief 300ms pause
    await new Promise((r) => setTimeout(r, 300));
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;

  console.log('\n========================================================================');
  console.log('📊 EDGE TTS LATENCY BENCHMARK REPORT');
  console.log('========================================================================');
  console.log(`Synthesis Success Rate: ${successCount}/${TEST_SENTENCES.length} (${((successCount / TEST_SENTENCES.length) * 100).toFixed(1)}%)`);
  console.log(`Min Latency:            ${min}ms`);
  console.log(`p50 Latency:            ${p50}ms`);
  console.log(`p95 Latency:            ${p95}ms`);
  console.log(`Max Latency:            ${max}ms`);
  console.log('------------------------------------------------------------------------');

  if (successCount === TEST_SENTENCES.length && p95 < 2500) {
    console.log('✅ Edge TTS endpoint is HEALTHY and well within latency budget (<2500ms).');
  } else if (successCount < TEST_SENTENCES.length) {
    console.warn('⚠️ WARNING: Edge TTS failed on some requests. Check if host IP range is restricted by Microsoft.');
  } else {
    console.log(`ℹ️ Edge TTS responded with p95=${p95}ms.`);
  }
  console.log('========================================================================\n');

  return { successCount, total: TEST_SENTENCES.length, p50, p95, min, max };
}

runEdgeTtsDiagnostic()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal diagnostic error:', err);
    process.exit(1);
  });
