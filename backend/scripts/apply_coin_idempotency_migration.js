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


const encodedPassword = encodeURIComponent(supabasePassword);
// Try connecting with IPv6 address directly
const connectionString = `postgres://postgres:${encodedPassword}@[2406:da1a:6b0:f617:81f2:4ae0:9be2:581d]:5432/postgres?sslmode=require`;

const migrationSql = readBackendFileUtf8('db/migration_coin_transaction_idempotency.sql');

// Verification queries
const verifyColumnSql = `
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'coin_transactions' AND column_name = 'reference_key'
LIMIT 1;
`;

const verifyIndexSql = `
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'coin_transactions' AND indexname LIKE '%reference_key%'
LIMIT 1;
`;

const verifyRpcSql = `
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'coin_apply_transaction'
LIMIT 1;
`;

async function run() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
  });

  try {
    console.log('🔄 Connecting to Supabase database...');
    const conn = await pool.connect();
    console.log('✅ Connected.');

    console.log('\n📋 Applying migration: coin transaction idempotency...');
    await conn.query(migrationSql);
    console.log('✅ Migration applied successfully.');

    console.log('\n🔍 Verifying migration...');
    
    const colResult = await conn.query(verifyColumnSql);
    if (colResult.rows.length > 0) {
      console.log('✅ reference_key column exists on coin_transactions.');
    } else {
      console.error('❌ reference_key column not found.');
    }

    const idxResult = await conn.query(verifyIndexSql);
    if (idxResult.rows.length > 0) {
      console.log(`✅ Index created: ${idxResult.rows[0].indexname}`);
    } else {
      console.error('❌ Index idx_coin_transactions_user_reference_key not found.');
    }

    const rpcResult = await conn.query(verifyRpcSql);
    if (rpcResult.rows.length > 0) {
      console.log('✅ coin_apply_transaction RPC function exists.');
    } else {
      console.error('❌ coin_apply_transaction RPC function not found.');
    }

    console.log('\n✅ All verifications passed! Coin transaction idempotency is active.');
    console.log('\n📝 You can now:');
    console.log('   • Test concurrent problem submissions to verify no duplicate coin awards');
    console.log('   • Test chat message retries to verify no duplicate refunds');
    console.log('   • Monitor coin_transactions table for reference_key values in new records');

    conn.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOENT') {
      console.error('   Migration file not found at: db/migration_coin_transaction_idempotency.sql');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
