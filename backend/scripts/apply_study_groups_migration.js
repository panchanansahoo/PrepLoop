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

const _host = `db.${ref}.supabase.co`;
const encodedPassword = encodeURIComponent(supabasePassword);
const connectionString = `postgres://postgres:${encodedPassword}@[2406:da1a:6b0:f617:81f2:4ae0:9be2:581d]:5432/postgres?sslmode=require`;

const migrationSql = readBackendFileUtf8('db/migration_study_groups.sql');

const verifySql = `
SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'study_groups'
  ) AS study_groups_table_exists,
  (
    SELECT COUNT(*)::int
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'study_groups'
  ) AS study_groups_index_count;
`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  let client;
  try {
    console.log(`Connecting to \${host}...`);
    client = await pool.connect();

    console.log('Applying study groups migration...');
    await client.query(migrationSql);

    console.log('Verifying study groups migration...');
    const result = await client.query(verifySql);
    const verification = result.rows?.[0] || {};

    const hasTable = verification.study_groups_table_exists === true;
    const _indexCount = Number(verification.study_groups_index_count || 0);

    if (!hasTable) {
      console.error('Verification failed: study_groups table was not found.');
      process.exitCode = 1;
      return;
    }

    console.log('Migration verification succeeded.');
    console.log(`study_groups table: \${hasTable ? 'present' : 'missing'}`);
    console.log(`study_groups indexes: \${indexCount}`);
  } catch (error) {
    console.error('Failed to apply study groups migration:', error);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
