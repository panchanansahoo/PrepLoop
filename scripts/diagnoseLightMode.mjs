#!/usr/bin/env node

/**
 * Diagnostic script to check light/dark mode system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔍 Light/Dark Mode Diagnostic\n');

// Check 1: Verify ThemeContext.jsx exists and has toggleTheme
const themeContextPath = path.join(__dirname, '../frontend/src/context/ThemeContext.jsx');
console.log('1. Checking ThemeContext.jsx...');
if (fs.existsSync(themeContextPath)) {
  const content = fs.readFileSync(themeContextPath, 'utf-8');
  const hasToggleTheme = content.includes('toggleTheme');
  const hasDataTheme = content.includes('data-theme');
  const hasLocalStorage = content.includes('localStorage');
  console.log(`   ✅ File exists`);
  console.log(`   ${hasToggleTheme ? '✅' : '❌'} Has toggleTheme function`);
  console.log(`   ${hasDataTheme ? '✅' : '❌'} Sets data-theme attribute`);
  console.log(`   ${hasLocalStorage ? '✅' : '❌'} Uses localStorage\n`);
} else {
  console.log(`   ❌ File not found\n`);
}

// Check 2: Verify unified-theme.css exists
const themeCssPath = path.join(__dirname, '../frontend/src/unified-theme.css');
console.log('2. Checking unified-theme.css...');
if (fs.existsSync(themeCssPath)) {
  const content = fs.readFileSync(themeCssPath, 'utf-8');
  const hasDarkMode = content.includes(':root {');
  const hasLightMode = content.includes('[data-theme="light"]');
  const bgPrimary = content.match(/--bg-primary:\s*([^;]+)/g);
  console.log(`   ✅ File exists`);
  console.log(`   ${hasDarkMode ? '✅' : '❌'} Dark mode (:root) defined`);
  console.log(`   ${hasLightMode ? '✅' : '❌'} Light mode ([data-theme="light"]) defined`);
  if (bgPrimary) {
    console.log(`   ✅ Found ${bgPrimary.length} --bg-primary definitions`);
  }
  console.log('');
} else {
  console.log(`   ❌ File not found\n`);
}

// Check 3: Verify index.css imports unified-theme.css
const indexCssPath = path.join(__dirname, '../frontend/src/index.css');
console.log('3. Checking index.css imports...');
if (fs.existsSync(indexCssPath)) {
  const content = fs.readFileSync(indexCssPath, 'utf-8');
  const hasImport = content.includes('unified-theme.css');
  console.log(`   ✅ File exists`);
  console.log(`   ${hasImport ? '✅' : '❌'} Imports unified-theme.css\n`);
} else {
  console.log(`   ❌ File not found\n`);
}

// Check 4: Verify App.jsx uses ThemeProvider
const appPath = path.join(__dirname, '../frontend/src/App.jsx');
console.log('4. Checking App.jsx ThemeProvider...');
if (fs.existsSync(appPath)) {
  const content = fs.readFileSync(appPath, 'utf-8');
  const hasImport = content.includes('import { ThemeProvider }');
  const hasWrap = content.includes('<ThemeProvider>');
  console.log(`   ✅ File exists`);
  console.log(`   ${hasImport ? '✅' : '❌'} Imports ThemeProvider`);
  console.log(`   ${hasWrap ? '✅' : '❌'} Wraps app with ThemeProvider\n`);
} else {
  console.log(`   ❌ File not found\n`);
}

// Check 5: Check Navbar has theme toggle
const navbarPath = path.join(__dirname, '../frontend/src/components/Navbar.jsx');
console.log('5. Checking Navbar.jsx theme toggle...');
if (fs.existsSync(navbarPath)) {
  const content = fs.readFileSync(navbarPath, 'utf-8');
  const hasUseTheme = content.includes('useTheme');
  const hasToggleTheme = content.includes('toggleTheme');
  console.log(`   ✅ File exists`);
  console.log(`   ${hasUseTheme ? '✅' : '❌'} Uses useTheme hook`);
  console.log(`   ${hasToggleTheme ? '✅' : '❌'} Calls toggleTheme\n`);
} else {
  console.log(`   ❌ File not found\n`);
}

// Summary
console.log('═'.repeat(60));
console.log('SUMMARY');
console.log('═'.repeat(60) + '\n');

const checks = [
  { name: 'ThemeContext.jsx', pass: fs.existsSync(themeContextPath) },
  { name: 'unified-theme.css', pass: fs.existsSync(themeCssPath) },
  { name: 'index.css imports', pass: fs.existsSync(indexCssPath) },
  { name: 'App.jsx ThemeProvider', pass: fs.existsSync(appPath) },
  { name: 'Navbar.jsx toggle', pass: fs.existsSync(navbarPath) }
];

const allPass = checks.every(c => c.pass);

checks.forEach(c => {
  console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
});

console.log('\n' + '═'.repeat(60));

if (allPass) {
  console.log('✅ All files found!\n');
  console.log('COMMON ISSUES:\n');
  console.log('1. Theme stuck on dark:');
  console.log('   - Check browser localStorage');
  console.log('   - Check if data-theme attribute is set on <html>');
  console.log('   - Try clearing browser cache & localStorage\n');
  console.log('2. Toggle not working:');
  console.log('   - Check browser console for errors');
  console.log('   - Verify toggleTheme callback is fired');
  console.log('   - Check if CSS variables are loading\n');
  console.log('3. Light mode colors wrong:');
  console.log('   - Check unified-theme.css [data-theme="light"] section');
  console.log('   - Verify --bg-primary, --text-primary are defined');
  console.log('   - Check !important overrides\n');
} else {
  console.log('❌ Some files missing!\n');
}

console.log('NEXT STEPS:\n');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Run: document.documentElement.getAttribute("data-theme")');
console.log('   - Should show "light" or "dark"');
console.log('4. If stuck on "dark", run: document.documentElement.setAttribute("data-theme", "light")');
console.log('5. Colors should change immediately if CSS is working\n');
