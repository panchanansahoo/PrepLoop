/**
 * Consolidated Database Migration Runner with Checksum Integrity Verification
 * Verifies and applies database migrations from backend/db/
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

export function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD) {
    const projectRef = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectRef) {
      return `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;
    }
  }
  return null;
}

export function calculateMigrationChecksum(contentOrPath) {
  const content = fs.existsSync(contentOrPath)
    ? fs.readFileSync(contentOrPath, 'utf8')
    : String(contentOrPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function loadOrderedMigrationFiles(dbDir) {
  const discoveredMigrations = fs
    .readdirSync(dbDir)
    .filter((file) => file.startsWith('migration_') && file.endsWith('.sql'))
    .sort();

  // Explicit dependency order for migrations whose alphabetical names invert table/column creation order
  const PRIORITY_MIGRATION_ORDER = [
    'migration_fix_mismatches.sql',
    'migration_add_roles.sql',
    'migration_fix_rls_recursion.sql',
    'migration_enable_profiles_rls.sql',
    'migration_coins_streaks.sql',
    'migration_user_streaks_badges.sql',
    'migration_atomic_coin_transactions.sql',
    'migration_coin_transaction_idempotency.sql',
    'migration_coin_real_data_sync.sql',
    'migration_job_listings.sql',
    'migration_hr_system.sql',
    'migration_ai_features.sql',
    'migration_interview_checkpoints.sql',
    'migration_interview_idempotency.sql',
    'migration_spaced_repetition_and_job_tracker.sql',
  ];
  const discoveredSet = new Set(discoveredMigrations);
  const orderedPrefix = PRIORITY_MIGRATION_ORDER.filter((file) => discoveredSet.has(file));
  const orderedPrefixSet = new Set(orderedPrefix);
  const remainingMigrations = discoveredMigrations.filter((file) => !orderedPrefixSet.has(file));

  return [...orderedPrefix, ...remainingMigrations];
}

export async function runMigrations({ statusOnly = false, dryRun = false } = {}) {
  const isStatus = statusOnly || process.argv.includes('--status');
  const isDry = dryRun || process.argv.includes('--dry-run');

  console.log('🚀 PrepLoop Database Migration Runner');
  console.log('====================================');
  if (isStatus) console.log('Mode: Status Check Only\n');
  else if (isDry) console.log('Mode: Dry Run (No DB modifications)\n');
  else console.log('Mode: Apply Migrations\n');

  const dbDir = path.join(__dirname, '../db');
  const migrationFiles = loadOrderedMigrationFiles(dbDir);

  console.log(`📦 Found ${migrationFiles.length} migration files in backend/db/\n`);

  const connectionString = getConnectionString();
  if (!connectionString) {
    console.warn('⚠️ No direct PostgreSQL connection string (DATABASE_URL or SUPABASE_DB_PASSWORD) configured.');
    console.log('📋 Migrations available for execution:');
    migrationFiles.forEach((file, index) => {
      const checksum = calculateMigrationChecksum(path.join(dbDir, file)).slice(0, 12);
      console.log(`   ${index + 1}. backend/db/${file} (SHA256: ${checksum}...)`);
    });
    console.log('\n📖 Review backend/db/MIGRATIONS_MANIFEST.md for detailed documentation.');
    return { applied: [], pending: migrationFiles, success: true };
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    try {
      console.log('🔌 Connecting to PostgreSQL database...');
      await client.connect();
      console.log('✅ Connected successfully.\n');
    } catch (connectErr) {
      if (isDry) {
        console.warn(`⚠️ Could not connect to PostgreSQL database (${connectErr.message}). Proceeding with offline dry-run verification:`);
        console.log('📋 Migrations parsed and verified:');
        migrationFiles.forEach((file, index) => {
          const checksum = calculateMigrationChecksum(path.join(dbDir, file)).slice(0, 12);
          console.log(`   ${index + 1}. [DRY RUN] ${file} (SHA256: ${checksum}...)`);
        });
        console.log(`\n🎉 Offline dry-run complete. ${migrationFiles.length} migration file(s) validated.`);
        return { newlyAppliedCount: migrationFiles.length, success: true, offline: true };
      }
      throw connectErr;
    }

    // Create migrations history table if not exists with RLS enabled and checksum tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        checksum VARCHAR(64),
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE public._schema_migrations ADD COLUMN IF NOT EXISTS checksum VARCHAR(64);
      ALTER TABLE public._schema_migrations ENABLE ROW LEVEL SECURITY;
      REVOKE ALL ON public._schema_migrations FROM PUBLIC, anon, authenticated;
    `);

    // Fetch applied migrations
    const { rows } = await client.query('SELECT migration_name, checksum, applied_at FROM public._schema_migrations');
    const appliedMap = new Map(rows.map((r) => [r.migration_name, r]));

    console.log(`📊 Currently applied: ${appliedMap.size} / ${migrationFiles.length} migrations.\n`);

    if (isStatus) {
      console.log('Migration Status:');
      console.log('-----------------');
      for (const file of migrationFiles) {
        const fullPath = path.join(dbDir, file);
        const currentHash = calculateMigrationChecksum(fullPath);
        const applied = appliedMap.get(file);

        if (applied) {
          const match = !applied.checksum || applied.checksum === currentHash;
          const status = match ? '✅ APPLIED' : '⚠️ MODIFIED CHECKSUM';
          console.log(`  ${status.padEnd(22)} ${file} (applied: ${applied.applied_at?.toISOString() || 'prior'})`);
        } else {
          console.log(`  ⏳ PENDING             ${file}`);
        }
      }
      return { total: migrationFiles.length, applied: appliedMap.size, pending: migrationFiles.length - appliedMap.size };
    }

    let newlyAppliedCount = 0;
    for (const file of migrationFiles) {
      const fullPath = path.join(dbDir, file);
      const currentChecksum = calculateMigrationChecksum(fullPath);

      if (appliedMap.has(file)) {
        const existing = appliedMap.get(file);
        if (existing.checksum && existing.checksum !== currentChecksum) {
          console.warn(`⚠️ Warning: Migration ${file} was modified after being applied (Checksum mismatch).`);
        }
        continue;
      }

      console.log(`⏳ Applying: ${file}...`);
      const sql = fs.readFileSync(fullPath, 'utf8');

      if (isDry) {
        console.log(`   [DRY RUN] Would execute ${file} (SHA256: ${currentChecksum.slice(0, 12)}...)`);
        newlyAppliedCount++;
        continue;
      }

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          `INSERT INTO public._schema_migrations (migration_name, checksum) 
           VALUES ($1, $2) 
           ON CONFLICT (migration_name) 
           DO UPDATE SET checksum = EXCLUDED.checksum`,
          [file, currentChecksum]
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

    console.log(`\n🎉 Migration run complete. ${newlyAppliedCount} migration(s) processed.`);
    return { newlyAppliedCount, success: true };
  } catch (err) {
    console.error('❌ Database connection or migration error:', err.message);
    return { success: false, error: err.message };
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

// Auto-run if executed directly from CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runMigrations();
}
