#!/usr/bin/env node

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

/**
 * Test light/dark mode functionality
 */
async function testThemeSystem() {
  console.log('\n🎨 Testing Light/Dark Mode System\n');

  const port = 5180;
  const url = `http://localhost:${port}`;

  try {
    console.log(`📡 Connecting to ${url}...\n`);

    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) {
      console.error(`❌ Failed to connect (status ${response.status})`);
      process.exit(1);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Test 1: Check CSS variables are loaded
    console.log('✓ Test 1: CSS Variables');
    const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
    const hasCSSFile = Array.from(styleSheets).some(sheet =>
      sheet.href.includes('unified-theme') || sheet.href.includes('index')
    );
    console.log(`  ${hasCSSFile ? '✅' : '❌'} CSS theme file loaded\n`);

    // Test 2: Check ThemeContext is initialized
    console.log('✓ Test 2: Theme Initialization');
    const hasThemeDiv = document.querySelector('[data-theme]');
    console.log(`  ${hasThemeDiv ? '✅' : '❌'} data-theme attribute exists\n`);

    // Test 3: Check for hardcoded isLight patterns (should be minimal)
    console.log('✓ Test 3: Hardcoded Color Patterns');
    const scriptContent = html;
    const isLightMatches = scriptContent.match(/isLight\s*\?/g) || [];
    const hardcodedColors = scriptContent.match(/['"]#[0-9a-f]{3,6}['"]/gi) || [];
    
    console.log(`  Found ${isLightMatches.length} isLight ternaries (should be low)`);
    console.log(`  Found ${hardcodedColors.length} hardcoded colors (should be low)\n`);

    // Test 4: Check for CSS variables
    console.log('✓ Test 4: CSS Variable Usage');
    const varMatches = scriptContent.match(/var\(--[a-z-]+\)/gi) || [];
    console.log(`  Found ${varMatches.length} CSS variable references (should be high)\n`);

    // Summary
    console.log('═'.repeat(70));
    console.log('✨ Theme System Status');
    console.log('═'.repeat(70));
    console.log(`\n✅ Frontend is running on: ${url}`);
    console.log('\n🧪 Manual Testing Steps:');
    console.log('  1. Open browser to http://localhost:5180');
    console.log('  2. Look for theme toggle (usually in navbar)');
    console.log('  3. Switch between light and dark modes');
    console.log('  4. Verify:');
    console.log('     - Light mode: white backgrounds, dark text');
    console.log('     - Dark mode: dark backgrounds, light text');
    console.log('  5. Refresh page - theme should persist');
    console.log('  6. Check inspector → Application → localStorage');
    console.log('     - Should see "preploop-theme" key set to "light" or "dark"\n');

    console.log('📊 Metrics:');
    console.log(`  - isLight patterns: ${isLightMatches.length}`);
    console.log(`  - CSS variables: ${varMatches.length}`);
    console.log(`  - Hardcoded colors: ${hardcodedColors.length}\n`);

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    console.error('\n💡 Make sure the dev server is running:');
    console.error('  npm run dev --prefix frontend\n');
    process.exit(1);
  }
}

testThemeSystem().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
