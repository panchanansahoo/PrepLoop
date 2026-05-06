#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../frontend/src/components');
const PAGES_DIR = path.join(__dirname, '../frontend/src/pages');
const HOOKS_DIR = path.join(__dirname, '../frontend/src/hooks');

/**
 * Super aggressive migration for remaining isLight patterns
 */
class SuperAgggressiveMigrator {
  constructor() {
    this.patterns = [];
  }

  /**
   * Find all isLight ternary operations in content
   */
  findAllIsLightTernaries(content) {
    const ternaryPattern = /isLight\s*\?\s*([^:]+?)\s*:\s*([^,\n}]+)/g;
    const matches = [];
    let match;
    while ((match = ternaryPattern.exec(content)) !== null) {
      matches.push({
        full: match[0],
        light: match[1].trim(),
        dark: match[2].trim(),
        index: match.index
      });
    }
    return matches;
  }

  /**
   * Intelligently map any color pair to CSS variables
   */
  smartMapToVariable(lightVal, darkVal) {
    const lightNorm = lightVal.toLowerCase().replace(/\s+/g, '').replace(/["']/g, '');
    const darkNorm = darkVal.toLowerCase().replace(/\s+/g, '').replace(/["']/g, '');

    // Return appropriate CSS variable based on pattern
    if (lightNorm.includes('ffffff') || lightNorm.includes('white') || lightNorm.includes('f9f9f9') || lightNorm.includes('fafafa')) {
      // Light background colors
      if (darkNorm.includes('030303') || darkNorm.includes('0a0a0a') || darkNorm.includes('000000')) {
        return 'var(--bg-primary)';
      }
      return 'var(--bg-secondary)';
    } else if (lightNorm.includes('1a1a') && darkNorm.includes('ffffff')) {
      // Text colors
      return 'var(--text-primary)';
    } else if (lightNorm.includes('333') || lightNorm.includes('666')) {
      return 'var(--text-secondary)';
    } else if (lightNorm.includes('rgba') && lightNorm.includes('26') && darkNorm.includes('rgba') && darkNorm.includes('255')) {
      return 'var(--border)';
    } else if (lightNorm.includes('shadow')) {
      return 'var(--shadow-md)';
    }

    // Safe fallback based on context
    if (lightVal.includes('#') || lightVal.includes('rgb')) {
      return 'var(--bg-primary)'; // Assume color means background
    }
    return 'var(--bg-primary)';
  }

  /**
   * Migrate file with super aggressive approach
   */
  migrateFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // Strategy 1: Match simple style={{...isLight?...}} patterns
      content = content.replace(
        /style=\{\{([^}]*?)isLight\s*\?\s*([^:}]+)\s*:\s*([^}]+)\}\}/gs,
        (match, prefix, light, dark) => {
          const varName = this.smartMapToVariable(light, dark);
          return `style={{${prefix}...getThemeStyles('${varName}')}}`; // placeholder that works
        }
      );

      // Strategy 2: Replace all standalone isLight patterns in property assignments
      // This handles: background: isLight ? '#fff' : '#000'
      content = content.replace(
        /(\w+):\s*isLight\s*\?\s*(['"][^'"]*['"])\s*:\s*(['"][^'"]*['"])/g,
        (match, prop, light, dark) => {
          const cleanLight = light.replace(/['"`]/g, '');
          const cleanDark = dark.replace(/['"`]/g, '');
          const varName = this.smartMapToVariable(cleanLight, cleanDark);
          return `${prop}: '${varName}'`;
        }
      );

      // Strategy 3: Handle className ternaries with color-related classes
      content = content.replace(
        /className=\{`([^`]*)\${isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]}([^`]*)`\}/g,
        (match, pre, light, dark) => {
          // Keep className as-is for now (harder to map CSS classes)
          return match;
        }
      );

      // Strategy 4: Simple case - just remove unnecessary isLight checks
      // For simple ternaries that just return same thing: isLight ? x : x → just return x
      content = content.replace(
        /isLight\s*\?\s*(['"][^'"]*['"]) \s*:\s*\1/g,
        '$1'
      );

      const changeCount = (originalContent.length - content.length) / 100; // rough estimate
      const changed = originalContent !== content;

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
      }

      return {
        success: true,
        changed,
        modified: originalContent !== content
      };
    } catch (err) {
      return {
        success: false,
        changed: false,
        error: err.message
      };
    }
  }
}

/**
 * Find all JSX files
 */
function findJSXFiles(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.')) {
        files.push(...findJSXFiles(fullPath));
      } else if ((item.name.endsWith('.jsx') || item.name.endsWith('.js')) && !item.name.endsWith('.test.js')) {
        files.push(fullPath);
      }
    });
  } catch (err) {
    // Silent
  }
  return files;
}

/**
 * Main execution
 */
async function runMigration() {
  console.log('\n🔥 SUPER AGGRESSIVE Theme Migration (remaining isLight patterns)\n');

  const allFiles = [
    ...findJSXFiles(COMPONENTS_DIR),
    ...findJSXFiles(PAGES_DIR),
    ...findJSXFiles(HOOKS_DIR),
  ];

  const migrator = new SuperAgggressiveMigrator();
  let totalMigrated = 0;

  console.log(`📁 Scanning ${allFiles.length} files for remaining isLight patterns...\n`);

  allFiles.forEach((filePath) => {
    const result = migrator.migrateFile(filePath);

    if (result.modified) {
      totalMigrated++;
      const fileName = path.relative(path.join(__dirname, '..'), filePath);
      console.log(`✅ ${fileName}`);
    }
  });

  console.log('\n' + '═'.repeat(70));
  console.log(`✨ Additional files migrated: ${totalMigrated}`);
  console.log('═'.repeat(70) + '\n');

  if (totalMigrated > 0) {
    console.log('🧪 Run tests to verify:\n');
    console.log('  npm run lint --prefix frontend');
    console.log('  npm run build --prefix frontend\n');
  } else {
    console.log('ℹ️  No remaining simple patterns found.\n');
    console.log('📋 For remaining complex cases, review:\n');
    console.log('  1. Complex ternaries with nested expressions');
    console.log('  2. className patterns');
    console.log('  3. Components with dynamic theme logic\n');
  }
}

runMigration().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
