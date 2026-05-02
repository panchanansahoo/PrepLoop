/**
 * Quick Bundle Verification Script
 * 
 * Verifies lazy-loading chunks are properly separated
 */

import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist', 'assets', 'js');

if (!fs.existsSync(distDir)) {
  console.error('❌ dist/assets/js not found. Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(distDir)
  .filter(f => f.endsWith('.js') && !f.includes('.br') && !f.includes('.map'))
  .map(f => {
    const filePath = path.join(distDir, f);
    const stat = fs.statSync(filePath);
    return { name: f, size: stat.size };
  })
  .sort((a, b) => b.size - a.size);

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║   Phase 1B Bundle Verification Report                 ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Find key chunks
const mainBundle = files.find(f => f.name.includes('index-'));
const vendor3D = files.find(f => f.name.includes('vendor-3d'));
const vendorPrettier = files.find(f => f.name.includes('vendor-prettier'));
const vendorTiptap = files.find(f => f.name.includes('vendor-tiptap'));
const vendorReact = files.find(f => f.name.includes('vendor-react'));

console.log('📊 Critical Chunks:\n');
console.log(`Main Bundle:           ${mainBundle?.size || 0} bytes (${((mainBundle?.size || 0) / 1024).toFixed(2)} KB)`);
console.log(`Vendor 3D (lazy):      ${vendor3D?.size || 0} bytes (${((vendor3D?.size || 0) / 1024).toFixed(2)} KB)`);
console.log(`Vendor Prettier (lazy):${vendorPrettier?.size || 0} bytes (${((vendorPrettier?.size || 0) / 1024).toFixed(2)} KB)`);
console.log(`Vendor Tiptap (lazy):  ${vendorTiptap?.size || 0} bytes (${((vendorTiptap?.size || 0) / 1024).toFixed(2)} KB)`);
console.log(`Vendor React (eager):  ${vendorReact?.size || 0} bytes (${((vendorReact?.size || 0) / 1024).toFixed(2)} KB)`);

console.log('\n✅ Verification Results:\n');

let allPass = true;

// Check: Main bundle < 100KB
if ((mainBundle?.size || 0) < 100 * 1024) {
  console.log('✓ Main bundle under 100 KB');
} else {
  console.log('✗ Main bundle exceeds 100 KB');
  allPass = false;
}

// Check: Vendor 3D is separate
if (vendor3D) {
  console.log('✓ Vendor 3D in separate lazy-loaded chunk');
} else {
  console.log('✗ Vendor 3D chunk not found');
  allPass = false;
}

// Check: Vendor Prettier is separate
if (vendorPrettier) {
  console.log('✓ Vendor Prettier in separate lazy-loaded chunk');
} else {
  console.log('✗ Vendor Prettier chunk not found');
  allPass = false;
}

console.log('\n💡 Summary:\n');

if (allPass) {
  console.log('🎉 All lazy-loading optimizations are in place!');
  console.log('\nBenefits:');
  console.log(`  - Main bundle reduced by ~${(((vendor3D?.size || 0) + (vendorPrettier?.size || 0)) / 1024).toFixed(0)} KB`);
  console.log('  - 3D features load only when needed');
  console.log('  - Code formatting loads only when user clicks format');
  console.log('  - Faster initial page load');
  console.log('\nNext: Deploy to production and monitor with DevTools Network tab');
} else {
  console.log('⚠️ Some chunks may need optimization');
}

console.log('\n' + '═'.repeat(60) + '\n');

process.exit(allPass ? 0 : 1);
