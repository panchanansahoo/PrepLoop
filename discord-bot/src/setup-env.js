import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envExamplePath = path.resolve(__dirname, '../.env.example');
const envPath = path.resolve(__dirname, '../.env');

function hasMissingRequired(content) {
  const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'PREPLOOP_API_URL'];
  const map = new Map();

  for (const line of String(content || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    map.set(key, val);
  }

  return required.filter((key) => !map.get(key));
}

function main() {
  if (!fs.existsSync(envExamplePath)) {
    console.error('[ERROR] Missing .env.example in discord-bot package.');
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('[OK] Created discord-bot/.env from .env.example');
    console.log('[NEXT] Fill DISCORD_TOKEN, DISCORD_CLIENT_ID, PREPLOOP_API_URL, and DISCORD_GUILD_ID.');
    process.exit(0);
  }

  const existing = fs.readFileSync(envPath, 'utf8');
  const missing = hasMissingRequired(existing);
  console.log('[OK] discord-bot/.env already exists.');

  if (missing.length > 0) {
    console.log(`[WARN] Missing required values: ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  console.log('[OK] Required env values appear to be set.');
}

main();