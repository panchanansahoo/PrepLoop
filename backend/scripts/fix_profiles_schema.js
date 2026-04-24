import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const url = new URL(process.env.SUPABASE_URL);
const ref = url.hostname.split('.')[0];
const host = `db.${ref}.supabase.co`;

const connectionString = `postgres://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${host}:5432/postgres?sslmode=require`;

console.log('Connecting to', host);

const { Pool } = pg;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('Connected!');
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS skills TEXT,
      ADD COLUMN IF NOT EXISTS experience_summary TEXT,
      ADD COLUMN IF NOT EXISTS preferred_role TEXT,
      ADD COLUMN IF NOT EXISTS preferred_location TEXT;
    `);
    console.log('Successfully added columns to profiles table');
    client.release();
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}
run();
