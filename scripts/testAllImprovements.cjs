#!/usr/bin/env node

/**
 * Comprehensive Test Suite for All Improvements
 * Tests all 17 new files and their integrations
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class ImprovementTester {
  constructor() {
    this.rootDir = join(__dirname, '..');
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    };
  }

  async runAllTests() {
    log('\n🧪 PrepLoop Improvements - Comprehensive Test Suite\n', 'cyan');
    log('═'.repeat(70), 'blue');

    try {
      await this.testFileExistence();
      await this.testBackendUtils();
      await this.testBackendServices();
      await this.testBackendMiddleware();
      await this.testFrontendUtils();
      await this.testDocumentation();
      
      this.printSummary();
    } catch (error) {
      log(`\n❌ Test suite failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async testFileExistence() {
    log('\n📁 Test 1: File Existence Check', 'blue');
    log('─'.repeat(70), 'blue');

    const files = [
      // Backend Utils
      'backend/utils/advancedCache.js',
      'backend/utils/databaseOptimizer.js',
      'backend/utils/apiDocGenerator.js',
      'backend/utils/errorTracker.js',
      
      // Backend Services
      'backend/services/spacedRepetitionService.js',
      'backend/services/collaborationService.js',
      
      // Backend Middleware
      'backend/middleware/advancedSecurity.js',
      
      // Frontend Utils
      'frontend/src/utils/lazyLoading.js',
      'frontend/src/utils/performanceMonitor.js',
      'frontend/src/utils/seo.js',
      'frontend/src/utils/analytics.js',
      
      // Frontend PWA
      'frontend/public/service-worker-enhanced.js',
      
      // Tests
      'frontend/tests/e2e/critical-flows.spec.js',
      
      // Documentation
      'docs/COMPREHENSIVE_IMPROVEMENTS.md',
      'COMPLETE_IMPROVEMENTS_SUMMARY.md',
      'QUICK_REFERENCE_CARD.md',
      'ARCHITECTURE_DIAGRAM.md',
    ];

    for (const file of files) {
      const filePath = join(this.rootDir, file);
      const exists = fs.existsSync(filePath);
      
      this.recordTest(
        `File exists: ${file}`,
        exists,
        exists ? null : `File not found: ${filePath}`
      );
    }
  }

  async testBackendUtils() {
    log('\n🔧 Test 2: Backend Utils - Module Loading', 'blue');
    log('─'.repeat(70), 'blue');

    // Test Advanced Cache
    await this.testModule('advancedCache', async () => {
      const { default: cache } = await import('../backend/utils/advancedCache.js');
      
      // Test basic operations
      await cache.set('test-key', 'test-value', 60);
      const value = await cache.get('test-key');
      
      if (value !== 'test-value') {
        throw new Error('Cache get/set failed');
      }

      // Test stats
      const stats = cache.getStats();
      if (!stats.hitRate) {
        throw new Error('Cache stats not available');
      }

      await cache.delete('test-key');
      return true;
    });

    // Test Database Optimizer
    await this.testModule('databaseOptimizer', async () => {
      const { default: optimizer } = await import('../backend/utils/databaseOptimizer.js');
      
      // Check if methods exist
      if (typeof optimizer.executeQuery !== 'function') {
        throw new Error('executeQuery method not found');
      }
      
      if (typeof optimizer.getQueryStats !== 'function') {
        throw new Error('getQueryStats method not found');
      }

      return true;
    });

    // Test API Doc Generator
    await this.testModule('apiDocGenerator', async () => {
      const { default: APIDocGenerator } = await import('../backend/utils/apiDocGenerator.js');
      
      const generator = new APIDocGenerator();
      if (typeof generator.generate !== 'function') {
        throw new Error('generate method not found');
      }

      return true;
    });

    // Test Error Tracker
    await this.testModule('errorTracker', async () => {
      const { default: tracker } = await import('../backend/utils/errorTracker.js');
      
      // Test error capture
      const testError = new Error('Test error');
      const errorId = tracker.captureError(testError, { test: true });
      
      if (!errorId) {
        throw new Error('Error capture failed');
      }

      // Test stats
      const stats = tracker.getStats();
      if (stats.total === 0) {
        throw new Error('Error stats not working');
      }

      return true;
    });
  }

  async testBackendServices() {
    log('\n⚙️  Test 3: Backend Services - Module Loading', 'blue');
    log('─'.repeat(70), 'blue');

    // Test Spaced Repetition Service
    await this.testModule('spacedRepetitionService', async () => {
      const { default: srs } = await import('../backend/services/spacedRepetitionService.js');
      
      // Test card calculation
      const card = {
        easinessFactor: 2.5,
        repetitions: 0,
        interval: 0,
      };
      
      const updated = srs.calculateNextReview(card, 4);
      
      if (!updated.nextReview) {
        throw new Error('Next review date not calculated');
      }

      // Test due problems
      const cards = [card];
      const due = srs.getDueProblems(cards);
      
      if (!Array.isArray(due)) {
        throw new Error('getDueProblems not returning array');
      }

      return true;
    });

    // Test Collaboration Service
    await this.testModule('collaborationService', async () => {
      const { default: collab } = await import('../backend/services/collaborationService.js');
      
      if (typeof collab.createSession !== 'function') {
        throw new Error('createSession method not found');
      }

      if (typeof collab.getStatistics !== 'function') {
        throw new Error('getStatistics method not found');
      }

      return true;
    });
  }

  async testBackendMiddleware() {
    log('\n🛡️  Test 4: Backend Middleware - Security', 'blue');
    log('─'.repeat(70), 'blue');

    await this.testModule('advancedSecurity', async () => {
      const { default: security } = await import('../backend/middleware/advancedSecurity.js');
      
      // Check all security methods exist
      const methods = [
        'createAdaptiveRateLimiter',
        'bruteForceProtection',
        'sqlInjectionProtection',
        'xssProtection',
        'csrfProtection',
        'ipBlocker',
        'securityHeaders',
      ];

      for (const method of methods) {
        if (typeof security[method] !== 'function') {
          throw new Error(`${method} method not found`);
        }
      }

      // Test stats
      const stats = security.getSecurityStats();
      if (typeof stats.totalEvents !== 'number') {
        throw new Error('Security stats not working');
      }

      return true;
    });
  }

  async testFrontendUtils() {
    log('\n🎨 Test 5: Frontend Utils - Module Structure', 'blue');
    log('─'.repeat(70), 'blue');

    // Test file structure (can't import in Node without DOM)
    const frontendFiles = [
      'frontend/src/utils/lazyLoading.js',
      'frontend/src/utils/performanceMonitor.js',
      'frontend/src/utils/seo.js',
      'frontend/src/utils/analytics.js',
    ];

    for (const file of frontendFiles) {
      const filePath = join(this.rootDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for key exports
      const hasExports = content.includes('export') || content.includes('export default');
      
      this.recordTest(
        `Frontend util has exports: ${file}`,
        hasExports,
        hasExports ? null : 'No exports found'
      );

      // Check for proper structure
      const hasClass = content.includes('class ') || content.includes('function ');
      
      this.recordTest(
        `Frontend util has proper structure: ${file}`,
        hasClass,
        hasClass ? null : 'No class or function found'
      );
    }
  }

  async testDocumentation() {
    log('\n📚 Test 6: Documentation - Content Validation', 'blue');
    log('─'.repeat(70), 'blue');

    const docs = [
      {
        file: 'docs/COMPREHENSIVE_IMPROVEMENTS.md',
        requiredSections: ['Overview', 'Performance', 'Security', 'Usage'],
      },
      {
        file: 'COMPLETE_IMPROVEMENTS_SUMMARY.md',
        requiredSections: ['Executive Summary', 'Key Metrics', 'Installation'],
      },
      {
        file: 'QUICK_REFERENCE_CARD.md',
        requiredSections: ['Quick Start', 'Code Snippets', 'NPM Scripts'],
      },
      {
        file: 'ARCHITECTURE_DIAGRAM.md',
        requiredSections: ['FRONTEND LAYER', 'BACKEND LAYER', 'SECURITY LAYER'],
      },
    ];

    for (const doc of docs) {
      const filePath = join(this.rootDir, doc.file);
      
      if (!fs.existsSync(filePath)) {
        this.recordTest(`Documentation exists: ${doc.file}`, false, 'File not found');
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      for (const section of doc.requiredSections) {
        const hasSection = content.includes(section);
        this.recordTest(
          `Doc has section "${section}": ${doc.file}`,
          hasSection,
          hasSection ? null : `Section "${section}" not found`
        );
      }
    }
  }

  async testModule(name, testFn) {
    try {
      await testFn();
      this.recordTest(`Module loads: ${name}`, true);
    } catch (error) {
      this.recordTest(`Module loads: ${name}`, false, error.message);
    }
  }

  recordTest(name, passed, error = null) {
    const result = {
      name,
      passed,
      error,
    };

    this.results.tests.push(result);

    if (passed) {
      this.results.passed++;
      log(`  ✅ ${name}`, 'green');
    } else {
      this.results.failed++;
      log(`  ❌ ${name}`, 'red');
      if (error) {
        log(`     Error: ${error}`, 'red');
      }
    }
  }

  printSummary() {
    log('\n' + '═'.repeat(70), 'blue');
    log('\n📊 Test Summary', 'cyan');
    log('─'.repeat(70), 'blue');

    const total = this.results.passed + this.results.failed + this.results.skipped;
    const passRate = ((this.results.passed / total) * 100).toFixed(1);

    log(`\nTotal Tests: ${total}`);
    log(`✅ Passed: ${this.results.passed}`, 'green');
    log(`❌ Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'reset');
    log(`⏭️  Skipped: ${this.results.skipped}`, 'yellow');
    log(`\n📈 Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : 'yellow');

    if (this.results.failed === 0) {
      log('\n🎉 All tests passed! Improvements are working correctly.', 'green');
      log('\n📋 Next Steps:', 'cyan');
      log('  1. Run: npm run dev', 'blue');
      log('  2. Check: http://localhost:5000/health', 'blue');
      log('  3. Test: npm run cache:stats', 'blue');
      log('  4. Review: COMPLETE_IMPROVEMENTS_SUMMARY.md\n', 'blue');
    } else {
      log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
      log('\n🔧 Troubleshooting:', 'cyan');
      log('  1. Ensure all files are created', 'blue');
      log('  2. Check file permissions', 'blue');
      log('  3. Verify Node.js version (18+)', 'blue');
      log('  4. Review error messages above\n', 'blue');
    }

    log('═'.repeat(70) + '\n', 'blue');

    // Exit with error code if tests failed
    if (this.results.failed > 0) {
      process.exit(1);
    }
  }
}

// Run tests
const tester = new ImprovementTester();
tester.runAllTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
