import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMigrationReport } from '../frontend/src/utils/themeColorMigration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../frontend/src/components');
const PAGES_DIR = path.join(__dirname, '../frontend/src/pages');

function findJSXFiles(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...findJSXFiles(fullPath));
      } else if (item.name.endsWith('.jsx')) {
        files.push(fullPath);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  return files;
}

console.log('🔍 Scanning for hardcoded colors and light mode issues...\n');

const jsxFiles = [
  ...findJSXFiles(COMPONENTS_DIR),
  ...findJSXFiles(PAGES_DIR),
];

console.log(`Found ${jsxFiles.length} JSX files to scan\n`);

let totalIssues = 0;
const issuesByType = {};
const filesWithIssues = [];

jsxFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.relative(__dirname, filePath);
    
    const issues = generateMigrationReport(content, fileName);
    
    if (issues.length > 0) {
      filesWithIssues.push({
        file: fileName,
        issues
      });
      totalIssues += issues.length;
      
      issues.forEach(issue => {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      });
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
});

// Print report
console.log('═'.repeat(70));
console.log('THEME MIGRATION REPORT');
console.log('═'.repeat(70));

console.log(`\n📊 Summary:`);
console.log(`  Total files with issues: ${filesWithIssues.length}/${jsxFiles.length}`);
console.log(`  Total issues found: ${totalIssues}`);
console.log(`\n  By type:`);
Object.entries(issuesByType).forEach(([type, count]) => {
  console.log(`    - ${type}: ${count}`);
});

// Print detailed issues
console.log(`\n${'═'.repeat(70)}`);
console.log('DETAILED ISSUES');
console.log('═'.repeat(70));

filesWithIssues.slice(0, 15).forEach(({ file, issues }) => {
  console.log(`\n📄 ${file}`);
  issues.forEach(issue => {
    console.log(`  ⚠️  ${issue.type}`);
    console.log(`      Pattern: ${issue.pattern}`);
    console.log(`      Count: ${issue.count}`);
    if (issue.note) {
      console.log(`      Note: ${issue.note}`);
    }
  });
});

if (filesWithIssues.length > 15) {
  console.log(`\n... and ${filesWithIssues.length - 15} more files`);
}

console.log(`\n${'═'.repeat(70)}`);
console.log('RECOMMENDATIONS');
console.log('═'.repeat(70));

console.log(`
1. Replace hardcoded colors with CSS variables:
   Instead of: style={{ background: isLight ? '#f9f9f9' : '#0a0a0a' }}
   Use: style={{ background: 'var(--bg-primary)' }}

2. Use the new useThemeStyles hook for complex logic:
   const { isLight, getThemeValue } = useThemeStyles();
   style={{ color: getThemeValue('#ffffff', '#111111') }}

3. Prefer CSS-only solutions:
   Most styling should be in CSS with CSS variables, not inline styles.

4. Migration priority:
   - High: Navbar, Sidebar, Cards (high visibility)
   - Medium: Widgets, Panels (moderate visibility)
   - Low: Admin panels, rare components
`);

console.log(`${'═'.repeat(70)}\n`);
