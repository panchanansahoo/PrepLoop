import { EdgeTTS } from 'node-edge-tts';

async function test() {
    const tts = new EdgeTTS();
    await tts.ttsPromise("Hello, I am testing the human voice.", "en-US-JennyNeural")
        .then(() => console.log("Success!"))
        .catch(console.error);
}
test().catch(console.error);
