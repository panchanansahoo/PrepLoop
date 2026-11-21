import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  calculateMigrationChecksum,
  loadOrderedMigrationFiles,
  getConnectionString,
} from '../../scripts/runMigrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Migration Runner with Checksum Tracking', () => {
  it('computes deterministic SHA256 checksums from string and file content', () => {
    const hash1 = calculateMigrationChecksum('SELECT 1;');
    const hash2 = calculateMigrationChecksum('SELECT 1;');
    const hash3 = calculateMigrationChecksum('SELECT 2;');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('loads discovered migrations with dependency priority order maintained', () => {
    const dbDir = path.join(__dirname, '../../db');
    const files = loadOrderedMigrationFiles(dbDir);

    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(30);

    // Verify key foundational migrations appear before feature migrations
    const fixMismatchesIdx = files.indexOf('migration_fix_mismatches.sql');
    const hrSystemIdx = files.indexOf('migration_hr_system.sql');
    const rlsSecurityIdx = files.indexOf('migration_rls_security_hardening.sql');

    expect(fixMismatchesIdx).toBeGreaterThanOrEqual(0);
    expect(hrSystemIdx).toBeGreaterThan(fixMismatchesIdx);
    expect(rlsSecurityIdx).toBeGreaterThan(hrSystemIdx);
  });

  it('retrieves database connection string from environment safely', () => {
    const connStr = getConnectionString();
    if (process.env.DATABASE_URL) {
      expect(connStr).toBe(process.env.DATABASE_URL);
    } else {
      expect(typeof connStr === 'string' || connStr === null).toBe(true);
    }
  });
});
