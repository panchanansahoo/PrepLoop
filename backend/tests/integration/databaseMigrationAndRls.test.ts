import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Database Migrations, Indexes & RLS Security Contracts', () => {
  const dbDir = path.resolve(__dirname, '../../db');

  it('verifies all registered SQL migrations in manifest exist and are non-empty', () => {
    const manifestPath = path.join(dbDir, 'MIGRATIONS_MANIFEST.md');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf8');
    const sqlMatches = content.match(/migration_[a-z0-9_]+\.sql/g) || [];
    const uniqueFiles = Array.from(new Set(sqlMatches));
    expect(uniqueFiles.length).toBeGreaterThan(30);

    for (const sqlFile of uniqueFiles) {
      const filePath = path.join(dbDir, sqlFile);
      expect(fs.existsSync(filePath), `Missing SQL migration: ${sqlFile}`).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(0);
    }
  });

  it('verifies Row-Level Security (RLS) policies exist for multi-tenant data isolation', () => {
    const rlsFile = path.join(dbDir, 'migration_rls_security_hardening.sql');
    const profileRlsFile = path.join(dbDir, 'migration_enable_profiles_rls.sql');
    expect(fs.existsSync(rlsFile)).toBe(true);
    expect(fs.existsSync(profileRlsFile)).toBe(true);
    const sql = `${fs.readFileSync(rlsFile, 'utf8')}\n${fs.readFileSync(profileRlsFile, 'utf8')}`;

    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY');
    expect(sql).toContain('auth.uid()');

    // Verify key sensitive tables are protected
    const sensitiveTables = [
      'profiles',
      'peer_interview_rooms',
      'community_challenges',
      'challenge_submissions',
      'api_keys',
      'webhook_subscriptions',
      'user_streaks',
      'user_badges',
    ];

    for (const table of sensitiveTables) {
      expect(
        sql.includes(table),
        `Expected RLS security hardening migration to configure policies for ${table}`
      ).toBe(true);
    }
  });

  it('verifies core query indexes cover high-frequency problem and interview lookups', () => {
    const v1Path = path.join(dbDir, 'migration_core_query_indexes.sql');
    const v2Path = path.join(dbDir, 'migration_core_query_indexes_v2.sql');

    expect(fs.existsSync(v1Path)).toBe(true);
    expect(fs.existsSync(v2Path)).toBe(true);

    const v1 = fs.readFileSync(v1Path, 'utf8');
    const v2 = fs.readFileSync(v2Path, 'utf8');
    const combined = `${v1}\n${v2}`;

    expect(combined).toContain('idx_mock_interviews_user_started');
    expect(combined).toContain('idx_mock_interviews_user_type');
    expect(combined).toContain('idx_user_progress_user_status');
    expect(combined).toContain('idx_problems_difficulty_pattern');
    expect(combined).toContain('idx_submissions_user_problem');
    expect(combined).toContain('idx_profiles_subscription_tier');
    expect(combined).toContain('idx_submissions_submitted_at');
  });

  it('verifies atomic coin transactions and idempotency constraints are declared', () => {
    const atomicPath = path.join(dbDir, 'migration_atomic_coin_transactions.sql');
    const idempotencyPath = path.join(dbDir, 'migration_coin_transaction_idempotency.sql');

    expect(fs.existsSync(atomicPath)).toBe(true);
    expect(fs.existsSync(idempotencyPath)).toBe(true);

    const atomicSql = fs.readFileSync(atomicPath, 'utf8');
    const idempotencySql = fs.readFileSync(idempotencyPath, 'utf8');

    expect(atomicSql).toContain('coin_transactions');
    expect(idempotencySql).toContain('reference_key');
  });
});
