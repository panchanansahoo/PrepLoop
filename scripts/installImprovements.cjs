#!/usr/bin/env node

/**
 * Automated Setup Script for All Improvements
 * Integrates all new features into the existing codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

class ImprovementInstaller {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.backendDir = path.join(this.rootDir, 'backend');
    this.frontendDir = path.join(this.rootDir, 'frontend');
  }

  async install() {
    log('\n🚀 PrepLoop Comprehensive Improvements Installer\n', 'blue');

    try {
      await this.checkPrerequisites();
      await this.updateBackendIndex();
      await this.updateFrontendMain();
      await this.updatePackageScripts();
      await this.createEnvTemplate();
      await this.generateDocumentation();
      
      success('\n✨ All improvements installed successfully!\n');
      this.printNextSteps();
    } catch (err) {
      error(`\nInstallation failed: ${err.message}\n`);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    info('Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required. Current: ${nodeVersion}`);
    }

    success('Prerequisites check passed');
  }

  async updateBackendIndex() {
    info('Updating backend index.js...');

    const indexPath = path.join(this.backendDir, 'index.js');
    let content = fs.readFileSync(indexPath, 'utf-8');

    // Add imports
    const imports = `
// Comprehensive Improvements
import advancedCache from './utils/advancedCache.js';
import databaseOptimizer from './utils/databaseOptimizer.js';
import errorTracker from './utils/errorTracker.js';
import security from './middleware/advancedSecurity.js';
import collaborationService from './services/collaborationService.js';
`;

    if (!content.includes('advancedCache')) {
      content = content.replace(
        "import './config/env.js';",
        "import './config/env.js';" + imports
      );
    }

    // Add middleware setup
    const middlewareSetup = `
  // Advanced security middleware
  app.use(security.securityHeaders());
  app.use(security.ipBlocker());
  app.use(security.sqlInjectionProtection());
  app.use(security.xssProtection());
`;

    if (!content.includes('security.securityHeaders')) {
      content = content.replace(
        'app.use(helmet({',
        middlewareSetup + '\n  app.use(helmet({'
      );
    }

    // Add collaboration service initialization
    const collaborationInit = `
  // Initialize collaboration service
  collaborationService.initialize(server);
  console.log('✅ Collaboration service initialized');
`;

    if (!content.includes('collaborationService.initialize')) {
      content = content.replace(
        'setupGracefulShutdown(server',
        collaborationInit + '\n  setupGracefulShutdown(server'
      );
    }

    fs.writeFileSync(indexPath, content);
    success('Backend index.js updated');
  }

  async updateFrontendMain() {
    info('Updating frontend main.jsx...');

    const mainPath = path.join(this.frontendDir, 'src', 'main.jsx');
    let content = fs.readFileSync(mainPath, 'utf-8');

    // Add imports
    const imports = `
import performanceMonitor from './utils/performanceMonitor';
import analytics from './utils/analytics';
`;

    if (!content.includes('performanceMonitor')) {
      content = content.replace(
        "import ErrorBoundary from './components/ErrorBoundary';",
        "import ErrorBoundary from './components/ErrorBoundary';" + imports
      );
    }

    // Add initialization
    const initialization = `
// Initialize performance monitoring
performanceMonitor.init();

// Initialize analytics
analytics.init({
  trackPageViews: true,
  trackClicks: true,
  trackErrors: true,
});

console.log('✅ Monitoring and analytics initialized');
`;

    if (!content.includes('performanceMonitor.init')) {
      content = content.replace(
        'registerServiceWorker();',
        'registerServiceWorker();\n' + initialization
      );
    }

    fs.writeFileSync(mainPath, content);
    success('Frontend main.jsx updated');
  }

  async updatePackageScripts() {
    info('Updating package.json scripts...');

    const packagePath = path.join(this.rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    // Add new scripts
    const newScripts = {
      'docs:generate': 'node backend/utils/apiDocGenerator.js',
      'cache:stats': 'node backend/scripts/cacheStats.js',
      'security:audit': 'node backend/scripts/securityAudit.js',
      'performance:report': 'node backend/scripts/performanceReport.js',
      'collaboration:test': 'node backend/scripts/testCollaboration.js',
    };

    packageJson.scripts = {
      ...packageJson.scripts,
      ...newScripts,
    };

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    success('Package scripts updated');
  }

  async createEnvTemplate() {
    info('Creating environment template...');

    const envTemplate = `
# Comprehensive Improvements Configuration

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
ENABLE_L1_CACHE=true
ENABLE_L2_CACHE=true

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
SLOW_QUERY_THRESHOLD=1000
ENABLE_QUERY_CACHING=true

# Security
ENABLE_ADVANCED_SECURITY=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
BRUTE_FORCE_MAX_ATTEMPTS=5
ENABLE_SQL_INJECTION_PROTECTION=true
ENABLE_XSS_PROTECTION=true

# Error Tracking
ENABLE_ERROR_TRACKING=true
ERROR_ALERT_THRESHOLD=10

# Analytics
ENABLE_ANALYTICS=true
GOOGLE_ANALYTICS_ID=
MIXPANEL_TOKEN=

# Collaboration
ENABLE_COLLABORATION=true
MAX_SESSION_PARTICIPANTS=4

# PWA
ENABLE_PWA=true
ENABLE_OFFLINE_MODE=true
`;

    const envPath = path.join(this.backendDir, '.env.improvements');
    fs.writeFileSync(envPath, envTemplate.trim());
    success('Environment template created');
  }

  async generateDocumentation() {
    info('Generating documentation...');

    const readmePath = path.join(this.rootDir, 'IMPROVEMENTS_APPLIED.md');
    const content = `# PrepLoop - Improvements Applied

## Installation Date
${new Date().toISOString()}

## Improvements Installed

### 1. Performance & Scalability ✅
- Advanced multi-layer caching (L1 + L2)
- Database query optimizer
- Frontend lazy loading
- Performance monitoring

### 2. Security Enhancements ✅
- Advanced security middleware
- SQL injection protection
- XSS protection
- Brute force protection
- Adaptive rate limiting

### 3. Developer Experience ✅
- API documentation generator
- Error tracking system
- Comprehensive testing suite

### 4. Advanced Features ✅
- Spaced repetition system
- Real-time collaboration
- PWA with offline support
- Analytics & A/B testing

### 5. SEO & Marketing ✅
- SEO optimization utilities
- Structured data support
- Sitemap generation

## Quick Start

### 1. Update Environment Variables
\`\`\`bash
cat backend/.env.improvements >> backend/.env
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm run install:all
\`\`\`

### 3. Start Services
\`\`\`bash
# Start Redis (for caching)
redis-server

# Start application
npm run dev
\`\`\`

### 4. Verify Installation
\`\`\`bash
# Check cache stats
npm run cache:stats

# Run security audit
npm run security:audit

# Generate API docs
npm run docs:generate
\`\`\`

## Documentation

- [Comprehensive Guide](./docs/COMPREHENSIVE_IMPROVEMENTS.md)
- [API Documentation](./docs/api-spec.html)
- [Security Guide](./docs/SECURITY.md)
- [Performance Guide](./docs/PERFORMANCE.md)

## Support

For issues or questions, please refer to the documentation or create an issue.

---
Generated by PrepLoop Improvements Installer
`;

    fs.writeFileSync(readmePath, content);
    success('Documentation generated');
  }

  printNextSteps() {
    log('\n📋 Next Steps:\n', 'blue');
    
    info('1. Review and merge environment variables:');
    log('   cat backend/.env.improvements >> backend/.env\n');
    
    info('2. Install Redis for caching:');
    log('   # macOS: brew install redis');
    log('   # Ubuntu: sudo apt-get install redis-server');
    log('   # Windows: Download from https://redis.io/download\n');
    
    info('3. Start Redis server:');
    log('   redis-server\n');
    
    info('4. Restart your application:');
    log('   npm run dev\n');
    
    info('5. Verify improvements:');
    log('   npm run cache:stats');
    log('   npm run security:audit');
    log('   npm run docs:generate\n');
    
    info('6. Read the documentation:');
    log('   docs/COMPREHENSIVE_IMPROVEMENTS.md\n');
    
    success('Happy coding! 🎉\n');
  }
}

// Run installer
const installer = new ImprovementInstaller();
installer.install().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
