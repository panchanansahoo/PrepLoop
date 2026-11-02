/**
 * Consolidated Database Migration Runner
 * Verifies and applies database migrations from backend/db/
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

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD) {
    const projectRef = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectRef) {
      return `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;
    }
  }
  return null;
}

async function runMigrations() {
  console.log('🚀 PrepLoop Database Migration Runner');
  console.log('====================================\n');

  const dbDir = path.join(__dirname, '../db');
  const migrationFiles = fs
    .readdirSync(dbDir)
    .filter((file) => file.startsWith('migration_') && file.endsWith('.sql'))
    .sort();

  console.log(`📦 Found ${migrationFiles.length} migration files in backend/db/\n`);

  const connectionString = getConnectionString();
  if (!connectionString) {
    console.warn('⚠️ No direct PostgreSQL connection string (DATABASE_URL or SUPABASE_DB_PASSWORD) configured.');
    console.log('📋 Migrations available for manual execution in Supabase SQL Editor:');
    migrationFiles.forEach((file, index) => console.log(`   ${index + 1}. backend/db/${file}`));
    console.log('\n📖 Review backend/db/MIGRATIONS_MANIFEST.md for detailed documentation.');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully.\n');

    // Create migrations history table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Fetch applied migrations
    const { rows } = await client.query('SELECT migration_name FROM public._schema_migrations');
    const appliedSet = new Set(rows.map((r) => r.migration_name));

    console.log(`📊 Currently applied: ${appliedSet.size} / ${migrationFiles.length} migrations.\n`);

    let newlyAppliedCount = 0;
    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        continue;
      }

      console.log(`⏳ Applying: ${file}...`);
      const sql = fs.readFileSync(path.join(dbDir, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO public._schema_migrations (migration_name) VALUES ($1) ON CONFLICT DO NOTHING',
          [file]
        );
        await client.query('COMMIT');
        console.log(`   ✅ Success: ${file}`);
        newlyAppliedCount++;
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Failed to apply ${file}:`, migrationErr.message);
        console.error('   Aborting subsequent migrations to maintain consistency.');
        break;
      }
    }

    console.log(`\n🎉 Migration run complete. ${newlyAppliedCount} new migration(s) applied.`);
  } catch (err) {
    console.error('❌ Database connection or migration error:', err.message);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

runMigrations();

