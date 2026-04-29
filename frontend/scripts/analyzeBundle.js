#!/usr/bin/env node

/**
 * Frontend Bundle Analysis Script
 * 
 * Analyzes the frontend bundle to identify optimization opportunities
 * and provides actionable recommendations for reducing bundle size.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class BundleAnalyzer {
  constructor() {
    this.projectRoot = join(__dirname, '..');
    this.distPath = join(this.projectRoot, 'dist');
    this.statsPath = join(this.projectRoot, 'dist', 'stats.json');
    this.recommendations = [];
    this.warnings = [];
    this.optimizations = [];
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  async analyze() {
    this.log('🔍 Starting Frontend Bundle Analysis...', 'cyan');
    
    try {
      // Step 1: Build with stats
      await this.buildWithStats();
      
      // Step 2: Analyze bundle size
      await this.analyzeBundleSize();
      
      // Step 3: Check for duplicate dependencies
      await this.checkDuplicates();
      
      // Step 4: Analyze chunks
      await this.analyzeChunks();
      
      // Step 5: Check for optimization opportunities
      await this.checkOptimizations();
      
      // Step 6: Generate recommendations
      this.generateRecommendations();
      
      // Step 7: Print report
      this.printReport();
      
    } catch (error) {
      this.log(`❌ Analysis failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async buildWithStats() {
    this.log('📦 Building with stats...', 'blue');
    
    try {
      // Build with stats generation
      execSync('npm run build -- --stats', { 
        cwd: this.projectRoot, 
        stdio: 'pipe' 
      });
      
      this.log('✅ Build completed successfully', 'green');
    } catch (error) {
      // Fallback to regular build if stats build fails
      this.log('⚠️  Stats build failed, trying regular build...', 'yellow');
      execSync('npm run build', { 
        cwd: this.projectRoot, 
        stdio: 'pipe' 
      });
    }
  }

  async analyzeBundleSize() {
    this.log('📊 Analyzing bundle size...', 'blue');
    
    if (!existsSync(this.distPath)) {
      throw new Error('Build output not found. Run npm run build first.');
    }

    const assets = this.getAssets();
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    
    this.log(`\n📋 Bundle Analysis Results:`, 'cyan');
    this.log(`Total Bundle Size: ${this.formatBytes(totalSize)}`, 'yellow');
    
    // Check against thresholds
    if (totalSize > 3 * 1024 * 1024) { // 3MB
      this.warnings.push({
        type: 'bundle-size',
        message: 'Bundle size exceeds 3MB threshold',
        severity: 'high',
        current: totalSize,
        threshold: 3 * 1024 * 1024
      });
    }
    
    // Analyze individual assets
    const largeAssets = assets.filter(asset => asset.size > 500 * 1024); // 500KB
    if (largeAssets.length > 0) {
      this.log('\n⚠️  Large Assets Found:', 'yellow');
      largeAssets.forEach(asset => {
        this.log(`  ${asset.name}: ${this.formatBytes(asset.size)}`, 'yellow');
      });
    }
    
    this.bundleAnalysis = { totalSize, assets, largeAssets };
  }

  getAssets() {
    const assets = [];
    
    // Traverse the assets directory structure
    const assetsDir = join(this.distPath, 'assets');
    if (existsSync(assetsDir)) {
      this.traverseDirectory(assetsDir, assets, 'assets');
    }
    
    // Also check for files directly in dist directory
    const files = readdirSync(this.distPath);
    files.forEach(file => {
      const filePath = join(this.distPath, file);
      try {
        const stat = statSync(filePath);
        if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.css'))) {
          assets.push({
            name: file,
            size: stat.size,
            type: this.getFileType(file)
          });
        }
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Skipping ${file}: ${error.message}`);
      }
    });
    
    return assets;
  }
  
  traverseDirectory(dir, assets, basePath) {
    const items = readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = join(dir, item);
      try {
        const stat = statSync(itemPath);
        if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.css'))) {
          const relativePath = join(basePath, item);
          assets.push({
            name: relativePath,
            size: stat.size,
            type: this.getFileType(item)
          });
        } else if (stat.isDirectory()) {
          this.traverseDirectory(itemPath, assets, join(basePath, item));
        }
      } catch (error) {
        console.warn(`Skipping ${item}: ${error.message}`);
      }
    });
  }

  getFileType(filename) {
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.css')) return 'stylesheet';
    if (filename.endsWith('.woff') || filename.endsWith('.woff2')) return 'font';
    if (filename.match(/\.(png|jpg|jpeg|gif|svg)$/)) return 'image';
    return 'other';
  }

  async checkDuplicates() {
    this.log('🔍 Checking for duplicate dependencies...', 'blue');
    
    try {
      const packageJson = JSON.parse(readFileSync(join(this.projectRoot, 'package.json'), 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for common duplicates
      const duplicatePatterns = [
        { pattern: /lodash/, packages: ['lodash', 'lodash-es', 'lodash.debounce', 'lodash.throttle'] },
        { pattern: /moment/, packages: ['moment', 'moment-timezone', 'dayjs', 'date-fns'] },
        { pattern: /axios/, packages: ['axios', 'axios-retry', '@axios/adapter-http'] },
        { pattern: /react/, packages: ['react', 'react-dom', 'react-is'] }
      ];
      
      duplicatePatterns.forEach(({ pattern, packages }) => {
        const found = packages.filter(pkg => dependencies[pkg]);
        if (found.length > 1) {
          this.optimizations.push({
            type: 'duplicate-dependencies',
            message: `Found duplicate ${pattern.source} packages: ${found.join(', ')}`,
            packages: found,
            recommendation: `Consider using only one ${pattern.source} package`
          });
        }
      });
      
    } catch (error) {
      this.log(`⚠️  Could not check duplicates: ${error.message}`, 'yellow');
    }
  }

  async analyzeChunks() {
    this.log('🧩 Analyzing code splitting...', 'blue');
    
    if (existsSync(this.statsPath)) {
      try {
        const stats = JSON.parse(readFileSync(this.statsPath, 'utf8'));
        
        // Analyze chunk distribution
        const chunks = stats.children[0].chunks || [];
        const modules = stats.children[0].modules || [];
        
        this.log(`\n📦 Found ${chunks.length} chunks`, 'cyan');
        
        chunks.forEach(chunk => {
          const size = chunk.size || 0;
          const files = chunk.files || [];
          
          this.log(`  Chunk ${chunk.id || 'main'}: ${this.formatBytes(size)} (${files.join(', ')})`, 'cyan');
          
          if (size > 1 * 1024 * 1024) { // 1MB
            this.warnings.push({
              type: 'large-chunk',
              message: `Chunk ${chunk.id || 'main'} is larger than 1MB`,
              size,
              files
            });
          }
        });
        
        // Check for common optimization opportunities
        this.checkChunkOptimizations(modules, chunks);
        
      } catch (error) {
        this.log(`⚠️  Could not analyze chunks: ${error.message}`, 'yellow');
      }
    } else {
      this.log('⚠️  No stats file found, skipping chunk analysis', 'yellow');
    }
  }

  checkChunkOptimizations(modules, chunks) {
    // Check for unused dependencies
    const vendorModules = modules.filter(m => 
      m.name && (
        m.name.includes('node_modules') ||
        m.name.includes('vendor')
      )
    );
    
    const largeVendors = vendorModules.filter(m => (m.size || 0) > 100 * 1024); // 100KB
    
    if (largeVendors.length > 0) {
      this.optimizations.push({
        type: 'large-vendor-modules',
        message: 'Found large vendor modules that could be optimized',
        modules: largeVendors.map(m => ({
          name: m.name,
          size: m.size
        }))
      });
    }
    
    // Check for dynamic import opportunities
    const heavyComponents = modules.filter(m => 
      (m.size || 0) > 200 * 1024 && // 200KB
      !m.name?.includes('node_modules') &&
      m.name?.match(/\.(jsx?|tsx?)$/)
    );
    
    if (heavyComponents.length > 0) {
      this.optimizations.push({
        type: 'code-splitting-opportunity',
        message: 'Large components found that could benefit from code splitting',
        components: heavyComponents.map(m => m.name)
      });
    }
  }

  async checkOptimizations() {
    this.log('⚙️  Checking for optimization opportunities...', 'blue');
    
    // Check package.json for optimization flags
    try {
      const packageJson = JSON.parse(readFileSync(join(this.projectRoot, 'package.json'), 'utf8'));
      
      // Check for tree shaking
      if (!packageJson.sideEffects === false) {
        this.optimizations.push({
          type: 'tree-shaking',
          message: 'Consider setting "sideEffects": false in package.json for better tree shaking',
          current: packageJson.sideEffects,
          recommendation: 'Set "sideEffects": false'
        });
      }
      
      // Check for module field
      if (!packageJson.module) {
        this.optimizations.push({
          type: 'es-modules',
          message: 'Consider adding "module" field for better ES module support',
          recommendation: 'Add "module": "dist/index.esm.js"'
        });
      }
      
    } catch (error) {
      this.log(`⚠️  Could not check optimizations: ${error.message}`, 'yellow');
    }
  }

  generateRecommendations() {
    this.log('💡 Generating recommendations...', 'blue');
    
    // Bundle size recommendations
    if (this.bundleAnalysis?.totalSize > 3 * 1024 * 1024) {
      this.recommendations.push({
        priority: 'high',
        category: 'bundle-size',
        title: 'Reduce Bundle Size',
        description: 'Bundle size exceeds 3MB. Consider code splitting and lazy loading.',
        actions: [
          'Implement route-based code splitting',
          'Lazy load heavy components',
          'Use dynamic imports for non-critical features',
          'Consider using smaller alternatives for large libraries'
        ]
      });
    }
    
    // Code splitting recommendations
    if (this.optimizations.some(opt => opt.type === 'code-splitting-opportunity')) {
      this.recommendations.push({
        priority: 'medium',
        category: 'code-splitting',
        title: 'Implement Code Splitting',
        description: 'Large components detected that could benefit from code splitting.',
        actions: [
          'Use React.lazy() for component code splitting',
          'Implement route-based splitting',
          'Split vendor bundles',
          'Use webpack magic comments for chunk naming'
        ]
      });
    }
    
    // Duplicate dependencies
    if (this.optimizations.some(opt => opt.type === 'duplicate-dependencies')) {
      this.recommendations.push({
        priority: 'high',
        category: 'dependencies',
        title: 'Remove Duplicate Dependencies',
        description: 'Multiple packages serving similar purposes detected.',
        actions: [
          'Audit dependencies for duplicates',
          'Choose one library per functionality',
          'Remove unused dependencies',
          'Use webpack-bundle-analyzer for detailed analysis'
        ]
      });
    }
    
    // Tree shaking
    if (this.optimizations.some(opt => opt.type === 'tree-shaking')) {
      this.recommendations.push({
        priority: 'medium',
        category: 'tree-shaking',
        title: 'Enable Tree Shaking',
        description: 'Package configuration could be optimized for tree shaking.',
        actions: [
          'Set "sideEffects": false in package.json',
          'Use ES modules instead of CommonJS',
          'Import only needed functions from libraries',
          'Configure webpack for optimal tree shaking'
        ]
      });
    }
    
    // Large chunks
    if (this.warnings.some(w => w.type === 'large-chunk')) {
      this.recommendations.push({
        priority: 'medium',
        category: 'chunk-optimization',
        title: 'Optimize Large Chunks',
        description: 'Some chunks are larger than recommended 1MB.',
        actions: [
          'Split large chunks into smaller ones',
          'Use webpack splitChunks configuration',
          'Separate vendor and application code',
          'Implement progressive loading'
        ]
      });
    }
  }

  printReport() {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📊 BUNDLE ANALYSIS REPORT', 'cyan');
    this.log('='.repeat(60), 'cyan');
    
    // Summary
    if (this.bundleAnalysis) {
      this.log(`\n📈 Summary:`, 'bright');
      this.log(`  Total Size: ${this.formatBytes(this.bundleAnalysis.totalSize)}`, 'yellow');
      this.log(`  Asset Count: ${this.bundleAnalysis.assets.length}`, 'yellow');
      this.log(`  Large Assets: ${this.bundleAnalysis.largeAssets.length}`, 'yellow');
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      this.log(`\n⚠️  Warnings (${this.warnings.length}):`, 'yellow');
      this.warnings.forEach(warning => {
        this.log(`  • ${warning.message}`, 'yellow');
      });
    }
    
    // Optimizations
    if (this.optimizations.length > 0) {
      this.log(`\n🔧 Optimizations Found (${this.optimizations.length}):`, 'blue');
      this.optimizations.forEach(opt => {
        this.log(`  • ${opt.message}`, 'blue');
      });
    }
    
    // Recommendations
    if (this.recommendations.length > 0) {
      this.log(`\n💡 Recommendations (${this.recommendations.length}):`, 'green');
      
      // Group by priority
      const highPriority = this.recommendations.filter(r => r.priority === 'high');
      const mediumPriority = this.recommendations.filter(r => r.priority === 'medium');
      
      if (highPriority.length > 0) {
        this.log('\n  🔴 High Priority:', 'red');
        highPriority.forEach(rec => {
          this.log(`    • ${rec.title}`, 'red');
          rec.actions.forEach(action => {
            this.log(`      - ${action}`, 'yellow');
          });
        });
      }
      
      if (mediumPriority.length > 0) {
        this.log('\n  🟡 Medium Priority:', 'yellow');
        mediumPriority.forEach(rec => {
          this.log(`    • ${rec.title}`, 'yellow');
          rec.actions.forEach(action => {
            this.log(`      - ${action}`, 'blue');
          });
        });
      }
    }
    
    // Next steps
    this.log('\n🎯 Next Steps:', 'bright');
    this.log('  1. Address high priority recommendations first', 'cyan');
    this.log('  2. Run analysis again after optimizations', 'cyan');
    this.log('  3. Monitor bundle size in CI/CD pipeline', 'cyan');
    this.log('  4. Consider setting up bundle size budgets', 'cyan');
    
    this.log('\n' + '='.repeat(60), 'cyan');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run analysis
const analyzer = new BundleAnalyzer();
analyzer.analyze().catch(console.error);