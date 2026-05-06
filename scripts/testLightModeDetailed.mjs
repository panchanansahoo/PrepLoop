#!/usr/bin/env node

/**
 * Comprehensive light mode diagnostic and testing script
 * This script validates the entire light mode theme system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testCSSSelectors() {
  log('blue', '📋 TESTING CSS SELECTORS IN unified-theme.css');

  const cssPath = path.join(rootDir, 'frontend', 'src', 'unified-theme.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  const tests = [
    {
      name: 'Light mode CSS variables defined',
      pattern: /html\[data-theme="light"\]\s*,\s*\[data-theme="light"\]\s*{[\s\S]*?--bg-primary:/,
      required: true,
    },
    {
      name: 'Root element selector (html[data-theme="light"])',
      pattern: /html\[data-theme="light"\]/,
      required: true,
    },
    {
      name: 'Body element override with html selector',
      pattern: /html\[data-theme="light"\]\s+body/,
      required: true,
    },
    {
      name: 'Background color aggressive override',
      pattern: /html\[data-theme="light"\]\s+\[style\*="background/,
      required: true,
    },
    {
      name: 'Text color overrides in light mode',
      pattern: /--text-primary:\s*#111111/,
      required: true,
    },
    {
      name: 'Background primary light color',
      pattern: /--bg-primary:\s*#fafafa/,
      required: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    if (test.pattern.test(cssContent)) {
      log('green', `✓ ${test.name}`);
      passed++;
    } else {
      log('red', `✗ ${test.name}`);
      failed++;
    }
  });

  log('cyan', `\nCSS Selectors: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

function testThemeContext() {
  log('blue', '📋 TESTING ThemeContext.jsx SETUP');

  const contextPath = path.join(
    rootDir,
    'frontend',
    'src',
    'context',
    'ThemeContext.jsx'
  );
  const contextContent = fs.readFileSync(contextPath, 'utf-8');

  const tests = [
    {
      name: 'ThemeProvider wrapper exists',
      pattern: /export.*const\s+ThemeProvider/,
    },
    {
      name: 'useTheme hook exported',
      pattern: /export.*const\s+useTheme/,
    },
    {
      name: 'data-theme attribute set on document.documentElement',
      pattern: /document\.documentElement\.setAttribute.*data-theme/,
    },
    {
      name: 'localStorage persistence implemented',
      pattern: /localStorage\.setItem.*preploop-theme/,
    },
    {
      name: 'System preference detection (prefers-color-scheme)',
      pattern: /prefers-color-scheme/,
    },
    {
      name: 'Toggle theme function implemented',
      pattern: /const\s+toggleTheme\s*=|function\s+toggleTheme/,
    },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    if (test.pattern.test(contextContent)) {
      log('green', `✓ ${test.name}`);
      passed++;
    } else {
      log('red', `✗ ${test.name}`);
      failed++;
    }
  });

  log('cyan', `\nThemeContext: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

function testNavbarThemeToggle() {
  log('blue', '📋 TESTING Navbar.jsx THEME TOGGLE');

  const navbarPath = path.join(
    rootDir,
    'frontend',
    'src',
    'components',
    'Navbar.jsx'
  );
  const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

  const tests = [
    {
      name: 'useTheme hook imported',
      pattern: /import\s+{.*useTheme.*}/,
    },
    {
      name: 'useTheme hook used in component',
      pattern: /const\s+{.*theme.*toggleTheme.*}\s*=\s*useTheme/,
    },
    {
      name: 'Toggle button onClick handler',
      pattern: /onClick\s*=\s*{.*toggleTheme/,
    },
    {
      name: 'Theme icon conditional rendering',
      pattern: /theme\s*===.*light/,
    },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    if (test.pattern.test(navbarContent)) {
      log('green', `✓ ${test.name}`);
      passed++;
    } else {
      log('red', `✗ ${test.name}`);
      failed++;
    }
  });

  log('cyan', `\nNavbar: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

function testImports() {
  log('blue', '📋 TESTING CSS IMPORTS');

  const indexCSSPath = path.join(rootDir, 'frontend', 'src', 'index.css');
  const indexContent = fs.readFileSync(indexCSSPath, 'utf-8');

  const tests = [
    {
      name: 'unified-theme.css imported in index.css',
      pattern: /@import.*unified-theme\.css/,
    },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    if (test.pattern.test(indexContent)) {
      log('green', `✓ ${test.name}`);
      passed++;
    } else {
      log('red', `✗ ${test.name}`);
      failed++;
    }
  });

  log('cyan', `\nImports: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

function analyzeCSS() {
  log('blue', '📊 CSS ANALYSIS FOR LIGHT MODE');

  const cssPath = path.join(rootDir, 'frontend', 'src', 'unified-theme.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Count CSS variable definitions
  const lightModeVarsMatch = cssContent.match(
    /html\[data-theme="light"\]\s*,\s*\[data-theme="light"\]\s*{([\s\S]*?)}/
  );
  if (lightModeVarsMatch) {
    const varCount = (lightModeVarsMatch[1].match(/--[\w-]+:/g) || []).length;
    log('cyan', `✓ Light mode CSS variables defined: ${varCount}`);
  }

  // Check for aggressive overrides
  const htmlSelectorsCount = (cssContent.match(/html\[data-theme="light"\]/g) ||
    []).length;
  log('cyan', `✓ html[data-theme="light"] selectors found: ${htmlSelectorsCount}`);

  // Check for attribute overrides
  const attributeOverridesMatch = cssContent.match(
    /html\[data-theme="light"\]\s+\[style\*=/g
  );
  const attributeCount = attributeOverridesMatch ? attributeOverridesMatch.length : 0;
  log('cyan', `✓ Inline style overrides: ${attributeCount}`);

  log('cyan', '\n');
}

async function main() {
  log('cyan', '\n╔════════════════════════════════════════╗');
  log('cyan', '║   LIGHT MODE COMPREHENSIVE DIAGNOSTIC  ║');
  log('cyan', '╚════════════════════════════════════════╝\n');

  try {
    const cssSelectors = testCSSSelectors();
    const themeContext = testThemeContext();
    const navbar = testNavbarThemeToggle();
    const imports = testImports();
    analyzeCSS();

    log('cyan', '╔════════════════════════════════════════╗');
    log('cyan', '║         SUMMARY                        ║');
    log('cyan', '╚════════════════════════════════════════╝\n');

    if (cssSelectors && themeContext && navbar && imports) {
      log('green', '✓ All critical systems pass validation');
      log('green',
        '\n🎉 Light mode should be working correctly!');
      log('cyan',
        '\nNext steps:');
      log('cyan',
        '1. Open http://localhost:5178 in your browser');
      log('cyan',
        '2. Click the theme toggle button (sun/moon icon)');
      log('cyan',
        '3. Verify colors change to light mode');
      log('cyan',
        '4. Check DevTools: html element should have data-theme="light"');
      log('cyan',
        '5. Refresh page - light mode should persist');
      process.exit(0);
    } else {
      log('red', '✗ Some critical systems failed validation');
      log('red', 'Please review the errors above');
      process.exit(1);
    }
  } catch (error) {
    log('red', `\n✗ Error during diagnostic: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
