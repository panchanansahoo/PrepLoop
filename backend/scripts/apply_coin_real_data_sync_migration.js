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

const migrationSql = readBackendFileUtf8('db/migration_coin_real_data_sync.sql');

const verifyColumnsSql = `
SELECT table_name, column_name
FROM information_schema.columns
WHERE (table_name = 'profiles' AND column_name = 'coins')
   OR (table_name = 'coin_transactions' AND column_name IN ('reference_key', 'created_at'))
ORDER BY table_name, column_name;
`;

const verifyBalanceSanitySql = `
SELECT COUNT(*)::int AS negative_profiles
FROM profiles
WHERE coins < 0;
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
    console.log('Connected. Applying coin real-data sync migration...');

    await client.query(migrationSql);
    console.log('Migration applied. Running verification...');

    const columnsResult = await client.query(verifyColumnsSql);
    const sanityResult = await client.query(verifyBalanceSanitySql);

    console.log('Verified columns:');
    console.log(JSON.stringify(columnsResult.rows, null, 2));

    const negativeProfiles = sanityResult.rows[0]?.negative_profiles ?? 0;
    if (negativeProfiles > 0) {
      console.warn(`WARNING: Found ${negativeProfiles} profiles with negative coin balances.`);
      process.exitCode = 1;
    } else {
      console.log('SUCCESS: No negative profile balances found.');
    }
  } catch (error) {
    console.error('Failed to apply coin real-data sync migration:', error);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
