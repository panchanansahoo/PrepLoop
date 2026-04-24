import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:/Users/panch/Desktop/Preploop/backend/.env') });

const connectionString = `postgres://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@[2406:da1a:6b0:f617:81f2:4ae0:9be2:581d]:5432/postgres?sslmode=require`;

const { Pool } = pg;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS skills TEXT,
      ADD COLUMN IF NOT EXISTS experience_summary TEXT,
      ADD COLUMN IF NOT EXISTS preferred_role TEXT,
      ADD COLUMN IF NOT EXISTS preferred_location TEXT;
    `);
    console.log('Successfully added columns to profiles table');
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}
run();
