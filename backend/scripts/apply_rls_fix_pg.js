import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !supabasePassword) {
  console.error('Missing SUPABASE_URL or SUPABASE_DB_PASSWORD in backend/.env');
  process.exit(1);
}

const ref = supabaseUrl.split('//')[1].split('.')[0];
const host = `db.${ref}.supabase.co`;
const encodedPassword = encodeURIComponent(supabasePassword);
const connectionString = `postgres://postgres:${encodedPassword}@${host}:5432/postgres`;

const migrationPath = path.join(__dirname, '../db/migration_fix_rls_recursion.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

const verifySql = `
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
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
    const { rows } = await client.query(verifySql);

    if (!rows.length) {
      console.log('SUCCESS: No policies remain on profiles table.');
    } else {
      console.log('WARNING: Policies still present on profiles:');
      console.log(JSON.stringify(rows, null, 2));
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
