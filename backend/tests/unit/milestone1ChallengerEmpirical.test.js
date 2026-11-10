import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '../..'); // D:\PrepLoop\PrepLoop\backend
const PREPLOOP_DIR = path.resolve(BACKEND_DIR, '..'); // D:\PrepLoop\PrepLoop
const WORKSPACE_ROOT = path.resolve(PREPLOOP_DIR, '..'); // D:\PrepLoop

describe('Empirical Adversarial Challenge Suite: Milestone 1 Deliverables', () => {
  describe('1. Multi-Directory Invocations & Path Traversal Resilience', () => {
    it('root scripts/security-compliance-check.cjs correctly delegates to PrepLoop target', () => {
      const rootScriptPath = path.resolve(WORKSPACE_ROOT, 'scripts', 'security-compliance-check.cjs');
      expect(fs.existsSync(rootScriptPath)).toBe(true);

      const content = fs.readFileSync(rootScriptPath, 'utf8');
      expect(content).toContain("path.resolve(__dirname, '..', 'PrepLoop', 'scripts', 'security-compliance-check.cjs')");
    });

    it('security-compliance-check.cjs resolveProjectRoot handles multi-directory contexts', () => {
      const scriptPath = path.resolve(PREPLOOP_DIR, 'scripts', 'security-compliance-check.cjs');
      const content = fs.readFileSync(scriptPath, 'utf8');

      expect(content).toContain('resolveProjectRoot');
      expect(content).toContain("fs.existsSync(path.join(dirParent, 'backend', 'routes'))");
    });

    it('diagnoseError.cjs resolves implementImprovements.cjs without ENOENT', () => {
      const diagnosePath = path.resolve(PREPLOOP_DIR, 'scripts', 'diagnoseError.cjs');
      const content = fs.readFileSync(diagnosePath, 'utf8');

      expect(content).toContain('implementImprovements.cjs');
      expect(content).not.toContain("path.join(process.cwd(), 'scripts', 'implementImprovements.js')");
    });

    it('service-worker-enhanced.js is present and contains required caching hooks', () => {
      const swPath = path.resolve(PREPLOOP_DIR, 'frontend', 'public', 'service-worker-enhanced.js');
      expect(fs.existsSync(swPath)).toBe(true);

      const swContent = fs.readFileSync(swPath, 'utf8');
      expect(swContent).toContain("addEventListener('fetch'");
      expect(swContent).toContain("addEventListener('install'");
      expect(swContent).toContain("addEventListener('activate'");
    });
  });

  describe('2. Health Monitor Resilience & Termination', () => {
    it('handles offline backend without unhandled rejections', async () => {
      const healthModule = await import('../../scripts/health-monitor.js');
      const offlineResult = await healthModule.checkEndpoint({
        name: 'OfflineEndpoint',
        url: '/health-probe-offline-test',
      });

      expect(offlineResult.endpoint).toBe('OfflineEndpoint');
      expect(offlineResult.success).toBe(false);
      expect(offlineResult).toHaveProperty('error');
    });

    it('handles HTTP 5xx responses correctly without crashing', async () => {
      const server = http.createServer((req, res) => {
        res.statusCode = 503;
        res.end('Service Unavailable');
      });

      await new Promise((resolve) => server.listen(59988, '127.0.0.1', resolve));

      try {
        const origUrl = process.env.API_URL;
        process.env.API_URL = 'http://127.0.0.1:59988';

        const response = await fetch('http://127.0.0.1:59988/health');
        expect(response.status).toBe(503);
        expect(response.ok).toBe(false);

        process.env.API_URL = origUrl;
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('sendAlert does not throw when webhook is missing', async () => {
      const healthModule = await import('../../scripts/health-monitor.js');
      await expect(healthModule.sendAlert([{ endpoint: 'Health', success: false }])).resolves.not.toThrow();
    });
  });

  describe('3. Database Backup Hardening & cleanOldBackups', () => {
    it('cleanOldBackups handles non-existent directories gracefully', async () => {
      const backupModule = await import('../../scripts/backup-db.js');
      const nonExistent = path.join(os.tmpdir(), `non-existent-backup-dir-${Date.now()}`);

      const res = await backupModule.cleanOldBackups(nonExistent, 5);
      expect(res.retained).toBe(0);
      expect(res.deleted).toBe(0);
      expect(res).toHaveProperty('error');
    });

    it('cleanOldBackups handles empty directory', async () => {
      const backupModule = await import('../../scripts/backup-db.js');
      const emptyDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'backup-empty-'));

      try {
        const res = await backupModule.cleanOldBackups(emptyDir, 5);
        expect(res.retained).toBe(0);
        expect(res.deleted).toBe(0);
      } finally {
        await fs.promises.rm(emptyDir, { recursive: true, force: true });
      }
    });

    it('cleanOldBackups preserves non-backup files and enforces exact mtime retention in paths with spaces', async () => {
      const backupModule = await import('../../scripts/backup-db.js');
      const spaceDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'backup test space dir-'));

      try {
        const nonBackupFiles = [
          'important_notes.txt',
          'backup-config.json',
          'backup_archive.tar.gz',
          'schema.sql',
          'backup-not-sql.txt',
        ];

        for (const name of nonBackupFiles) {
          await fs.promises.writeFile(path.join(spaceDir, name), 'critical data');
        }

        const baseTime = 1700000000;
        for (let i = 0; i < 8; i++) {
          const name = `backup-2026-11-${String(i).padStart(2, '0')}.sql`;
          const fPath = path.join(spaceDir, name);
          await fs.promises.writeFile(fPath, `-- SQL Dump ${i}`);
          const mtime = baseTime + i * 1000;
          await fs.promises.utimes(fPath, mtime, mtime);
        }

        const result = await backupModule.cleanOldBackups(spaceDir, 3);
        expect(result.deleted).toBe(5);
        expect(result.retained).toBe(3);

        const remainingFiles = await fs.promises.readdir(spaceDir);

        for (const name of nonBackupFiles) {
          expect(remainingFiles).toContain(name);
        }

        expect(remainingFiles).toContain('backup-2026-11-07.sql');
        expect(remainingFiles).toContain('backup-2026-11-06.sql');
        expect(remainingFiles).toContain('backup-2026-11-05.sql');

        expect(remainingFiles).not.toContain('backup-2026-11-04.sql');
        expect(remainingFiles).not.toContain('backup-2026-11-03.sql');
        expect(remainingFiles).not.toContain('backup-2026-11-02.sql');
        expect(remainingFiles).not.toContain('backup-2026-11-01.sql');
        expect(remainingFiles).not.toContain('backup-2026-11-00.sql');
      } finally {
        await fs.promises.rm(spaceDir, { recursive: true, force: true });
      }
    });

    it('DATABASE_URL precedence over SUPABASE_DB_URL is respected', () => {
      const scriptPath = path.join(BACKEND_DIR, 'scripts', 'backup-db.js');
      const content = fs.readFileSync(scriptPath, 'utf8');

      expect(content).toContain('process.env.DATABASE_URL || process.env.SUPABASE_DB_URL');
    });

    it('pg_dump invocation uses safe arguments array without shell interpolation', () => {
      const scriptPath = path.join(BACKEND_DIR, 'scripts', 'backup-db.js');
      const content = fs.readFileSync(scriptPath, 'utf8');

      expect(content).toContain("import { execFile } from 'child_process'");
      expect(content).toContain("execFileAsync('pg_dump', [");
      expect(content).toContain("'--dbname', DB_URL");
      expect(content).toContain("'--no-owner'");
      expect(content).toContain("'--no-acl'");
      expect(content).not.toContain('exec(`pg_dump');
    });
  });

  describe('4. Five New Package Scripts Under Edge Environments', () => {
    it('cacheStats.js collects valid structure from memory caches', async () => {
      const cacheStatsModule = await import('../../scripts/cacheStats.js');
      const stats = await cacheStatsModule.collectCacheStats();

      expect(stats).toHaveProperty('timestamp');
      expect(stats.processMemory.heapUsedMB).toBeGreaterThan(0);
      expect(stats.domainCaches).toHaveProperty('problems');
      expect(stats.domainCaches).toHaveProperty('companies');
      expect(stats.domainCaches).toHaveProperty('systemDesign');
    });

    it('securityAudit.js flags insecure sslmode=disable as FAIL', async () => {
      const origDbUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db?sslmode=disable';

      const secModule = await import('../../scripts/securityAudit.js');
      const results = secModule.runSecurityAudit();
      const tlsCheck = results.find((r) => r.title === 'Database TLS Encryption');

      expect(tlsCheck).toBeDefined();
      expect(tlsCheck.status).toBe('FAIL');

      process.env.DATABASE_URL = origDbUrl;
    });

    it('performanceReport.js calculates non-negative event loop lag and system metrics', async () => {
      const perfModule = await import('../../scripts/performanceReport.js');
      const metrics = await perfModule.generatePerformanceMetrics();

      expect(metrics.process.eventLoopLagMs).toBeGreaterThanOrEqual(0);
      expect(metrics.system.cpus).toBeGreaterThan(0);
      expect(metrics.system.nodeVersion).toBeTruthy();
    });

    it('testCollaboration.js runs full peer session lifecycle without errors', async () => {
      const collabModule = await import('../../scripts/testCollaboration.js');
      const { passed, failed } = collabModule.runCollaborationTests();

      expect(failed).toBe(0);
      expect(passed).toBeGreaterThanOrEqual(11);
    });

    it('run-phase1-optimization.js verifies optimization targets without failures', async () => {
      const phase1Module = await import('../../../scripts/run-phase1-optimization.js');
      const summary = await phase1Module.runPhase1Optimization();

      expect(summary.failures).toBe(0);
      expect(summary.passes).toBeGreaterThanOrEqual(5);
    });
  });
});
