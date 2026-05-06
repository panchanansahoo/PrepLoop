#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../frontend/src/components');
const PAGES_DIR = path.join(__dirname, '../frontend/src/pages');
const HOOKS_DIR = path.join(__dirname, '../frontend/src/hooks');

// Color mappings: [dark, light] → CSS variable
const COLOR_PATTERNS = [
  // Background patterns (highest priority)
  {
    pattern: /style=\{\{[^}]*background:\s*isLight\s*\?\s*['"]#f9f9f9['"]\s*:\s*['"]#0a0a0a['"]/g,
    replacement: "style={{ background: 'var(--bg-secondary)'",
    description: 'Background: #f9f9f9 ↔ #0a0a0a → var(--bg-secondary)'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]#f9f9f9['"]\s*:\s*['"]#0a0a0a['"]/g,
    replacement: "background: 'var(--bg-secondary)'",
    description: 'Background: #f9f9f9 ↔ #0a0a0a'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]#f8f9fa['"]\s*:\s*['"]#030303['"]/g,
    replacement: "background: 'var(--bg-primary)'",
    description: 'Background: #f8f9fa ↔ #030303'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]#fafafa['"]\s*:\s*['"]#030303['"]/g,
    replacement: "background: 'var(--bg-primary)'",
    description: 'Background: #fafafa ↔ #030303'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]white['"]\s*:\s*['"]#030303['"]/g,
    replacement: "background: 'var(--bg-primary)'",
    description: 'Background: white ↔ #030303'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]white['"]\s*:\s*['"]#1a1a1a['"]/g,
    replacement: "background: 'var(--bg-card)'",
    description: 'Background: white ↔ #1a1a1a'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]#f3f4f6['"]\s*:\s*['"]#0a0a0a['"]/g,
    replacement: "background: 'var(--bg-tertiary)'",
    description: 'Background: #f3f4f6 ↔ #0a0a0a'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]#f0f0f0['"]\s*:\s*['"]#121212['"]/g,
    replacement: "background: 'var(--bg-tertiary)'",
    description: 'Background: #f0f0f0 ↔ #121212'
  },

  // Text color patterns
  {
    pattern: /color:\s*isLight\s*\?\s*['"]#1a1a2e['"]\s*:\s*['"](?:white|#ffffff)['"]/g,
    replacement: "color: 'var(--text-primary)'",
    description: 'Color: #1a1a2e ↔ white'
  },
  {
    pattern: /color:\s*isLight\s*\?\s*['"]#111111['"]\s*:\s*['"](?:white|#ffffff)['"]/g,
    replacement: "color: 'var(--text-primary)'",
    description: 'Color: #111111 ↔ white'
  },
  {
    pattern: /color:\s*isLight\s*\?\s*['"]#1a1a1a['"]\s*:\s*['"](?:white|#ffffff)['"]/g,
    replacement: "color: 'var(--text-primary)'",
    description: 'Color: #1a1a1a ↔ white'
  },
  {
    pattern: /color:\s*isLight\s*\?\s*['"]#333333['"]\s*:\s*['"]#a1a1aa['"]/g,
    replacement: "color: 'var(--text-secondary)'",
    description: 'Color: #333333 ↔ #a1a1aa'
  },

  // Border color patterns
  {
    pattern: /borderColor:\s*isLight\s*\?\s*['"]rgba\(\s*26,\s*26,\s*26,\s*0\.08\s*\)['"]\s*:\s*['"]rgba\(\s*255,\s*255,\s*255,\s*0\.1\s*\)['"]/g,
    replacement: "borderColor: 'var(--border)'",
    description: 'Border: rgba(26,26,26,0.08) ↔ rgba(255,255,255,0.1)'
  },
  {
    pattern: /border:\s*isLight\s*\?\s*['"]1px solid rgba\(\s*26,\s*26,\s*26,\s*0\.08\s*\)['"]\s*:\s*['"]1px solid rgba\(\s*255,\s*255,\s*255,\s*0\.1\s*\)['"]/g,
    replacement: "border: '1px solid var(--border)'",
    description: 'Border: 1px solid rgba(...)'
  },

  // Box shadow patterns
  {
    pattern: /boxShadow:\s*isLight\s*\?\s*['"]0 2px 8px rgba\(\s*0,\s*0,\s*0,\s*0\.1\s*\)['"]\s*:\s*['"]0 2px 8px rgba\(\s*0,\s*0,\s*0,\s*0\.3\s*\)['"]/g,
    replacement: "boxShadow: 'var(--shadow-md)'",
    description: 'Shadow: box shadow'
  },

  // Replace remaining hardcoded colors with var()
  {
    pattern: /#f9f9f9/g,
    replacement: "var(--bg-secondary)',\n    background: '",
    skip: true,
    description: 'Hardcoded: #f9f9f9 (requires context review)'
  },
  {
    pattern: /#0a0a0a/g,
    replacement: "var(--bg-secondary)',\n    background: '",
    skip: true,
    description: 'Hardcoded: #0a0a0a (requires context review)'
  },
];

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
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  return files;
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let changeCount = 0;
    const appliedPatterns = [];

    // Apply migrations
    COLOR_PATTERNS.forEach(({ pattern, replacement, skip, description }) => {
      if (skip) return;

      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        changeCount++;
        appliedPatterns.push(description);
      }
    });

    // If changes made, write back
    if (changeCount > 0) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return {
        success: true,
        filePath,
        changeCount,
        appliedPatterns
      };
    }

    return null;
  } catch (err) {
    return {
      success: false,
      filePath,
      error: err.message
    };
  }
}

/**
 * Main execution
 */
async function migrateAllComponents() {
  console.log('🔄 Starting automated theme migration...\n');

  const allFiles = [
    ...findJSXFiles(COMPONENTS_DIR),
    ...findJSXFiles(PAGES_DIR),
    ...findJSXFiles(HOOKS_DIR),
  ];

  console.log(`📁 Found ${allFiles.length} JSX files\n`);
  console.log('═'.repeat(70));

  let totalMigrated = 0;
  let totalChanges = 0;
  const results = [];

  allFiles.forEach((filePath, index) => {
    const fileName = path.relative(path.join(__dirname, '..'), filePath);
    const result = migrateFile(filePath);

    if (result) {
      totalMigrated++;
      totalChanges += result.changeCount;
      results.push(result);

      console.log(`\n✅ ${totalMigrated}. ${fileName}`);
      console.log(`   Changes: ${result.changeCount}`);
      result.appliedPatterns.forEach(pattern => {
        console.log(`   • ${pattern}`);
      });
    }
  });

  console.log('\n' + '═'.repeat(70));
  console.log('MIGRATION SUMMARY');
  console.log('═'.repeat(70));
  console.log(`\n✅ Total files migrated: ${totalMigrated}`);
  console.log(`✅ Total changes applied: ${totalChanges}`);
  console.log(`\n📊 Files processed: ${allFiles.length}`);
  console.log(`📊 Files modified: ${totalMigrated}`);
  console.log(`📊 Success rate: ${Math.round((totalMigrated / allFiles.length) * 100)}%`);

  console.log('\n' + '═'.repeat(70));
  console.log('NEXT STEPS');
  console.log('═'.repeat(70));
  console.log(`
1. Run linter to check for any issues:
   npm run lint --prefix frontend

2. Build to verify no CSS errors:
   npm run build --prefix frontend

3. Start dev server to test:
   npm run dev --prefix frontend

4. Test light mode:
   • Click theme toggle
   • Verify all components update colors
   • Check readability in light mode
   • Reload page to verify persistence

5. Manual review of:
   • Components with complex styling
   • Custom theme logic
   • Special cases marked with TODO
`);

  console.log('═'.repeat(70));
  console.log('✨ Migration complete!\n');

  return results;
}

// Run migration
migrateAllComponents().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
