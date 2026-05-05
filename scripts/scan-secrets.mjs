#!/usr/bin/env node
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----[\r\n]/ },
  { name: 'Generic Secret', pattern: /(secret|password|token|api[_-]?key)[ \t]*[:=][ \t]*['"][^\r\n'"]{20,}['"]/i },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'Supabase Key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
];

const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'backups',
  'test',
  'scripts', // Ignore test scripts with placeholder values
];

const SCANNED_EXTENSIONS = new Set(['.js', '.ts', '.json', '.env', '.yml', '.yaml', '.mjs', '.cjs']);

function shouldIgnore(filepath) {
  const segments = filepath.split(path.sep);
  return segments.some((segment) => IGNORE_PATTERNS.includes(segment));
}

function isAllowedPlaceholder(match) {
  const normalized = match.toLowerCase();
  return [
    'your-',
    'example',
    'test-',
    'dummy',
    'placeholder',
    'minimum-32-characters',
  ].some((marker) => normalized.includes(marker));
}

async function listScannableFiles(dir = process.cwd()) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldIgnore(fullPath)) continue;

    if (entry.isDirectory()) {
      files.push(...await listScannableFiles(fullPath));
      continue;
    }

    if (entry.isFile() && SCANNED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.relative(process.cwd(), fullPath));
    }
  }

  return files;
}

async function scanFile(filepath) {
  try {
    const content = await readFile(filepath, 'utf-8');
    const findings = [];

    for (const { name, pattern } of SECRET_PATTERNS) {
      const matches = content.match(pattern);
      if (matches && !isAllowedPlaceholder(matches[0])) {
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

  const files = await listScannableFiles();

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
