#!/usr/bin/env node

/**
 * Bundle Size Checker
 *
 * Monitors and enforces bundle size limits for the production build.
 * Runs after vite build to catch size regressions.
 *
 * Usage: node scripts/checkBundleSize.js
 *
 * Exit codes:
 *   0 = success (within limits)
 *   1 = warning (exceeds recommended size, but below hard limit)
 *   2 = error (exceeds hard limit, build fails)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Size limits in KB (based on typical network conditions)
const LIMITS = {
  // Hard limits: chunks exceeding these will fail the build
  hardLimit: {
    uncompressed: 1200, // KB
    gzipped: 400,       // KB (for heavy vendor chunks like richtext, 3d)
  },
  // Soft limits: chunks exceeding these will warn but not fail
  softLimit: {
    uncompressed: 500,  // KB
    gzipped: 150,       // KB
  },
  // Bundle total limits (this is a complex feature-rich app)
  total: {
    uncompressed: 7000, // KB
    gzipped: 2000,      // KB
  },
};

const DIST_DIR = path.join(__dirname, '..', 'dist', 'assets');
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function formatSize(bytes) {
  return (bytes / 1024).toFixed(2);
}

function getGzippedSize(filePath) {
  const content = fs.readFileSync(filePath);
  return gzipSync(content).length;
}

function checkBundleSize() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`${RED}${BOLD}✗ Error:${RESET} dist/assets directory not found`);
    console.error('  Run "npm run build" first');
    return 2;
  }

  const files = fs.readdirSync(DIST_DIR)
    .filter(f => f.endsWith('.js') && !f.includes('.map'))
    .map(f => {
      const filePath = path.join(DIST_DIR, f);
      const stats = fs.statSync(filePath);
      const uncompressed = stats.size;
      const gzipped = getGzippedSize(filePath);
      return { name: f, uncompressed, gzipped };
    })
    .sort((a, b) => b.uncompressed - a.uncompressed);

  const totalUncompressed = files.reduce((sum, f) => sum + f.uncompressed, 0);
  const totalGzipped = files.reduce((sum, f) => sum + f.gzipped, 0);

  let hasWarnings = false;
  let hasErrors = false;

  console.log(`\n${BOLD}Bundle Size Analysis${RESET}\n`);
  console.log('Chunk Sizes (sorted by uncompressed size):\n');

  // Check individual chunks
  files.forEach(file => {
    const uncompressedKB = formatSize(file.uncompressed);
    const gzippedKB = formatSize(file.gzipped);
    const exceedsHardUncompressed = file.uncompressed > LIMITS.hardLimit.uncompressed * 1024;
    const exceedsHardGzipped = file.gzipped > LIMITS.hardLimit.gzipped * 1024;
    const exceedsSoftUncompressed = file.uncompressed > LIMITS.softLimit.uncompressed * 1024;
    const exceedsSoftGzipped = file.gzipped > LIMITS.softLimit.gzipped * 1024;

    let status = `${GREEN}✓${RESET}`;
    if (exceedsHardUncompressed || exceedsHardGzipped) {
      status = `${RED}${BOLD}✗${RESET}`;
      hasErrors = true;
    } else if (exceedsSoftUncompressed || exceedsSoftGzipped) {
      status = `${YELLOW}⚠${RESET}`;
      hasWarnings = true;
    }

    console.log(
      `${status} ${file.name.padEnd(50)} ` +
      `${uncompressedKB.padStart(10)} KB (raw) / ` +
      `${gzippedKB.padStart(8)} KB (gzip)`
    );
  });

  // Summary
  const totalUncompressedKB = formatSize(totalUncompressed);
  const totalGzippedKB = formatSize(totalGzipped);
  const totalExceedsHardUncompressed = totalUncompressed > LIMITS.total.uncompressed * 1024;
  const totalExceedsHardGzipped = totalGzipped > LIMITS.total.gzipped * 1024;
  const totalExceedsSoftUncompressed = totalUncompressed > LIMITS.total.uncompressed * 1024 * 0.8;
  const totalExceedsSoftGzipped = totalGzipped > LIMITS.total.gzipped * 1024 * 0.8;

  console.log('\n' + '─'.repeat(80));
  let totalStatus = `${GREEN}✓${RESET}`;
  if (totalExceedsHardUncompressed || totalExceedsHardGzipped) {
    totalStatus = `${RED}${BOLD}✗${RESET}`;
    hasErrors = true;
  } else if (totalExceedsSoftUncompressed || totalExceedsSoftGzipped) {
    totalStatus = `${YELLOW}⚠${RESET}`;
    hasWarnings = true;
  }

  console.log(
    `${totalStatus} ${`TOTAL`.padEnd(50)} ` +
    `${totalUncompressedKB.padStart(10)} KB (raw) / ` +
    `${totalGzippedKB.padStart(8)} KB (gzip)`
  );

  // Limits reference
  console.log(`\n${BOLD}Size Limits:${RESET}`);
  console.log(`  Individual chunk (soft): ${LIMITS.softLimit.uncompressed} KB raw / ${LIMITS.softLimit.gzipped} KB gzip`);
  console.log(`  Individual chunk (hard): ${LIMITS.hardLimit.uncompressed} KB raw / ${LIMITS.hardLimit.gzipped} KB gzip`);
  console.log(`  Total bundle (hard):     ${LIMITS.total.uncompressed} KB raw / ${LIMITS.total.gzipped} KB gzip`);

  // Recommendations
  if (hasErrors || hasWarnings) {
    console.log(`\n${BOLD}Recommendations:${RESET}`);
    if (files.some(f => f.uncompressed > 1024 * 1024)) {
      console.log('  • Consider code-splitting: Split large chunks into smaller ones');
      console.log('  • Review dependencies: Are all imports being used?');
    }
    if (files.some(f => 
      f.name.includes('richtext') || 
      f.name.includes('3d') || 
      f.name.includes('prettier')
    )) {
      console.log('  • Heavy vendors (richtext, 3D, prettier) are separate chunks');
      console.log('    → Consider lazy-loading these features (dynamic imports)');
    }
  }

  // Exit code
  console.log('');
  if (hasErrors) {
    console.log(`${RED}${BOLD}✗ Build failed: Bundle size exceeds hard limits${RESET}`);
    return 2;
  }
  if (hasWarnings) {
    console.log(`${YELLOW}⚠ Build succeeded with warnings: Some chunks exceed soft limits${RESET}`);
    return 1;
  }
  console.log(`${GREEN}${BOLD}✓ Bundle size check passed${RESET}`);
  return 0;
}

const exitCode = checkBundleSize();
process.exit(exitCode);

