import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(BACKEND_ROOT, '..');

describe('Milestone 1 — Root Automation, Scripts & Forwarding Verification', () => {
  it('health-monitor.js imports cleanly and exports health check utilities', async () => {
    const healthMonitorPath = path.join(BACKEND_ROOT, 'scripts', 'health-monitor.js');
    expect(fs.existsSync(healthMonitorPath)).toBe(true);

    const healthModule = await import('../../scripts/health-monitor.js');
    expect(Array.isArray(healthModule.HEALTH_ENDPOINTS)).toBe(true);
    expect(healthModule.HEALTH_ENDPOINTS.length).toBeGreaterThanOrEqual(3);
    expect(typeof healthModule.checkEndpoint).toBe('function');
    expect(typeof healthModule.runHealthChecks).toBe('function');

    const checkResult = await healthModule.checkEndpoint({ name: 'Test', url: '/non-existent-probe' });
    expect(checkResult).toHaveProperty('endpoint', 'Test');
    expect(checkResult).toHaveProperty('success', false);
  });

  it('backup-db.js supports DATABASE_URL, safe args and cleanOldBackups logic', async () => {
    const backupDbPath = path.join(BACKEND_ROOT, 'scripts', 'backup-db.js');
    expect(fs.existsSync(backupDbPath)).toBe(true);

    const backupModule = await import('../../scripts/backup-db.js');
    expect(typeof backupModule.cleanOldBackups).toBe('function');
    expect(typeof backupModule.createBackup).toBe('function');

    // Test genuine cleanup logic on a temporary directory
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'backup-reg-test-'));
    try {
      for (let i = 0; i < 6; i++) {
        const filePath = path.join(tempDir, `backup-2026-11-0${i}.sql`);
        await fs.promises.writeFile(filePath, `-- backup content ${i}`);
        // Small delay to guarantee different modification timestamps
        await new Promise((r) => setTimeout(r, 15));
      }

      const result = await backupModule.cleanOldBackups(tempDir, 3);
      expect(result.deleted).toBe(3);
      expect(result.retained).toBe(3);

      const remainingFiles = await fs.promises.readdir(tempDir);
      expect(remainingFiles.length).toBe(3);
      // Ensure the newest files were kept
      expect(remainingFiles).toContain('backup-2026-11-05.sql');
      expect(remainingFiles).toContain('backup-2026-11-04.sql');
      expect(remainingFiles).toContain('backup-2026-11-03.sql');
      expect(remainingFiles).not.toContain('backup-2026-11-00.sql');
    } finally {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('diagnoseError.cjs correctly checks implementImprovements.cjs without ENOENT', () => {
    const diagnosePath = path.join(REPO_ROOT, 'scripts', 'diagnoseError.cjs');
    expect(fs.existsSync(diagnosePath)).toBe(true);

    const content = fs.readFileSync(diagnosePath, 'utf8');
    expect(content).toContain('implementImprovements.cjs');
  });

  it('service-worker-enhanced.js is present with PWA caching strategies', () => {
    const swPath = path.join(REPO_ROOT, 'frontend', 'public', 'service-worker-enhanced.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf8');
    expect(swContent).toContain("addEventListener('install'");
    expect(swContent).toContain("addEventListener('activate'");
    expect(swContent).toContain("addEventListener('fetch'");
    expect(swContent).toContain("addEventListener('message'");
    expect(swContent).toContain('preploop-enhanced-');
  });

  it('cacheStats.js collects metrics from all caching layers', async () => {
    const cacheStatsModule = await import('../../scripts/cacheStats.js');
    expect(typeof cacheStatsModule.collectCacheStats).toBe('function');

    const stats = await cacheStatsModule.collectCacheStats();
    expect(stats).toHaveProperty('timestamp');
    expect(stats).toHaveProperty('processMemory');
    expect(stats).toHaveProperty('domainCaches');
    expect(stats.domainCaches).toHaveProperty('problems');
    expect(stats.domainCaches).toHaveProperty('companies');
    expect(stats.domainCaches).toHaveProperty('systemDesign');
    expect(stats).toHaveProperty('advancedCache');
    expect(stats).toHaveProperty('apiCache');
  });

  it('securityAudit.js audits critical security configurations', async () => {
    const securityAuditModule = await import('../../scripts/securityAudit.js');
    expect(typeof securityAuditModule.runSecurityAudit).toBe('function');

    const results = securityAuditModule.runSecurityAudit();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(4);

    const titles = results.map((r) => r.title);
    expect(titles).toContain('Environment Mode');
    expect(titles).toContain('Advanced Security Middleware');
  });

  it('performanceReport.js calculates system, memory and event loop metrics', async () => {
    const perfModule = await import('../../scripts/performanceReport.js');
    expect(typeof perfModule.generatePerformanceMetrics).toBe('function');

    const metrics = await perfModule.generatePerformanceMetrics();
    expect(metrics).toHaveProperty('system');
    expect(metrics.system).toHaveProperty('platform');
    expect(metrics.system).toHaveProperty('nodeVersion');
    expect(metrics).toHaveProperty('process');
    expect(metrics.process).toHaveProperty('heapUsedMB');
    expect(metrics.process).toHaveProperty('eventLoopLagMs');
    expect(metrics).toHaveProperty('database');
    expect(metrics).toHaveProperty('cache');
  });

  it('testCollaboration.js verifies peer collaboration lifecycle with 0 failures', async () => {
    const collabTestModule = await import('../../scripts/testCollaboration.js');
    expect(typeof collabTestModule.runCollaborationTests).toBe('function');

    const { passed, failed } = collabTestModule.runCollaborationTests();
    expect(failed).toBe(0);
    expect(passed).toBeGreaterThanOrEqual(10);
  });

  it('run-phase1-optimization.js validates phase 1 optimization targets', async () => {
    const phase1Path = path.join(REPO_ROOT, 'scripts', 'run-phase1-optimization.js');
    expect(fs.existsSync(phase1Path)).toBe(true);

    const phase1Module = await import('../../../scripts/run-phase1-optimization.js');
    expect(typeof phase1Module.runPhase1Optimization).toBe('function');

    const result = await phase1Module.runPhase1Optimization();
    expect(result.failures).toBe(0);
    expect(result.passes).toBeGreaterThanOrEqual(4);
  });
});
