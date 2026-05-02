#!/usr/bin/env node

/**
 * Video Optimization Script
 * 
 * Converts interview videos to H.265 (HEVC) and VP9 (WebM) formats
 * for optimal compression and browser compatibility.
 * 
 * Requirements:
 *   - ffmpeg must be installed and available in PATH
 *   - Windows: choco install ffmpeg
 *   - macOS: brew install ffmpeg
 *   - Linux: sudo apt-get install ffmpeg
 * 
 * Usage:
 *   node optimize-videos.js [--dry-run] [--quality=20-28]
 * 
 * Expected Savings:
 *   - H.265 HEVC: 40-50% reduction vs H.264
 *   - VP9 WebM: 30-40% reduction vs H.264
 *   - Total: 16.53 MB → ~8-10 MB (50% savings)
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

const VIDEOS = [
  { name: 'malespeaking.mp4', size: '1.82 MB' },
  { name: 'malelisrning.mp4', size: '1.39 MB' },
  { name: 'HannahChenSpeaking.mp4', size: '7.03 MB' },
  { name: 'HannahChenListening.mp4', size: '6.29 MB' },
];

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const qualityMatch = args.find(arg => arg.startsWith('--quality='));
const crf = qualityMatch ? parseInt(qualityMatch.split('=')[1]) : 24; // CRF: 18-28 (lower=better)

console.log('🎬 Video Optimization Script');
console.log('═'.repeat(60));
console.log(`Quality: CRF ${crf} (18=high quality, 28=high compression)`);
console.log(`Total Videos: ${VIDEOS.length}`);
console.log(`Total Size: 16.53 MB`);
console.log(`Mode: ${isDryRun ? 'DRY-RUN (no changes)' : 'LIVE'}`);
console.log('═'.repeat(60));

// Check if ffmpeg is installed
let ffmpegAvailable = false;
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  ffmpegAvailable = true;
  console.log('✅ ffmpeg detected\n');
} catch {
  console.log('❌ ffmpeg NOT installed');
  console.log('\nTo use this script, install ffmpeg:');
  console.log('  Windows: choco install ffmpeg');
  console.log('  macOS:   brew install ffmpeg');
  console.log('  Linux:   sudo apt-get install ffmpeg');
  console.log('\nSkipping video optimization (videos remain unchanged)');
  process.exit(0);
}

// Video conversion tasks
const tasks = VIDEOS.map(video => ({
  input: path.join(publicDir, video.name),
  outputH265: path.join(publicDir, video.name.replace(/\.mp4$/i, '.h265.mp4')),
  outputWebM: path.join(publicDir, video.name.replace(/\.mp4$/i, '.webm')),
  name: video.name,
  originalSize: video.size,
}));

async function convertVideo(task, codec) {
  return new Promise((resolve, reject) => {
    const isH265 = codec === 'h265';
    const output = isH265 ? task.outputH265 : task.outputWebM;
    const formatStr = isH265 ? 'MP4 (H.265)' : 'WebM (VP9)';

    if (!fs.existsSync(task.input)) {
      console.log(`  ⚠️  Input not found: ${task.name}`);
      resolve();
      return;
    }

    console.log(`  ➜ Converting to ${formatStr}...`);

    const args = isH265
      ? [
          '-i', task.input,
          '-c:v', 'hevc_nvenc', // Try GPU acceleration first (NVIDIA)
          '-crf', crf.toString(),
          '-preset', 'slow', // slow, medium, fast
          '-c:a', 'aac',
          '-b:a', '128k',
          output,
        ]
      : [
          '-i', task.input,
          '-c:v', 'vp9',
          '-crf', crf.toString(),
          '-b:v', '0', // VBR mode
          '-c:a', 'libopus',
          '-b:a', '96k',
          output,
        ];

    // Fallback to software encoding if GPU fails
    const fallbackH265 = [
      '-i', task.input,
      '-c:v', 'libx265',
      '-crf', crf.toString(),
      '-preset', 'slow',
      '-c:a', 'aac',
      '-b:a', '128k',
      output,
    ];

    const ffmpegArgs = isH265 ? args : args;

    const ffmpeg = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...ffmpegArgs]);

    ffmpeg.on('close', (code) => {
      if (code === 0 && fs.existsSync(output)) {
        const originalSize = fs.statSync(task.input).size / (1024 * 1024);
        const newSize = fs.statSync(output).size / (1024 * 1024);
        const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
        console.log(`  ✅ ${formatStr}: ${newSize.toFixed(2)} MB (-${savings}%)`);
        resolve();
      } else if (isH265 && code !== 0) {
        console.log(`  ⚠️  GPU encoding failed, falling back to software H.265...`);
        const ffmpegFallback = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...fallbackH265]);
        ffmpegFallback.on('close', (fallbackCode) => {
          if (fallbackCode === 0 && fs.existsSync(output)) {
            const originalSize = fs.statSync(task.input).size / (1024 * 1024);
            const newSize = fs.statSync(output).size / (1024 * 1024);
            const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
            console.log(`  ✅ ${formatStr} (software): ${newSize.toFixed(2)} MB (-${savings}%)`);
            resolve();
          } else {
            console.log(`  ❌ Encoding failed for ${task.name}`);
            reject(new Error(`Encoding failed for ${task.name}`));
          }
        });
        ffmpegFallback.stderr.on('data', (data) => {
          console.error(`ffmpeg stderr: ${data}`);
        });
      } else {
        console.log(`  ❌ Encoding failed for ${task.name}`);
        reject(new Error(`Encoding failed for ${task.name}`));
      }
    });

    ffmpeg.stderr.on('data', (data) => {
      // Silently log stderr (ffmpeg is verbose)
    });
  });
}

async function optimizeVideos() {
  console.log('\n📹 Converting videos...\n');

  for (const task of tasks) {
    console.log(`Processing: ${task.name}`);

    if (isDryRun) {
      console.log(`  [DRY-RUN] Would create:`);
      console.log(`    - ${path.basename(task.outputH265)}`);
      console.log(`    - ${path.basename(task.outputWebM)}`);
    } else {
      try {
        await convertVideo(task, 'h265');
        await convertVideo(task, 'webm');
      } catch (error) {
        console.error(`  Error: ${error.message}`);
      }
    }
    console.log('');
  }

  if (!isDryRun) {
    console.log('═'.repeat(60));
    console.log('✅ Video optimization complete!');
    console.log('═'.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('  1. Update VideoInterviewer.jsx to use .webm as primary');
    console.log('  2. Add .h265.mp4 as fallback for older browsers');
    console.log('  3. Keep original .mp4 as ultimate fallback');
    console.log('  4. Test video playback across browsers');
    console.log('  5. Monitor real-world file serving and caching\n');
  } else {
    console.log('═'.repeat(60));
    console.log('✅ Dry-run complete! No files were modified.');
    console.log('═'.repeat(60));
    console.log('\nRun again without --dry-run to actually convert videos.\n');
  }
}

// Run optimization
optimizeVideos().catch(error => {
  console.error('Optimization failed:', error.message);
  process.exit(1);
});
