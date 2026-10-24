#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { glob } from 'glob';

const SECRET_PATTERNS = [
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'JWT', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'Groq API key', pattern: /\bgsk_[A-Za-z0-9]{20,}\b/ },
  { name: 'Razorpay live key', pattern: /\brzp_live_[A-Za-z0-9]{10,}\b/ },
  { name: 'OpenAI or Anthropic API key', pattern: /\bsk-[A-Za-z0-9]{40,}\b/ },
  { name: 'Generic credential assignment', pattern: /\b(?:password|secret|token|api[_-]?key)\b\s*[:=]\s*['"][^'"\r\n]{20,}['"]/i },
];

const files = await glob('**/*.{js,cjs,mjs,ts,tsx,jsx,json,yml,yaml,sql,md}', {
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/backups/**',
    '**/.env',
    '**/.env.*',
    '**/appsettings.json',
  ],
  nodir: true,
});

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

  for (const { name, pattern } of SECRET_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      findings.push({
        file,
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
