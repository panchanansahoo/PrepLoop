/**
 * Database Optimization Script
 * Applies high-frequency query indexes from backend/db/migration_core_query_indexes.sql
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function runOptimization() {
  console.log('🚀 Running database optimization & query index verification...\n');

  const sqlPath = path.join(__dirname, '../db/migration_core_query_indexes.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Migration file not found:', sqlPath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Determine connection string
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString && process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD) {
    const projectRef = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectRef) {
      connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;
    }
  }

  if (!connectionString) {
    console.warn('⚠️ No direct PostgreSQL connection string (DATABASE_URL or SUPABASE_DB_PASSWORD) found.');
    console.log('📋 You can copy and execute the following SQL in your Supabase SQL Editor:\n');
    console.log(sqlContent);
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await client.query(statement);
        const indexNameMatch = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i);
        const indexName = indexNameMatch ? indexNameMatch[1] : 'index';
        console.log(`  ✅ Verified / Applied: ${indexName}`);
      } catch (err) {
        console.warn(`  ⚠️ Warning on statement: ${err.message}`);
      }
    }

    console.log('\n🎉 Database query index optimization complete!');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.log('\n📋 Fallback SQL to execute manually in Supabase SQL Editor:\n');
    console.log(sqlContent);
  } finally {
    await client.end().catch(() => {});
  }
}

runOptimization();

