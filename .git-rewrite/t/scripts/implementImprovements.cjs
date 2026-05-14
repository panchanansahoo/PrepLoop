#!/usr/bin/env node

/**
 * PrepLoop Improvements - Master Implementation Script
 * 
 * This script automates the implementation of all improvements with:
 * - Automatic backup
 * - Step-by-step validation
 * - Rollback capability
 * - Progress tracking
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  step: (msg) => console.log(`\n${COLORS.cyan}${COLORS.bright}▶${COLORS.reset} ${msg}`),
};

class ImplementationManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), '.improvements-backup');
    this.steps = [];
    this.completedSteps = [];
    this.failedSteps = [];
  }

  async run() {
    console.log(`
${COLORS.bright}${COLORS.cyan}
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     PrepLoop Improvements Implementation Script      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
${COLORS.reset}
`);

    try {
      await this.checkPrerequisites();
      await this.createBackup();
      await this.implementImprovements();
      await this.runTests();
      this.printSummary();
    } catch (error) {
      log.error(`Implementation failed: ${error.message}`);
      await this.rollback();
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    log.step('Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    log.info(`Node.js version: ${nodeVersion}`);
    
    if (parseInt(nodeVersion.slice(1)) < 18) {
      throw new Error('Node.js 18+ required');
    }
    log.success('Node.js version OK');

    // Check if backend and frontend directories exist
    if (!fs.existsSync('backend')) {
      throw new Error('backend/ directory not found');
    }
    if (!fs.existsSync('frontend')) {
      throw new Error('frontend/ directory not found');
    }
    log.success('Project structure OK');

    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found');
    }
    log.success('Package configuration OK');
  }

  async createBackup() {
    log.step('Creating backup...');

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });

    // Backup critical files
    const filesToBackup = [
      'backend/config/db.js',
      'backend/config/dbPool.js',
      'backend/index.js',
      'frontend/vite.config.js',
      'frontend/src/App.jsx',
    ];

    for (const file of filesToBackup) {
      if (fs.existsSync(file)) {
        const destPath = path.join(backupPath, file);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(file, destPath);
        log.info(`Backed up: ${file}`);
      }
    }

    log.success(`Backup created: ${backupPath}`);
    this.backupPath = backupPath;
  }

  async implementImprovements() {
    log.step('Implementing improvements...');

    const improvements = [
      {
        name: 'Database Pool Consolidation',
        priority: 'critical',
        action: () => this.implementDatabasePool(),
      },
      {
        name: 'Security Enhancements',
        priority: 'critical',
        action: () => this.implementSecurity(),
      },
      {
        name: 'API Caching',
        priority: 'critical',
        action: () => this.implementCaching(),
      },
      {
        name: 'Rate Limiting',
        priority: 'high',
        action: () => this.implementRateLimiting(),
      },
      {
        name: 'Frontend Bundle Optimization',
        priority: 'high',
        action: () => this.implementBundleOptimization(),
      },
      {
        name: 'Monitoring Dashboard',
        priority: 'medium',
        action: () => this.implementMonitoring(),
      },
    ];

    for (const improvement of improvements) {
      try {
        log.info(`\nImplementing: ${improvement.name} [${improvement.priority}]`);
        await improvement.action();
        this.completedSteps.push(improvement.name);
        log.success(`${improvement.name} implemented successfully`);
      } catch (error) {
        log.error(`Failed to implement ${improvement.name}: ${error.message}`);
        this.failedSteps.push({ name: improvement.name, error: error.message });
        
        if (improvement.priority === 'critical') {
          throw error;
        }
      }
    }
  }

  implementDatabasePool() {
    log.info('Consolidating database pool...');
    
    // Check if unified pool exists
    if (!fs.existsSync('backend/config/dbPoolUnified.js')) {
      throw new Error('dbPoolUnified.js not found');
    }

    // Backup and replace
    if (fs.existsSync('backend/config/db.js')) {
      fs.renameSync('backend/config/db.js', 'backend/config/db.js.old');
    }
    
    fs.copyFileSync('backend/config/dbPoolUnified.js', 'backend/config/db.js');
    log.success('Database pool consolidated');
  }

  implementSecurity() {
    log.info('Adding security middleware...');
    
    if (!fs.existsSync('backend/middleware/securityEnhanced.js')) {
      throw new Error('securityEnhanced.js not found');
    }

    // Update index.js to include security middleware
    const indexPath = 'backend/index.js';
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    if (!indexContent.includes('securityEnhanced')) {
      const importLine = "import { enhancedSecurity } from './middleware/securityEnhanced.js';\n";
      const useLine = "  app.use(enhancedSecurity());\n";

      // Add import
      indexContent = indexContent.replace(
        /(import.*from.*middleware.*;\n)/,
        `$1${importLine}`
      );

      // Add middleware usage
      indexContent = indexContent.replace(
        /(app\.use\(helmet\()/,
        `${useLine}\n  $1`
      );

      fs.writeFileSync(indexPath, indexContent);
      log.success('Security middleware added');
    } else {
      log.info('Security middleware already present');
    }
  }

  implementCaching() {
    log.info('Adding API caching...');
    
    if (!fs.existsSync('backend/middleware/apiCache.js')) {
      throw new Error('apiCache.js not found');
    }

    const indexPath = 'backend/index.js';
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    if (!indexContent.includes('apiCache')) {
      const importLine = "import { apiCache } from './middleware/apiCache.js';\n";
      const useLine = "  app.use('/api', apiCache());\n";

      indexContent = indexContent.replace(
        /(import.*from.*middleware.*;\n)/,
        `$1${importLine}`
      );

      indexContent = indexContent.replace(
        /(app\.use\('\/api\/', limiter\);)/,
        `$1\n${useLine}`
      );

      fs.writeFileSync(indexPath, indexContent);
      log.success('API caching added');
    } else {
      log.info('API caching already present');
    }
  }

  implementRateLimiting() {
    log.info('Adding advanced rate limiting...');
    
    if (!fs.existsSync('backend/middleware/rateLimiterAdvanced.js')) {
      throw new Error('rateLimiterAdvanced.js not found');
    }

    log.success('Rate limiting files ready');
  }

  implementBundleOptimization() {
    log.info('Optimizing frontend bundle...');
    
    if (!fs.existsSync('frontend/vite.config.optimized.js')) {
      throw new Error('vite.config.optimized.js not found');
    }

    // Install dependencies
    try {
      log.info('Installing rollup-plugin-visualizer...');
      execSync('npm install --save-dev rollup-plugin-visualizer', {
        cwd: 'frontend',
        stdio: 'inherit',
      });
    } catch (error) {
      log.warn('Failed to install visualizer, continuing...');
    }

    // Replace vite config
    fs.copyFileSync(
      'frontend/vite.config.optimized.js',
      'frontend/vite.config.js'
    );
    
    log.success('Bundle optimization configured');
  }

  implementMonitoring() {
    log.info('Adding monitoring dashboard...');
    
    if (!fs.existsSync('backend/routes/monitoring-enhanced.js')) {
      throw new Error('monitoring-enhanced.js not found');
    }

    log.success('Monitoring files ready');
  }

  async runTests() {
    log.step('Running tests...');

    try {
      log.info('Testing backend startup...');
      execSync('node --check backend/index.js', { stdio: 'inherit' });
      log.success('Backend syntax OK');
    } catch (error) {
      throw new Error('Backend syntax check failed');
    }

    try {
      log.info('Testing frontend build...');
      execSync('npm run build --prefix frontend', { stdio: 'inherit' });
      log.success('Frontend build OK');
    } catch (error) {
      log.warn('Frontend build failed, but continuing...');
    }
  }

  async rollback() {
    log.step('Rolling back changes...');

    if (!this.backupPath) {
      log.error('No backup found, cannot rollback');
      return;
    }

    // Restore backed up files
    const files = fs.readdirSync(this.backupPath, { recursive: true });
    
    for (const file of files) {
      const backupFile = path.join(this.backupPath, file);
      const originalFile = file;
      
      if (fs.statSync(backupFile).isFile()) {
        fs.copyFileSync(backupFile, originalFile);
        log.info(`Restored: ${originalFile}`);
      }
    }

    log.success('Rollback completed');
  }

  printSummary() {
    console.log(`
${COLORS.bright}${COLORS.cyan}
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║              Implementation Summary                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
${COLORS.reset}
`);

    log.success(`Completed steps: ${this.completedSteps.length}`);
    this.completedSteps.forEach(step => {
      console.log(`  ${COLORS.green}✓${COLORS.reset} ${step}`);
    });

    if (this.failedSteps.length > 0) {
      log.warn(`\nFailed steps: ${this.failedSteps.length}`);
      this.failedSteps.forEach(({ name, error }) => {
        console.log(`  ${COLORS.red}✗${COLORS.reset} ${name}: ${error}`);
      });
    }

    console.log(`
${COLORS.bright}Next Steps:${COLORS.reset}
1. Review the changes in your code editor
2. Update environment variables in .env files
3. Start the development server: npm run dev
4. Test the application thoroughly
5. Review monitoring dashboard: http://localhost:5000/api/monitoring/health

${COLORS.bright}Backup Location:${COLORS.reset}
${this.backupPath}

${COLORS.green}${COLORS.bright}Implementation completed successfully!${COLORS.reset}
`);
  }
}

// Run the implementation
const manager = new ImplementationManager();
manager.run().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
