#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

const SECRET_PATTERNS = [
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'JWT', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'Groq API key', pattern: /\bgsk_[A-Za-z0-9]{20,}\b/ },
  { name: 'Razorpay live key', pattern: /\brzp_live_[A-Za-z0-9]{10,}\b/ },
  { name: 'OpenAI or Anthropic API key', pattern: /\bsk-[A-Za-z0-9]{40,}\b/ },
  { name: 'Generic credential assignment', pattern: /\b(?:password|secret|token|api[_-]?key)\b\s*[:=]\s*['"][^'"\r\n]{20,}['"]/i },
];

const ALLOWED_EXTENSIONS = new Set([
  '.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx', '.json', '.yml', '.yaml', '.sql', '.md'
]);

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'backups',
  'coverage',
  '.vite',
  'playwright-report',
  'test-results',
]);

const IGNORED_FILES = new Set([
  'appsettings.json',
  'package-lock.json',
]);

async function collectFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    console.error(`Unable to read directory ${dir}: ${error.message}`);
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) {
        continue;
      }
      const subFiles = await collectFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      if (entry.name.startsWith('.env') || IGNORED_FILES.has(entry.name)) {
        continue;
      }
      const ext = extname(entry.name);
      if (ALLOWED_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

const files = await collectFiles(REPO_ROOT);
const findings = [];

for (const file of files) {
  let content;
  try {
    content = await readFile(file, 'utf8');
  } catch (error) {
    console.error(`Unable to scan ${file}: ${error.message}`);
    process.exitCode = 1;
    continue;
  }

  const relPath = relative(REPO_ROOT, file);

  for (const { name, pattern } of SECRET_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      findings.push({
        file: relPath,
        name,
        line: content.slice(0, match.index).split('\n').length,
      });
    }
  }
}

if (findings.length > 0) {
  console.error('Potential secrets found:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.name})`);
  }
  process.exitCode = 1;
} else {
  console.log(`No secrets found in ${files.length} source files.`);
}
