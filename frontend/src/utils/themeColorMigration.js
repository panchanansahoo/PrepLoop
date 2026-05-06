/**
 * Theme Color Migration Helper
 * Maps old hardcoded color patterns to new CSS variables
 */

export const colorMappings = {
  // Light mode backgrounds
  '#f8f9fa': 'var(--bg-secondary)',
  '#f3f4f6': 'var(--bg-tertiary)',
  '#f9f9f9': 'var(--bg-tertiary)',
  '#ffffff': 'var(--bg-primary)',
  'white': 'var(--bg-primary)',

  // Dark mode backgrounds
  '#030303': 'var(--bg-primary)',
  '#0a0a0a': 'var(--bg-secondary)',
  '#121212': 'var(--bg-tertiary)',
  '#1a1a1a': 'var(--bg-secondary)',

  // Light mode text
  '#1a1a2e': 'var(--text-primary)',
  '#111111': 'var(--text-primary)',
  '#333333': 'var(--text-secondary)',

  // Status colors
  '#fee2e2': 'rgba(239, 68, 68, 0.1)', // Error light
  '#7f1d1d': 'rgba(127, 29, 29, 0.5)', // Error dark
  '#991b1b': 'var(--color-danger)',
  '#fca5a5': 'rgba(252, 165, 165, 0.8)',

  // Borders & Dividers
  'rgba(0,0,0,0.1)': 'var(--border)',
  'rgba(255,255,255,0.1)': 'var(--border)',
};

/**
 * Convert inline style color to CSS variable
 * @param color - Hex color or color name
 * @param theme - 'light' or 'dark'
 * @returns CSS variable or original color if no mapping
 */
export function migrateColor(color, theme = 'dark') {
  // Check direct mappings
  if (colorMappings[color]) {
    return colorMappings[color];
  }

  // If not found, return original (will be handled by CSS)
  return color;
}

/**
 * Convert isLight ternary style to CSS variables
 * 
 * Before:
 * style={{ background: isLight ? '#f9f9f9' : '#0a0a0a' }}
 * 
 * After:
 * style={{ background: 'var(--bg-tertiary)' }}
 */
export function migrateThemedStyle(darkValue, lightValue) {
  // Try to find common CSS variable
  if (colorMappings[darkValue] && colorMappings[lightValue]) {
    const darkVar = colorMappings[darkValue];
    const lightVar = colorMappings[lightValue];
    
    // If both map to same variable, use that
    if (darkVar === lightVar) {
      return darkVar;
    }
  }

  // If colors are complementary (light/dark pair)
  // Return the variable that applies to both
  const commonVars = {
    'bg': 'var(--bg-primary)',
    'text': 'var(--text-primary)',
    'border': 'var(--border)',
  };

  // Return most likely variable based on color values
  if (darkValue === '#030303' || darkValue === '#0a0a0a' || darkValue === '#121212') {
    if (lightValue === '#f9f9f9' || lightValue === '#f8f9fa' || lightValue === '#fafafa') {
      return 'var(--bg-primary)';
    }
  }

  return null; // Manual review needed
}

/**
 * Get all hardcoded color patterns to search for
 */
export const hardcodedColorPatterns = [
  // Dark backgrounds
  /#030303/g,
  /#0a0a0a/g,
  /#0a0a0c/g,
  /#121212/g,
  /#121216/g,
  /#1a1a1a/g,
  /#1a1a2e/g,

  // Light backgrounds
  /#f8f9fa/g,
  /#f3f4f6/g,
  /#f9f9f9/g,
  /#fafafa/g,
  /#f5f5f5/g,
  /#f0f0f0/g,

  // White/black
  /#ffffff/g,

  // RGB patterns (dark)
  /rgb\(3,\s*3,\s*3\)/g,
  /rgb\(10,\s*10,\s*10\)/g,
  /rgb\(18,\s*18,\s*18\)/g,

  // RGB patterns (light)
  /rgb\(248,\s*250,\s*252\)/g,
  /rgb\(244,\s*244,\s*245\)/g,
  /rgb\(255,\s*255,\s*255\)/g,
];

/**
 * Generate migration report for a component file
 */
export function generateMigrationReport(fileContent, fileName) {
  const issues = [];
  
  // Find all hardcoded colors
  hardcodedColorPatterns.forEach((pattern) => {
    const matches = fileContent.match(pattern);
    if (matches) {
      issues.push({
        file: fileName,
        pattern: pattern.toString(),
        count: matches.length,
        type: 'hardcoded-color'
      });
    }
  });

  // Find isLight ternaries (manual review needed)
  const isLightPattern = /isLight\s*\?/g;
  const isLightMatches = fileContent.match(isLightPattern);
  if (isLightMatches) {
    issues.push({
      file: fileName,
      pattern: 'isLight ? ... : ...',
      count: isLightMatches.length,
      type: 'isLight-ternary',
      note: 'Manual review needed - may need to replace with CSS variables'
    });
  }

  return issues;
}
