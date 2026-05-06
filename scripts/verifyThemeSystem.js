#!/usr/bin/env node

/**
 * Theme System Verification Script
 * Validates that the light/dark mode system is properly implemented
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, '../frontend/src');

console.log('🔍 Verifying PrepLoop Light/Dark Mode System\n');

const checks = [];

// Check 1: Unified theme file exists
const unifiedThemePath = path.join(FRONTEND_DIR, 'unified-theme.css');
const unifiedThemeExists = fs.existsSync(unifiedThemePath);
checks.push({
  name: 'Unified theme CSS file exists',
  passed: unifiedThemeExists,
  details: unifiedThemeExists ? `✅ ${unifiedThemePath}` : `❌ Missing ${unifiedThemePath}`
});

if (unifiedThemeExists) {
  const content = fs.readFileSync(unifiedThemePath, 'utf-8');
  
  // Check 2: Theme variables defined for dark mode
  const hasDarkVars = content.includes('--bg-primary: #030303');
  checks.push({
    name: 'Dark mode variables defined',
    passed: hasDarkVars,
    details: hasDarkVars ? '✅ Dark mode CSS variables found' : '❌ Dark mode variables missing'
  });
  
  // Check 3: Theme variables defined for light mode
  const hasLightVars = content.includes('[data-theme="light"]') && content.includes('--bg-primary: #fafafa');
  checks.push({
    name: 'Light mode variables defined',
    passed: hasLightVars,
    details: hasLightVars ? '✅ Light mode CSS variables found' : '❌ Light mode variables missing'
  });
  
  // Check 4: Color scheme property set
  const hasColorScheme = content.includes('color-scheme: dark') && content.includes('color-scheme: light');
  checks.push({
    name: 'Color scheme property set',
    passed: hasColorScheme,
    details: hasColorScheme ? '✅ color-scheme set for both modes' : '❌ color-scheme missing'
  });
  
  // Check 5: Component overrides for light mode
  const hasComponentOverrides = content.includes('[data-theme="light"] .navbar') || 
                                 content.includes('[data-theme="light"] .sidebar') ||
                                 content.includes('[data-theme="light"] .card');
  checks.push({
    name: 'Component-specific light mode overrides',
    passed: hasComponentOverrides,
    details: hasComponentOverrides ? '✅ Component overrides found' : '⚠️  No component-specific overrides'
  });
}

// Check 6: Index CSS imports unified theme
const indexCssPath = path.join(FRONTEND_DIR, 'index.css');
const indexContent = fs.readFileSync(indexCssPath, 'utf-8');
const importsUnified = indexContent.includes('@import "./unified-theme.css"');
checks.push({
  name: 'Index.css imports unified theme',
  passed: importsUnified,
  details: importsUnified ? '✅ index.css imports unified-theme.css' : '❌ Missing unified theme import'
});

// Check 7: App CSS doesn't have conflicting imports
const appCssPath = path.join(FRONTEND_DIR, 'App.css');
const appContent = fs.readFileSync(appCssPath, 'utf-8');
const noConflictingImports = !appContent.includes("@import './light-theme.css'") &&
                              !appContent.includes("@import './light-mode-aggressive.css'");
checks.push({
  name: 'App.css has no conflicting imports',
  passed: noConflictingImports,
  details: noConflictingImports ? '✅ No conflicting imports in App.css' : '❌ Conflicting imports found'
});

// Check 8: ThemeContext exists and has proper structure
const themeContextPath = path.join(FRONTEND_DIR, 'context/ThemeContext.jsx');
const themeContextExists = fs.existsSync(themeContextPath);
checks.push({
  name: 'ThemeContext file exists',
  passed: themeContextExists,
  details: themeContextExists ? '✅ ThemeContext.jsx found' : '❌ ThemeContext.jsx missing'
});

if (themeContextExists) {
  const themeContextContent = fs.readFileSync(themeContextPath, 'utf-8');
  
  // Check 9: ThemeContext has system preference detection
  const hasSystemPreference = themeContextContent.includes('prefers-color-scheme');
  checks.push({
    name: 'ThemeContext detects system preference',
    passed: hasSystemPreference,
    details: hasSystemPreference ? '✅ System preference detection active' : '❌ Missing system preference detection'
  });
  
  // Check 10: ThemeContext uses correct localStorage key
  const hasCorrectKey = themeContextContent.includes("'preploop-theme'");
  checks.push({
    name: 'ThemeContext uses namespaced localStorage key',
    passed: hasCorrectKey,
    details: hasCorrectKey ? "✅ Uses 'preploop-theme' key" : "❌ Wrong localStorage key"
  });
  
  // Check 11: ThemeContext sets colorScheme
  const hasColorSchemeProperty = themeContextContent.includes('colorScheme');
  checks.push({
    name: 'ThemeContext sets colorScheme property',
    passed: hasColorSchemeProperty,
    details: hasColorSchemeProperty ? '✅ colorScheme property set' : '❌ colorScheme not set'
  });
  
  // Check 12: ThemeContext has toggleTheme function
  const hasToggleTheme = themeContextContent.includes('toggleTheme');
  checks.push({
    name: 'ThemeContext exports toggleTheme',
    passed: hasToggleTheme,
    details: hasToggleTheme ? '✅ toggleTheme function available' : '❌ toggleTheme missing'
  });
}

// Check 13: App.jsx wraps with ThemeProvider
const appJsxPath = path.join(FRONTEND_DIR, 'App.jsx');
const appJsxContent = fs.readFileSync(appJsxPath, 'utf-8');
const hasThemeProvider = appJsxContent.includes('<ThemeProvider>') || appJsxContent.includes('ThemeProvider');
checks.push({
  name: 'App.jsx uses ThemeProvider',
  passed: hasThemeProvider,
  details: hasThemeProvider ? '✅ ThemeProvider wraps App' : '❌ ThemeProvider not found'
});

// Print results
console.log('═'.repeat(60));
console.log('VERIFICATION RESULTS');
console.log('═'.repeat(60));

let passCount = 0;
let totalCount = checks.length;

checks.forEach((check, index) => {
  const status = check.passed ? '✅' : '❌';
  console.log(`\n${index + 1}. ${status} ${check.name}`);
  console.log(`   ${check.details}`);
  if (check.passed) passCount++;
});

console.log('\n' + '═'.repeat(60));
console.log(`SUMMARY: ${passCount}/${totalCount} checks passed`);
console.log('═'.repeat(60));

if (passCount === totalCount) {
  console.log('\n🎉 All checks passed! Light/Dark mode system is properly configured.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalCount - passCount} check(s) failed. Please review the details above.\n`);
  process.exit(1);
}
