#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts PNG/JPG images to WebP format with quality optimization
 * Usage: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_TO_OPTIMIZE = [
  {
    src: 'frontend/public/interviewer-avatar.png',
    quality: 85,
  },
  {
    src: 'frontend/public/candidate-avatar.png',
    quality: 85,
  },
  {
    src: 'frontend/public/ai-interviewer.png',
    quality: 85,
  },
];

async function optimizeImage(imagePath, quality) {
  try {
    const fullPath = path.join(process.cwd(), imagePath);
    const ext = path.extname(imagePath);
    const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    const fullWebpPath = path.join(process.cwd(), webpPath);

    // Get original size
    const originalStat = fs.statSync(fullPath);
    const originalSize = originalStat.size;

    // Convert to WebP
    await sharp(fullPath)
      .webp({ quality })
      .toFile(fullWebpPath);

    // Get new size
    const newStat = fs.statSync(fullWebpPath);
    const newSize = newStat.size;
    const savedPercent = ((1 - newSize / originalSize) * 100).toFixed(1);
    const savedKB = ((originalSize - newSize) / 1024).toFixed(1);

    console.log(`✅ ${path.basename(imagePath)} -> ${path.basename(webpPath)}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`   WebP:     ${(newSize / 1024).toFixed(1)} KB`);
    console.log(`   Saved:    ${savedKB} KB (${savedPercent}%)\n`);

    return {
      original: originalSize,
      optimized: newSize,
      saved: originalSize - newSize,
      percent: parseFloat(savedPercent),
    };
  } catch (error) {
    console.error(`❌ Failed to optimize ${imagePath}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🖼️  Image Optimization - PNG/JPG to WebP\n');
  console.log('─'.repeat(50));

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const image of IMAGES_TO_OPTIMIZE) {
    const result = await optimizeImage(image.src, image.quality);
    if (result) {
      totalOriginal += result.original;
      totalOptimized += result.optimized;
    }
  }

  console.log('─'.repeat(50));
  console.log('\n📊 TOTAL SAVINGS:');
  console.log(`   Before: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   After:  ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `   Saved:  ${((totalOriginal - totalOptimized) / 1024).toFixed(1)} KB (${(((1 - totalOptimized / totalOriginal) * 100).toFixed(1))}%)\n`
  );

  console.log('📝 Next steps:');
  console.log('   1. Update image references to use .webp files');
  console.log('   2. Use <picture> tags for fallback support');
  console.log('   3. Test in browsers and remove old PNG/JPG files\n');
}

main().catch(console.error);
