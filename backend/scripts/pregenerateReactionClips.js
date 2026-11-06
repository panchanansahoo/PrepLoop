/**
 * Pregenerate Reaction Audio Clips
 *
 * Synthesizes 40 core reaction & backchannel lines using Edge TTS / Orpheus
 * and stores them in backend/data/static-reactions/ for zero-quota instant playback.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EdgeTTS } from 'node-edge-tts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.resolve(__dirname, '../data/pregeneratedReactionLines.json');
const OUTPUT_DIR = path.resolve(__dirname, '../data/static-reactions');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🎙️ Starting pre-generation of static reaction audio clips...');
  const lines = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  const voice = 'en-US-AriaNeural'; // Pinned high quality neural voice (clear, warm)

  let generated = 0;
  for (const item of lines) {
    const outFile = path.join(OUTPUT_DIR, `${item.id}.mp3`);
    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 100) {
      continue;
    }

    try {
      const isWarmMoment = item.type === 'wrong' || item.type === 'dont_know' || item.type === 'stuck_silence';
      const tts = new EdgeTTS({
        voice,
        lang: 'en-US',
        rate: isWarmMoment ? '-4%' : '-2%',
        pitch: isWarmMoment ? '+1Hz' : '+2Hz',
        outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      });

      await tts.ttsPromise(item.text, outFile);
      generated++;
      console.log(`✓ Generated [${item.id}] (${item.type}): "${item.text}"`);
    } catch (err) {
      console.warn(`✗ Failed to generate [${item.id}]:`, err.message);
    }
  }

  console.log(`\n🎉 Pre-generation complete! Generated ${generated} new clips. Total available: ${lines.length}`);
}

run().catch((err) => {
  console.error('Fatal error during pre-generation:', err);
  process.exit(1);
});
