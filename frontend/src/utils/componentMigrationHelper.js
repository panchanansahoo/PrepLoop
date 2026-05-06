/**
 * Automatic Theme Migration Helper
 * Helps convert isLight ternaries to CSS variables
 * 
 * Usage patterns to replace:
 * 1. style={{ background: isLight ? '#f9f9f9' : '#0a0a0a' }}
 *    → style={{ background: 'var(--bg-primary)' }}
 * 
 * 2. style={{ color: isLight ? '#1a1a2e' : '#ffffff' }}
 *    → style={{ color: 'var(--text-primary)' }}
 * 
 * 3. style={{ borderColor: isLight ? 'rgba(26,26,26,0.08)' : 'rgba(255,255,255,0.1)' }}
 *    → style={{ borderColor: 'var(--border)' }}
 */

const COMMON_TERNARY_PATTERNS = [
  // Background patterns (dark → light)
  {
    pattern: /background:\s*isLight\s*\?\s*['"]#f9f9f9['"]\s*:\s*['"]#0a0a0a['"]/g,
    replacement: "background: 'var(--bg-secondary)'",
    description: 'Background: light gray ↔ dark gray'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]#f8f9fa['"]\s*:\s*['"]#030303['"]/g,
    replacement: "background: 'var(--bg-primary)'",
    description: 'Background: white ↔ black'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]white['"]\s*:\s*['"]#1a1a1a['"]/g,
    replacement: "background: 'var(--bg-card)'",
    description: 'Background: white ↔ dark card'
  },
  {
    pattern: /background:\s*isLight\s*\?\s*['"]white['"]\s*:\s*['"]#[0-9a-f]{6}['"]/g,
    replacement: "background: 'var(--bg-primary)'",
    description: 'Background: white ↔ dark color'
  },

  // Color patterns (dark → light)
  {
    pattern: /color:\s*isLight\s*\?\s*['"]#1a1a2e['"]\s*:\s*['"]white['"]/g,
    replacement: "color: 'var(--text-primary)'",
    description: 'Color: dark ↔ white'
  },
  {
    pattern: /color:\s*isLight\s*\?\s*['"]#1a1a1a['"]\s*:\s*['"]#fff['"]/g,
    replacement: "color: 'var(--text-primary)'",
    description: 'Color: dark ↔ white (short form)'
  },
  {
    pattern: /color:\s*isLight\s*\?\s*['"]#111111['"]\s*:\s*['"]#ffffff['"]/g,
    replacement: "color: 'var(--text-primary)'",
    description: 'Color: light text ↔ dark text'
  },

  // Border patterns
  {
    pattern: /borderColor:\s*isLight\s*\?\s*['"]rgba\(26,26,26,0\.08\)['"]\s*:\s*['"]rgba\(255,255,255,0\.1\)['"]/g,
    replacement: "borderColor: 'var(--border)'",
    description: 'Border: light ↔ dark'
  },

  // Box shadow patterns
  {
    pattern: /boxShadow:\s*isLight\s*\?\s*['"]0\s+\d+px\s+\d+px\s+rgba\(0,0,0,0\.\d+\)['"]\s*:\s*['"]0\s+\d+px\s+\d+px\s+rgba\(0,0,0,0\.\d+\)['"]/g,
    replacement: "boxShadow: '0 2px 8px var(--shadow-light)'",
    description: 'Box shadow: light ↔ dark'
  },
];

/**
 * Migrate a single component file
 * @param {string} content - File content
 * @returns {string} Migrated content
 */
export function migrateComponentFile(content) {
  let migrated = content;

  COMMON_TERNARY_PATTERNS.forEach(({ pattern, replacement, description }) => {
    if (pattern.test(migrated)) {
      console.log(`  ✓ Applied: ${description}`);
      migrated = migrated.replace(pattern, replacement);
    }
  });

  return migrated;
}

/**
 * Suggest CSS variables for complex ternaries that can't be auto-migrated
 */
export function suggestVariableForTernary(darkValue, lightValue) {
  const suggestions = {
    // Common background combinations
    ['#0a0a0a|#f9f9f9']: 'var(--bg-secondary)',
    ['#030303|#f8f9fa']: 'var(--bg-primary)',
    ['#121212|#f0f0f0']: 'var(--bg-tertiary)',

    // Common text combinations
    ['#ffffff|#1a1a2e']: 'var(--text-primary)',
    ['white|#111111']: 'var(--text-primary)',

    // Common border combinations
    ['rgba(255,255,255,0.1)|rgba(26,26,26,0.08)']: 'var(--border)',
  };

  const key = `${darkValue}|${lightValue}`;
  return suggestions[key] || null;
}

/**
 * Generate migration summary
 */
export function generateMigrationSummary(originalContent, migratedContent) {
  const originalIsLightCount = (originalContent.match(/isLight\s*\?/g) || []).length;
  const migratedIsLightCount = (migratedContent.match(/isLight\s*\?/g) || []).length;
  const reduced = originalIsLightCount - migratedIsLightCount;

  return {
    originalIsLightCount,
    migratedIsLightCount,
    reduced,
    percentage: reduced > 0 ? Math.round((reduced / originalIsLightCount) * 100) : 0,
  };
}
