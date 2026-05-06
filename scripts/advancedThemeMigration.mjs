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
 * Advanced pattern matcher that replaces isLight ternaries with CSS variables
 */
class ThemeMigrator {
  constructor() {
    this.replacements = [
      // Direct style object patterns with isLight
      {
        name: 'background-ternary-style-object',
        pattern: /style=\{\{([^}]*?)\s*background:\s*isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
        handler: (match, prefix, light, dark) => {
          const variable = this.mapColorsToVariable(light, dark, 'bg');
          return `style={{${prefix} background: '${variable}'`;
        }
      },
      {
        name: 'color-ternary-style-object',
        pattern: /style=\{\{([^}]*?)\s*color:\s*isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
        handler: (match, prefix, light, dark) => {
          const variable = this.mapColorsToVariable(light, dark, 'text');
          return `style={{${prefix} color: '${variable}'`;
        }
      },

      // Separate property patterns
      {
        name: 'background-property',
        pattern: /\s+background:\s*isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
        handler: (match, light, dark) => {
          const variable = this.mapColorsToVariable(light, dark, 'bg');
          return ` background: '${variable}'`;
        }
      },
      {
        name: 'color-property',
        pattern: /\s+color:\s*isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
        handler: (match, light, dark) => {
          const variable = this.mapColorsToVariable(light, dark, 'text');
          return ` color: '${variable}'`;
        }
      },
      {
        name: 'borderColor-property',
        pattern: /\s+borderColor:\s*isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
        handler: (match, light, dark) => {
          const variable = this.mapColorsToVariable(light, dark, 'border');
          return ` borderColor: '${variable}'`;
        }
      },
      {
        name: 'backgroundColor-property',
        pattern: /\s+backgroundColor:\s*isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
        handler: (match, light, dark) => {
          const variable = this.mapColorsToVariable(light, dark, 'bg');
          return ` backgroundColor: '${variable}'`;
        }
      },
      {
        name: 'border-property',
        pattern: /\s+border:\s*isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
        handler: (match, light, dark) => {
          // Handle "1px solid color" patterns
          if (light.includes('solid') && dark.includes('solid')) {
            return ` border: '1px solid var(--border)'`;
          }
          const variable = this.mapColorsToVariable(light, dark, 'border');
          return ` border: '${variable}'`;
        }
      },
      {
        name: 'boxShadow-property',
        pattern: /\s+boxShadow:\s*isLight\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g,
        handler: (match, light, dark) => {
          return ` boxShadow: 'var(--shadow-md)'`;
        }
      },
    ];
  }

  /**
   * Map light/dark color pair to CSS variable
   */
  mapColorsToVariable(light, dark, category = 'bg') {
    const key = `${this.normalizeColor(light)}|${this.normalizeColor(dark)}`;

    // Exact matches
    const exactMappings = {
      // Background exact matches
      '#f9f9f9|#0a0a0a': 'var(--bg-secondary)',
      '#f8f9fa|#030303': 'var(--bg-primary)',
      '#fafafa|#030303': 'var(--bg-primary)',
      '#f5f5f5|#0a0a0a': 'var(--bg-secondary)',
      '#ffffff|#1a1a1a': 'var(--bg-card)',
      'white|#1a1a1a': 'var(--bg-card)',
      '#f3f4f6|#0a0a0a': 'var(--bg-tertiary)',
      '#f0f0f0|#121212': 'var(--bg-tertiary)',
      '#ffffff|#030303': 'var(--bg-primary)',
      'white|#030303': 'var(--bg-primary)',

      // Text exact matches
      '#1a1a2e|#ffffff': 'var(--text-primary)',
      '#1a1a2e|white': 'var(--text-primary)',
      '#1a1a1a|#ffffff': 'var(--text-primary)',
      '#1a1a1a|white': 'var(--text-primary)',
      '#111111|#ffffff': 'var(--text-primary)',
      '#111111|white': 'var(--text-primary)',
      '#333333|#a1a1aa': 'var(--text-secondary)',

      // Border matches
      'rgba(26,26,26,0.08)|rgba(255,255,255,0.1)': 'var(--border)',
      'rgba( 26, 26, 26, 0.08 )|rgba( 255, 255, 255, 0.1 )': 'var(--border)',
    };

    if (exactMappings[key]) {
      return exactMappings[key];
    }

    // Pattern-based fallbacks
    if (category === 'bg') {
      if ((light.includes('f') && light !== '#fff') || light === '#fff') {
        return 'var(--bg-primary)';
      }
      return 'var(--bg-secondary)';
    } else if (category === 'text') {
      if (light === '#fff' || light === 'white' || light.includes('ffffff')) {
        return 'var(--text-primary)';
      }
      return 'var(--text-primary)';
    } else if (category === 'border') {
      return 'var(--border)';
    }

    return 'var(--bg-primary)'; // Safe fallback
  }

  /**
   * Normalize color format for comparison
   */
  normalizeColor(color) {
    return color.trim().toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Migrate a file
   */
  migrateFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;
      let changeCount = 0;
      const appliedPatterns = [];

      // Apply each pattern
      this.replacements.forEach(({ name, pattern, handler }) => {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, handler);
          changeCount += matches.length;
          appliedPatterns.push(name);
        }
      });

      // Write back if changes made
      if (changeCount > 0) {
        fs.writeFileSync(filePath, content, 'utf-8');
      }

      return {
        success: true,
        changeCount,
        appliedPatterns: [...new Set(appliedPatterns)]
      };
    } catch (err) {
      return {
        success: false,
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
      if (item.isDirectory()) {
        files.push(...findJSXFiles(fullPath));
      } else if (item.name.endsWith('.jsx') || item.name.endsWith('.js')) {
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
async function migrateAll() {
  console.log('🔄 Advanced Theme Migration (isLight ternaries → CSS variables)\n');

  const allFiles = [
    ...findJSXFiles(COMPONENTS_DIR),
    ...findJSXFiles(PAGES_DIR),
    ...findJSXFiles(HOOKS_DIR),
  ];

  const migrator = new ThemeMigrator();
  let totalMigrated = 0;
  let totalChanges = 0;
  const results = [];

  console.log(`📁 Scanning ${allFiles.length} files...\n`);

  allFiles.forEach((filePath) => {
    const result = migrator.migrateFile(filePath);

    if (result.changeCount > 0) {
      totalMigrated++;
      totalChanges += result.changeCount;
      const fileName = path.relative(path.join(__dirname, '..'), filePath);
      results.push({ fileName, ...result });

      console.log(`✅ ${fileName}`);
      console.log(`   ${result.changeCount} changes applied`);
      result.appliedPatterns.slice(0, 3).forEach(p => {
        console.log(`   • ${p.replace(/-/g, ' ')}`);
      });
      if (result.appliedPatterns.length > 3) {
        console.log(`   • ... and ${result.appliedPatterns.length - 3} more`);
      }
      console.log('');
    }
  });

  console.log('═'.repeat(70));
  console.log('✨ MIGRATION COMPLETE');
  console.log('═'.repeat(70));
  console.log(`\n✅ Files migrated: ${totalMigrated}`);
  console.log(`✅ Total changes: ${totalChanges}`);
  console.log(`✅ Coverage: ${totalMigrated}/88 files (${Math.round((totalMigrated / 88) * 100)}%)\n`);

  console.log('🚀 NEXT: Run verification\n');
  console.log('  1. npm run lint --prefix frontend');
  console.log('  2. npm run build --prefix frontend');
  console.log('  3. npm run dev --prefix frontend');
  console.log('  4. Test light mode toggle\n');
}

migrateAll().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
