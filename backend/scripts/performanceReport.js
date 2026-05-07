#!/usr/bin/env node

/**
 * Performance Report Generator
 * Analyzes API endpoint performance and generates recommendations
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📊 Backend Route Performance Audit\n');
console.log('=' .repeat(70));

// Analyze route files
const routesDir = path.join(__dirname, '..', 'routes');

if (!fs.existsSync(routesDir)) {
  console.log('❌ Routes directory not found');
  process.exit(1);
}

const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

console.log(`\n📁 Found ${routeFiles.length} route files\n`);

// Analyze each route file
const routeAnalysis = [];

for (const file of routeFiles) {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Count endpoints
  const getRoutes = (content.match(/\.get\(/g) || []).length;
  const postRoutes = (content.match(/\.post\(/g) || []).length;
  const putRoutes = (content.match(/\.put\(/g) || []).length;
  const deleteRoutes = (content.match(/\.delete\(/g) || []).length;
  const totalEndpoints = getRoutes + postRoutes + putRoutes + deleteRoutes;
  
  // Check for caching
  const hasCaching = content.includes('cacheManager') || content.includes('cache.get');
  
  // Check for rate limiting
  const hasRateLimit = content.includes('rateLimit') || content.includes('limiter');
  
  // Check for authentication
  const hasAuth = content.includes('authenticateToken') || content.includes('requireAdmin');
  
  // Estimate complexity (lines of code)
  const lines = content.split('\n').length;
  
  routeAnalysis.push({
    file,
    endpoints: totalEndpoints,
    methods: { get: getRoutes, post: postRoutes, put: putRoutes, delete: deleteRoutes },
    hasCaching,
    hasRateLimit,
    hasAuth,
    lines,
  });
}

// Sort by endpoint count
routeAnalysis.sort((a, b) => b.endpoints - a.endpoints);

// Display results
console.log('📋 Route Analysis Summary:\n');
console.log('┌─────────────────────────────────┬──────────┬────────┬────────┬────────┐');
console.log('│ Route File                      │ Endpoints│ GET    │ POST   │ Other  │');
console.log('├─────────────────────────────────┼──────────┼────────┼────────┼────────┤');

routeAnalysis.forEach(route => {
  const otherMethods = route.methods.put + route.methods.delete;
  const fileName = route.file.padEnd(31);
  console.log(`│ ${fileName} │ ${String(route.endpoints).padEnd(8)} │ ${String(route.methods.get).padEnd(6)} │ ${String(route.methods.post).padEnd(6)} │ ${String(otherMethods).padEnd(6)} │`);
});

console.log('└─────────────────────────────────┴──────────┴────────┴────────┴────────┘');

// Calculate totals
const totalEndpoints = routeAnalysis.reduce((sum, r) => sum + r.endpoints, 0);
const routesWithCaching = routeAnalysis.filter(r => r.hasCaching).length;
const routesWithRateLimit = routeAnalysis.filter(r => r.hasRateLimit).length;
const routesWithAuth = routeAnalysis.filter(r => r.hasAuth).length;

console.log('\n📈 Overall Statistics:');
console.log(`  Total Routes: ${routeAnalysis.length}`);
console.log(`  Total Endpoints: ${totalEndpoints}`);
console.log(`  Routes with Caching: ${routesWithCaching}/${routeAnalysis.length} (${Math.round(routesWithCaching/routeAnalysis.length*100)}%)`);
console.log(`  Routes with Rate Limiting: ${routesWithRateLimit}/${routeAnalysis.length} (${Math.round(routesWithRateLimit/routeAnalysis.length*100)}%)`);
console.log(`  Routes with Authentication: ${routesWithAuth}/${routeAnalysis.length} (${Math.round(routesWithAuth/routeAnalysis.length*100)}%)`);

// Recommendations
console.log('\n💡 Recommendations:\n');

if (routesWithCaching / routeAnalysis.length < 0.5) {
  console.log('  ⚠️  Less than 50% of routes use caching');
  console.log('     → Add caching to high-traffic GET endpoints');
  console.log('     → Use cacheManager.getOrSet() pattern');
} else {
  console.log('  ✅ Good caching coverage');
}

if (routesWithRateLimit / routeAnalysis.length < 0.7) {
  console.log('\n  ⚠️  Rate limiting not applied to all routes');
  console.log('     → Add rate limiting to auth and write endpoints');
  console.log('     → Use different limits for different endpoint types');
} else {
  console.log('\n  ✅ Good rate limiting coverage');
}

if (routesWithAuth / routeAnalysis.length < 0.8) {
  console.log('\n  ⚠️  Some routes may be missing authentication');
  console.log('     → Review public vs private routes');
  console.log('     → Ensure sensitive data is protected');
} else {
  console.log('\n  ✅ Good authentication coverage');
}

// Top routes by complexity
console.log('\n🔝 Most Complex Routes (by LOC):');
const topComplex = [...routeAnalysis].sort((a, b) => b.lines - a.lines).slice(0, 5);
topComplex.forEach((route, idx) => {
  console.log(`  ${idx + 1}. ${route.file} (${route.lines} lines, ${route.endpoints} endpoints)`);
});

// Performance tips
console.log('\n🚀 Performance Tips:');
console.log('  1. Add database indexes for frequently queried fields');
console.log('  2. Implement pagination for list endpoints');
console.log('  3. Use compression middleware for large responses');
console.log('  4. Cache expensive computations and API calls');
console.log('  5. Monitor slow queries with pg_stat_statements');
console.log('  6. Use connection pooling for database queries');
console.log('  7. Implement request timeout handling');

console.log('\n' + '='.repeat(70));
console.log('\n✅ Performance audit complete!\n');

// Generate report file
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalRoutes: routeAnalysis.length,
    totalEndpoints,
    routesWithCaching,
    routesWithRateLimit,
    routesWithAuth,
  },
  routes: routeAnalysis,
  recommendations: [
    routesWithCaching / routeAnalysis.length < 0.5 ? 'Add caching to more routes' : null,
    routesWithRateLimit / routeAnalysis.length < 0.7 ? 'Improve rate limiting coverage' : null,
    routesWithAuth / routeAnalysis.length < 0.8 ? 'Review authentication on routes' : null,
  ].filter(Boolean),
};

const reportPath = path.join(__dirname, '..', 'docs', 'performance-report.json');
try {
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved to: ${reportPath}\n`);
} catch (error) {
  console.log('⚠️  Could not save report file\n');
}
