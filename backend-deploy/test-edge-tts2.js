import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';

async function test() {
    const tts = new EdgeTTS({
        voice: 'en-US-JennyNeural',
        lang: 'en-US',
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
    });
    // Wait, the API for EdgeTTS from node-edge-tts?
    // ttsPromise might just write to a stream if we pass it, or return something?
    // Let's check `node_modules/node-edge-tts/lib/index.js` or `package.json`
    console.log(Object.keys(tts));
}
test().catch(console.error);
