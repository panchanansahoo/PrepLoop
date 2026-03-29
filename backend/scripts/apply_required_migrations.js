import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import '../config/env.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSql(fileName) {
  const fullPath = path.join(__dirname, '..', 'db', fileName);
  return fs.readFileSync(fullPath, 'utf-8');
}

function buildIdempotentCoinsPoliciesSql() {
  return `
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_interviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'coin_transactions' AND policyname = 'Users can view own coin transactions'
  ) THEN
    CREATE POLICY "Users can view own coin transactions"
    ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can view own chat messages'
  ) THEN
    CREATE POLICY "Users can view own chat messages"
    ON chat_messages FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'interview_slots' AND policyname = 'Anyone can view available slots'
  ) THEN
    CREATE POLICY "Anyone can view available slots"
    ON interview_slots FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'real_interviews' AND policyname = 'Users can view own interviews'
  ) THEN
    CREATE POLICY "Users can view own interviews"
    ON real_interviews FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
`;
}

function stripPolicySection(sql) {
  const marker = '-- 6. RLS policies';
  const idx = sql.indexOf(marker);
  if (idx === -1) return sql;
  return sql.slice(0, idx);
}

async function execSql(query) {
  let result = await supabaseAdmin.rpc('exec_sql', { query });

  if (!result.error) {
    return result;
  }

  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 404 && body.includes('PGRST202')) {
      throw new Error('EXEC_SQL_UNAVAILABLE');
    }
    throw new Error(`exec_sql failed: HTTP ${response.status} ${body}`);
  }

  return { data: await response.text(), error: null };
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  }

  const emailSql = readSql('migration_email_verification.sql');
  const coinsSqlRaw = readSql('migration_coins_streaks.sql');
  const coinsSqlWithoutPolicies = stripPolicySection(coinsSqlRaw);

  const finalSql = [
    '-- Apply email verification migration',
    emailSql,
    '-- Apply coins/chat/interview core schema (without raw policy creation)',
    coinsSqlWithoutPolicies,
    '-- Apply policies idempotently',
    buildIdempotentCoinsPoliciesSql(),
  ].join('\n\n');

  await execSql(finalSql);

  console.log('✅ Required migrations applied successfully.');
}

main().catch((err) => {
  if (err.message === 'EXEC_SQL_UNAVAILABLE') {
    console.error('⚠️  Automatic SQL execution is not available on this Supabase project.');
    console.error('Run this file in Supabase SQL Editor and rerun smoke tests:');
    console.error('backend/db/migration_required_bundle.sql');
    process.exit(2);
  }
  console.error('❌ Migration apply failed:', err.message);
  process.exit(1);
});
