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
 * Surgical migration - only migrates patterns we're SURE about
 */
class SurgicalMigrator {
  constructor() {
    // Only patterns we're 100% confident about
    this.surgicalPatterns = [
      // Pattern 1: background: isLight ? '#fff...' : '#0a0...'
      {
        name: 'background-white-to-black',
        pattern: /background:\s*isLight\s*\?\s*['"]#?f[a-f0-9]{0,5}['"]\s*:\s*['"]#0[a0][a0]['"]/gi,
        replacement: `background: 'var(--bg-primary)'`
      },
      // Pattern 2: color: isLight ? '#1a1a...' : '#fff...'
      {
        name: 'color-dark-to-white',
        pattern: /color:\s*isLight\s*\?\s*['"]#1[a0][a0][a0]['"]\s*:\s*['"]#?f[a-f0-9]{0,5}['"]/gi,
        replacement: `color: 'var(--text-primary)'`
      },
      // Pattern 3: borderColor with rgba patterns
      {
        name: 'border-rgba-pattern',
        pattern: /borderColor:\s*isLight\s*\?\s*['"]rgba\(\s*26,\s*26,\s*26,\s*0\.08\s*\)['"]\s*:\s*['"]rgba\(\s*255,\s*255,\s*255,\s*0\.1\s*\)['"]/gi,
        replacement: `borderColor: 'var(--border)'`
      },
      // Pattern 4: Simple boxing shadow
      {
        name: 'box-shadow-simple',
        pattern: /boxShadow:\s*isLight\s*\?\s*['"][^'"]*['"]\s*:\s*['"][^'"]*['"]/gi,
        replacement: `boxShadow: 'var(--shadow-md)'`
      },
    ];
  }

  /**
   * Safely validate syntax before writing
   */
  validateSyntax(content, originalPath) {
    // Quick heuristic checks
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;

    if (openBraces !== closeBraces || openParens !== closeParens) {
      return false;
    }

    return true;
  }

  /**
   * Migrate file carefully
   */
  migrateFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const original = content;
      let changes = 0;

      // Apply each pattern, one at a time, validating after each
      for (const pattern of this.surgicalPatterns) {
        const matches = content.match(pattern.pattern) || [];
        if (matches.length > 0) {
          const newContent = content.replace(pattern.pattern, pattern.replacement);

          // Validate before applying
          if (this.validateSyntax(newContent, filePath)) {
            content = newContent;
            changes += matches.length;
          } else {
            // Skip this pattern if it breaks syntax
            return { success: true, changes: 0, skipped: true };
          }
        }
      }

      // Only write if validated
      if (content !== original && changes > 0) {
        if (this.validateSyntax(content, filePath)) {
          fs.writeFileSync(filePath, content, 'utf-8');
          return { success: true, changes, skipped: false };
        }
      }

      return { success: true, changes: 0, skipped: false };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

/**
 * Find all JSX/JS files
 */
function findFiles(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.')) {
        files.push(...findFiles(fullPath));
      } else if ((item.name.endsWith('.jsx') || item.name.endsWith('.js')) && !item.name.endsWith('.test.js')) {
        files.push(fullPath);
      }
    });
  } catch (err) {
    // silent
  }
  return files;
}

/**
 * Main
 */
async function migrate() {
  console.log('\n🏥 SURGICAL Theme Migration (validated patterns only)\n');

  const allFiles = [
    ...findFiles(COMPONENTS_DIR),
    ...findFiles(PAGES_DIR),
    ...findFiles(HOOKS_DIR),
  ];

  const migrator = new SurgicalMigrator();
  let migrated = 0;
  let totalChanges = 0;

  console.log(`📁 Scanning ${allFiles.length} files...\n`);

  allFiles.forEach(filePath => {
    const result = migrator.migrateFile(filePath);

    if (result.success && result.changes > 0) {
      migrated++;
      totalChanges += result.changes;
      const fileName = path.relative(path.join(__dirname, '..'), filePath);
      console.log(`✅ ${fileName}: ${result.changes} changes`);
    }
  });

  console.log('\n' + '═'.repeat(70));
  console.log(`✨ Files migrated: ${migrated}`);
  console.log(`✨ Total changes: ${totalChanges}`);
  console.log('═'.repeat(70) + '\n');

  console.log('📊 Coverage: First pass complete\n');
  console.log('🧪 Verify:  npm run build --prefix frontend\n');
}

migrate().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
