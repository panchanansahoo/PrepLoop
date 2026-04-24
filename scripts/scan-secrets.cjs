#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { glob } from 'glob';

const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Generic Secret', pattern: /(secret|password|token|api[_-]?key)\s*[:=]\s*['"][^'"]{20,}['"]/i },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'Supabase Key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
];

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/backups/**',
];

async function scanFile(filepath) {
  try {
    const content = await readFile(filepath, 'utf-8');
    const findings = [];

    for (const { name, pattern } of SECRET_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({ file: filepath, type: name, match: matches[0].substring(0, 50) });
      }
    }

    return findings;
  } catch (error) {
    return [];
  }
}

async function scanSecrets() {
  console.log('🔍 Scanning for exposed secrets...\n');

  const files = await glob('**/*.{js,ts,json,env,yml,yaml}', {
    ignore: IGNORE_PATTERNS,
    nodir: true,
  });

  const allFindings = [];

  for (const file of files) {
    const findings = await scanFile(file);
    allFindings.push(...findings);
  }

  if (allFindings.length > 0) {
    console.error('❌ Found potential secrets:\n');
    for (const finding of allFindings) {
      console.error(`  ${finding.file}`);
      console.error(`    Type: ${finding.type}`);
      console.error(`    Match: ${finding.match}...\n`);
    }
    process.exit(1);
  }

  console.log('✅ No secrets found');
}

scanSecrets();
