import { readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';

const assetsDir = join(process.cwd(), 'dist', 'assets');
const DEFAULT_MAX_BYTES = Number(process.env.MAX_FRONTEND_ASSET_BYTES || 1_600_000);

// Specific chunk budgets in bytes (uncompressed)
const CHUNK_BUDGETS = {
  'vendor-editor': 1_500_000,
  'vendor-three-core': 850_000,
  'vendor-prettier': 750_000,
  'vendor-monaco': 800_000,
  'vendor-supabase': 650_000,
  'data-': 600_000,
  index: 300_000,
  default: DEFAULT_MAX_BYTES,
};

function getBudgetForFile(fileName) {
  for (const [prefix, budget] of Object.entries(CHUNK_BUDGETS)) {
    if (prefix !== 'default' && fileName.includes(prefix)) {
      return budget;
    }
  }
  return CHUNK_BUDGETS.default;
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else files.push(path);
  }
  return files;
}

try {
  const files = await collectFiles(assetsDir);
  const oversized = [];

  for (const file of files) {
    // Only check JS/CSS bundles
    if (!file.endsWith('.js') && !file.endsWith('.css')) continue;

    const fileStat = await stat(file);
    const size = fileStat.size;
    const name = basename(file);
    const budget = getBudgetForFile(name);

    if (size > budget) {
      oversized.push({ file: name, size, budget });
    }
  }

  if (oversized.length > 0) {
    console.error('🚨 Bundle budget check failed:');
    for (const item of oversized) {
      console.error(
        `  ❌ ${item.file}: ${(item.size / 1024).toFixed(1)} kB exceeds budget of ${(item.budget / 1024).toFixed(1)} kB`
      );
    }
    process.exit(1);
  }

  console.log(`✅ Bundle budget check passed for ${files.length} assets.`);
} catch (err) {
  console.error(`Failed to verify bundle budget: ${err.message}`);
  process.exit(1);
}
