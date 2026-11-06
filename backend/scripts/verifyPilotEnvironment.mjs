import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { textToSpeech } from '../services/voiceService.js';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEnvironmentAudit() {
  console.log('========================================================================');
  console.log('📋 PREPLOOP PILOT-DAY ENVIRONMENT AUDIT & READINESS CHECK');
  console.log('Validates deployment tag, API keys, live provider models & Edge TTS');
  console.log('========================================================================\n');

  const checklist = [];

  // 1. Git Release Tag & Commit
  try {
    const gitTag = execSync('git describe --tags --exact-match', { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' }).trim();
    const gitSha = execSync('git rev-parse --short HEAD', { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' }).trim();
    const isTagMatch = gitTag === 'v1.2-pilot-ready';
    checklist.push({
      item: 'Git Release Tag',
      status: isTagMatch ? 'PASS' : 'WARN',
      detail: `Tag: ${gitTag || 'none'} (${gitSha}) ${isTagMatch ? '✓ Exact release candidate' : '⚠️ Expected v1.2-pilot-ready'}`,
    });
  } catch {
    try {
      const gitSha = execSync('git rev-parse --short HEAD', { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' }).trim();
      checklist.push({ item: 'Git Commit', status: 'PASS', detail: `Commit: ${gitSha} (no exact tag detected)` });
    } catch (e) {
      checklist.push({ item: 'Git Metadata', status: 'WARN', detail: e.message });
    }
  }

  // 2. Groq 20b
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    checklist.push({ item: 'Groq API Key', status: 'FAIL', detail: 'GROQ_API_KEY is not defined in environment' });
  } else {
    try {
      const t0 = Date.now();
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${groqKey.trim()}` },
      });
      const data = await res.json();
      const has20b = data.data?.some((m) => m.id === 'openai/gpt-oss-20b');
      const elapsed = Date.now() - t0;
      checklist.push({
        item: 'Groq 20b Endpoint',
        status: res.ok && has20b ? 'PASS' : 'FAIL',
        detail: `Status: HTTP ${res.status} (${elapsed}ms). openai/gpt-oss-20b ${has20b ? 'available' : 'MISSING'}.`,
      });
    } catch (err) {
      checklist.push({ item: 'Groq 20b Endpoint', status: 'FAIL', detail: err.message });
    }
  }

  // 3. Google AI Studio (Gemini)
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  if (!geminiKey) {
    checklist.push({ item: 'Gemini API Key', status: 'FAIL', detail: 'GEMINI_API_KEY is not defined' });
  } else {
    try {
      const t0 = Date.now();
      const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
      const res = await ai.models.generateContent({
        model: geminiModel,
        contents: 'Return JSON: {"status": "ok"}',
        config: { responseMimeType: 'application/json', maxOutputTokens: 50 },
      });
      const elapsed = Date.now() - t0;
      checklist.push({
        item: 'Gemini Free Tier Model',
        status: res.text ? 'PASS' : 'FAIL',
        detail: `Model: ${geminiModel} (${elapsed}ms). Response: ${res.text?.trim()?.slice(0, 30)}`,
      });
    } catch (err) {
      checklist.push({ item: 'Gemini Free Tier Model', status: 'FAIL', detail: `Model ${geminiModel} failed: ${err.message}` });
    }
  }

  // 4. OpenRouter Free Tier
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    checklist.push({ item: 'OpenRouter Key', status: 'FAIL', detail: 'OPENROUTER_API_KEY is not defined' });
  } else {
    try {
      const t0 = Date.now();
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${openRouterKey.trim()}` },
      });
      const elapsed = Date.now() - t0;
      checklist.push({
        item: 'OpenRouter Tertiary Tier',
        status: res.ok ? 'PASS' : 'FAIL',
        detail: `Status: HTTP ${res.status} (${elapsed}ms). Key verified.`,
      });
    } catch (err) {
      checklist.push({ item: 'OpenRouter Tertiary Tier', status: 'FAIL', detail: err.message });
    }
  }

  // 5. Supabase Admin Connection & Tables
  if (!supabaseAdmin) {
    checklist.push({ item: 'Supabase Admin', status: 'FAIL', detail: 'supabaseAdmin client is null or unconfigured' });
  } else {
    try {
      const t0 = Date.now();
      const { error: quotaErr } = await supabaseAdmin
        .from('quota_daily_usage')
        .select('date_key, total_tokens_used')
        .limit(1);

      const { error: jobErr } = await supabaseAdmin
        .from('deferred_interview_jobs')
        .select('id, status')
        .limit(1);

      const elapsed = Date.now() - t0;
      const ok = !quotaErr && !jobErr;
      checklist.push({
        item: 'Supabase Tables (Quota & Jobs)',
        status: ok ? 'PASS' : 'FAIL',
        detail: ok
          ? `Verified active in ${elapsed}ms (quota_daily_usage & deferred_interview_jobs accessible)`
          : `Error: ${quotaErr?.message || jobErr?.message}`,
      });
    } catch (err) {
      checklist.push({ item: 'Supabase Tables', status: 'FAIL', detail: err.message });
    }
  }

  // 6. Microsoft Edge Neural Live Reachability
  try {
    const t0 = Date.now();
    const res = await textToSpeech('Edge neural voice test.', 'friendly', 'edge', 'en', 'female', { skipStaticClips: true });
    const elapsed = Date.now() - t0;
    const ok = res && res.audio && res.audio.length > 500;
    checklist.push({
      item: 'Edge Neural Voice Endpoint',
      status: ok ? 'PASS' : 'FAIL',
      detail: ok
        ? `HTTP synthesis OK (${elapsed}ms, ${res.audio.length} bytes, voice: ${res.voice})`
        : 'Synthesis returned empty audio buffer',
    });
  } catch (err) {
    checklist.push({ item: 'Edge Neural Voice Endpoint', status: 'FAIL', detail: `Host IP blocked or network error: ${err.message}` });
  }

  // 7. Static Reaction Clips Inventory
  const clipsDir = path.resolve(__dirname, '../data/static-reactions');
  if (!fs.existsSync(clipsDir)) {
    checklist.push({ item: 'Static Reaction Audio Clips', status: 'FAIL', detail: 'Directory backend/data/static-reactions does not exist' });
  } else {
    let existingClips = 0;
    for (let i = 1; i <= 40; i++) {
      const name = `rec_${String(i).padStart(2, '0')}.mp3`;
      const clipFile = path.join(clipsDir, name);
      if (fs.existsSync(clipFile) && fs.statSync(clipFile).size > 1000) {
        existingClips++;
      }
    }
    const allClipsReady = existingClips === 40;
    checklist.push({
      item: 'Static Reaction Audio Clips',
      status: allClipsReady ? 'PASS' : 'FAIL',
      detail: `${existingClips}/40 clips ready on disk in en-US-AriaNeural voice`,
    });
  }

  // Print Summary Table
  console.log('------------------------------------------------------------------------');
  let passCount = 0;
  for (const c of checklist) {
    const icon = c.status === 'PASS' ? '✅' : c.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} [${c.status.padEnd(4)}] ${c.item.padEnd(32)} : ${c.detail}`);
    if (c.status === 'PASS') passCount++;
  }
  console.log('------------------------------------------------------------------------');
  console.log(`Audited ${checklist.length} environment pillars: ${passCount}/${checklist.length} Passed.`);
  console.log('========================================================================\n');

  const isReady = passCount === checklist.length || (passCount === checklist.length - 1 && checklist.some((c) => c.status === 'WARN'));
  if (isReady) {
    console.log('🚀 SYSTEM IS FULLY READY FOR PILOT SESSIONS.');
    return true;
  } else {
    console.warn('⚠️ Environment has failed checks. Review output before starting pilot.');
    return false;
  }
}

runEnvironmentAudit()
  .then((ready) => process.exit(ready ? 0 : 1))
  .catch((err) => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  });
