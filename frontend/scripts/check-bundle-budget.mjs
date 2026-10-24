import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const assetsDir = join(process.cwd(), 'dist', 'assets');
const maxAssetBytes = Number(process.env.MAX_FRONTEND_ASSET_BYTES || 2_000_000);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else files.push(path);
  }
  return files;
}

const files = await collectFiles(assetsDir);
const oversized = [];
for (const file of files) {
  const size = (await stat(file)).size;
  if (size > maxAssetBytes) oversized.push({ file, size });
}

if (oversized.length > 0) {
  for (const asset of oversized) {
    console.error(`Bundle budget exceeded: ${asset.file} (${asset.size} bytes)`);
  }
  process.exit(1);
}

console.log(`Bundle budget passed for ${files.length} assets (max ${maxAssetBytes} bytes each).`);
