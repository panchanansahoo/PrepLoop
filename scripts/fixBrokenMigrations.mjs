#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../frontend/src/components');

/**
 * Parse and fix syntax errors from broken migrations
 */
class SyntaxFixer {
  /**
   * Fix broken ...getThemeStyles syntax
   */
  fixBrokenSyntax(content) {
    let fixed = content;

    // Fix: style={{...getThemeStyles('var(--bg-primary)')}} 
    // This should be: style={{ background: 'var(--bg-primary)' }}
    fixed = fixed.replace(
      /style=\{\{\.\.\.getThemeStyles\(['"]var\(--([^)]+)\)['"]\)\}\}/g,
      (match, varName) => {
        const category = varName.startsWith('bg-') ? 'background' : 
                       varName.startsWith('text-') ? 'color' :
                       varName.startsWith('border') ? 'borderColor' : 'background';
        return `style={{ ${category}: 'var(--${varName})' }}`;
      }
    );

    return fixed;
  }

  /**
   * Fix parsing errors from incomplete replacements
   */
  validateAndFix(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const original = content;

      // Fix broken spread syntax
      content = this.fixBrokenSyntax(content);

      // Check if file was actually modified
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { fixed: true };
      }

      return { fixed: false };
    } catch (err) {
      return { fixed: false, error: err.message };
    }
  }
}

/**
 * Revert broken migrations
 */
async function revertAndFix() {
  console.log('\n🔧 Attempting to fix broken migrations...\n');

  const filesToCheck = [
    'frontend/src/pages/Analytics.jsx',
    'frontend/src/pages/AptitudeHub.jsx',
    'frontend/src/pages/AptitudePractice.jsx',
    'frontend/src/pages/AptitudeResults.jsx',
    'frontend/src/pages/DailyChallengesPage.jsx',
    'frontend/src/pages/DailyWin.jsx',
    'frontend/src/pages/ExamHub.jsx',
    'frontend/src/pages/ExamPractice.jsx',
    'frontend/src/pages/Library.jsx',
    'frontend/src/pages/PatternTrainer.jsx',
    'frontend/src/pages/ProblemExplorer.jsx',
    'frontend/src/pages/ReadinessCheck.jsx',
  ];

  const fixer = new SyntaxFixer();
  let fixedCount = 0;

  for (const file of filesToCheck) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const result = fixer.validateAndFix(fullPath);
      if (result.fixed) {
        fixedCount++;
        console.log(`✅ Fixed: ${file}`);
      }
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} files\n`);

  // Now check git status
  console.log('📋 Checking git status for large changes...');
}

revertAndFix().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
