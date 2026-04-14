import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
const BACKEND_ROOT = path.resolve(__dirname, '..');

function readBackendFileUtf8(relativePath) {
  const resolvedPath = path.resolve(BACKEND_ROOT, relativePath);
  if (!(resolvedPath === BACKEND_ROOT || resolvedPath.startsWith(`${BACKEND_ROOT}${path.sep}`))) {
    throw new Error(`Unsafe file path: ${relativePath}`);
  }
  return fs.readFileSync(resolvedPath, 'utf8');
}

const { Pool } = pg;

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !supabasePassword) {
  console.error('Missing SUPABASE_URL or SUPABASE_DB_PASSWORD in backend/.env');
  process.exit(1);
}

let ref = '';
try {
  const parsedUrl = new URL(supabaseUrl);
  ref = parsedUrl.hostname.split('.')[0];
} catch {
  console.error('Invalid SUPABASE_URL format in backend/.env');
  process.exit(1);
}

if (!ref) {
  console.error('Unable to extract Supabase project ref from SUPABASE_URL');
  process.exit(1);
}

const host = `db.${ref}.supabase.co`;
const encodedPassword = encodeURIComponent(supabasePassword);
const connectionString = `postgres://postgres:${encodedPassword}@${host}:5432/postgres`;

const migrationSql = readBackendFileUtf8('db/migration_quiz_feature.sql');

const verifySql = `
SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'quiz_attempts'
  ) AS quiz_attempts_table_exists,
  (
    SELECT COUNT(*)::int
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'quiz_attempts'
  ) AS quiz_attempts_index_count;
`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  let client;
  try {
    console.log(`Connecting to ${host}...`);
    client = await pool.connect();

    console.log('Applying quiz feature migration...');
    await client.query(migrationSql);

    console.log('Verifying quiz feature migration...');
    const result = await client.query(verifySql);
    const verification = result.rows?.[0] || {};

    const hasTable = verification.quiz_attempts_table_exists === true;
    const indexCount = Number(verification.quiz_attempts_index_count || 0);

    if (!hasTable) {
      console.error('Verification failed: quiz_attempts table was not found.');
      process.exitCode = 1;
      return;
    }

    console.log('Migration verification succeeded.');
    console.log(`quiz_attempts table: ${hasTable ? 'present' : 'missing'}`);
    console.log(`quiz_attempts indexes: ${indexCount}`);
  } catch (error) {
    console.error('Failed to apply quiz feature migration:', error);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
