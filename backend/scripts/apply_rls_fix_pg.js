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

const migrationSql = readBackendFileUtf8('db/migration_fix_rls_recursion.sql');

const verifyPoliciesSql = `
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
`;

const verifyRlsSql = `
SELECT c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'profiles';
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
    console.log('Connected. Applying RLS fix migration...');

    await client.query('BEGIN');
    await client.query(migrationSql);
    await client.query('COMMIT');

    console.log('Migration applied. Verifying profiles policies...');
    const { rows } = await client.query(verifyPoliciesSql);
    const rlsResult = await client.query(verifyRlsSql);
    const rlsEnabled = rlsResult.rows[0]?.rls_enabled;

    if (rows.length) {
      console.log('WARNING: Policies still present on profiles:');
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log('SUCCESS: No policies remain on profiles table.');
    }

    if (rlsEnabled === false) {
      console.log('SUCCESS: RLS is disabled on profiles table.');
    } else if (rlsEnabled === true) {
      console.log('WARNING: RLS is still enabled on profiles table.');
      process.exitCode = 1;
    } else {
      console.log('WARNING: Could not verify RLS state for profiles table.');
      process.exitCode = 1;
    }
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
    console.error('Failed to apply RLS fix via pg:', error);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
