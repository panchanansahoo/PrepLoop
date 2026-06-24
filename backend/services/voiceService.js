/**
 * Voice Service — Unified TTS/STT provider abstraction
 * Supports: Kokoro (local), Groq (Orpheus/Whisper), Deepgram, browser fallback
 *
 * Provider chain:
 *   TTS: Kokoro (local, free) → Groq Orpheus → Google TTS → { fallback: true }
 *   STT: Deepgram Nova-2 → Groq Whisper → { fallback: true }
 */
import 'dotenv/config';
import Groq from 'groq-sdk';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { EdgeTTS } from 'node-edge-tts';

// ─── __dirname for ESM ───
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const TMP_AUDIO_ROOT = path.resolve(os.tmpdir());

function resolveSafeAudioPath(filePath) {
    if (typeof filePath !== 'string' || filePath.length === 0) {
        throw new Error('Valid audio file path is required');
    }

    const resolvedPath = path.resolve(filePath);
    if (!(resolvedPath === TMP_AUDIO_ROOT || resolvedPath.startsWith(`${TMP_AUDIO_ROOT}${path.sep}`))) {
        throw new Error('Audio file path must be inside system temp directory');
    }

    if (!fs.existsSync(resolvedPath)) {
        throw new Error('Valid audio file path is required');
    }

    return resolvedPath;
}

// ─── Provider availability ───
const providers = {
    kokoro:     true,  // always available — local model, no API key needed
    edge:       true,  // Microsoft Edge TTS — free human voice, no API key needed
    deepgram:   false, // REMOVED — using client-side Web Speech API (free forever)
    groq:       !!process.env.GROQ_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    openai:     !!process.env.OPENAI_API_KEY,
};

// Provider performance tracking
const providerStats = {
    elevenlabs: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0 },
    openai: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0 },
    edge: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0 },
    kokoro: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0 },
    groq: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0 },
};

const PROVIDER_COOLDOWN_MS = 60000; // 1 minute cooldown after failures

const groq = providers.groq ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// ─── Kokoro TTS — lazy-loaded singleton (Promise-based, no polling race) ───
let _kokoroInstance = null;
let _kokoroInitFailed = false;
let _kokoroInitPromise = null; // shared Promise prevents race condition

const KOKORO_RETRY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes before retrying after init failure
let _kokoroFailedAt = 0;

async function getKokoroTTS() {
    // If previously failed, allow retry after cooldown period
    if (_kokoroInitFailed) {
        if (Date.now() - _kokoroFailedAt < KOKORO_RETRY_COOLDOWN_MS) return null;
        // Cooldown elapsed — reset and allow retry
        _kokoroInitFailed = false;
        console.log('[Kokoro] Retry cooldown elapsed, attempting re-initialization...');
    }
    if (_kokoroInstance) return _kokoroInstance;

    // All concurrent callers share the same init Promise —
    // no polling, no returning null while init is still running.
    if (_kokoroInitPromise) {
        await _kokoroInitPromise;
        return _kokoroInstance;
    }

    _kokoroInitPromise = (async () => {
        try {
            const { KokoroTTS } = await import('kokoro-js');
            console.log('[Kokoro] Loading model (first-time, ~2s)...');
            _kokoroInstance = await KokoroTTS.from_pretrained(
                'onnx-community/Kokoro-82M-v1.0-ONNX',
                { dtype: 'q8', device: 'cpu' }
            );
            console.log('[Kokoro] Model ready ✓');
            _kokoroFailedAt = 0; // Clear failure timestamp on success
            return _kokoroInstance;
        } catch (err) {
            console.warn('[Kokoro] Init failed (will use fallback providers):', err.message?.substring(0, 120));
            _kokoroInitFailed = true;
            _kokoroFailedAt = Date.now();
            return null;
        } finally {
            _kokoroInitPromise = null; // allow retry on next call if init failed
        }
    })();

    return _kokoroInitPromise;
}

// ─── Voice Presets ───
const ELEVENLABS_VOICES = {
    female: { friendly: 'Rachel', analytical: 'Freya', formal: 'Mimi', casual: 'Nicole', default: 'Rachel' },
    male:   { friendly: 'Clyde', analytical: 'Drew', formal: 'Fin', casual: 'Brian', default: 'Clyde' }
};

const ELEVENLABS_VOICE_IDS = {
    'Rachel': '21m00Tcm4TlvDq8ikWAM',
    'Freya': 'jsCqWAovK2zikvvJCGLz',
    'Mimi': 'zrHiDhphv9ZnVXBqCLjz',
    'Nicole': 'piTKgcLEGmPE4e6mJC43',
    'Clyde': '2EiwWnXFnvU5JabPnv8n',
    'Drew': '29vD33N1CtxCmqQRPOHJ',
    'Fin': 'pNInz6obpgDQGcFmaJgB',
    'Brian': 'nPczCjzI2devNBz1zQrb'
};

const OPENAI_VOICES = {
    female: { friendly: 'nova', analytical: 'shimmer', formal: 'alloy', casual: 'nova', default: 'nova' },
    male:   { friendly: 'echo', analytical: 'onyx', formal: 'fable', casual: 'echo', default: 'echo' }
};

const GROQ_VOICES = {
    female: { friendly: 'hannah', analytical: 'hannah', formal: 'hannah', casual: 'autumn', default: 'hannah' },
    male:   { friendly: 'austin', analytical: 'austin', formal: 'austin', casual: 'austin', default: 'austin' }
};

// Kokoro voice mapping — Grade-A/B voices selected for interview personas
// af_ = American Female, am_ = American Male, bf_ = British Female, bm_ = British Male
const KOKORO_VOICES = {
    female: {
        friendly:   'af_heart',    // Grade A — warm, natural ❤️
        analytical: 'af_bella',    // Grade A- — clear, professional 🔥
        formal:     'bf_emma',     // Grade B- — British, formal 🚺
        casual:     'af_nicole',   // Grade B- — relaxed, casual 🎧
        default:    'af_heart',
    },
    male: {
        friendly:   'am_puck',     // Grade C+ — warm male
        analytical: 'am_michael',  // Grade C+ — professional
        formal:     'bm_george',   // Grade C  — British, formal
        casual:     'am_fenrir',   // Grade C+ — confident
        default:    'am_michael',
    }
};



function normalizeGender(gender) {
    const n = String(gender || '').trim().toLowerCase();
    return (n === 'male' || n === 'man') ? 'male' : 'female';
}

// ─────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────

/**
 * Get available voice providers
 */
export function getAvailableProviders() {
    return {
        tts: {
            elevenlabs: providers.elevenlabs,
            openai:  providers.openai,
            edge:    providers.edge,
            kokoro:  providers.kokoro && !_kokoroInitFailed,
            groq:    providers.groq,
            browser: true,
        },
        stt: {
            // STT is now 100% client-side via Web Speech API (free forever).
            // No server-side STT providers are used.
            browser:  true,
        },
        recommended: {
            tts: providers.elevenlabs ? 'elevenlabs' : providers.openai ? 'openai' : providers.edge ? 'edge' : providers.groq ? 'groq' : (providers.kokoro && !_kokoroInitFailed) ? 'kokoro' : 'browser',
            stt: 'browser',
        }
    };
}

/**
 * Text-to-Speech — returns audio buffer
 * Chain: Groq Orpheus → Kokoro (local) → { fallback: true }
 * When fallback: true is returned, the frontend should use browser speechSynthesis.
 * Now with intelligent provider selection based on performance.
 */
export async function textToSpeech(text, persona = 'friendly', preferredProvider = null, _language = 'en', gender = 'female') {
    if (!text || text.trim().length === 0) throw new Error('Text is required for TTS');

    const cleanText = String(text).trim();
    const g = normalizeGender(gender);

    // Helper to check if provider is in cooldown
    const isInCooldown = (provider) => {
        const stats = providerStats[provider];
        if (!stats) return false;
        return Date.now() - stats.lastFail < PROVIDER_COOLDOWN_MS;
    };

    // Helper to update provider stats
    const updateStats = (provider, success, latency = 0) => {
        const stats = providerStats[provider];
        if (!stats) return;
        
        if (success) {
            stats.successCount++;
            stats.avgLatency = (stats.avgLatency * (stats.successCount - 1) + latency) / stats.successCount;
        } else {
            stats.failCount++;
            stats.lastFail = Date.now();
        }
    };

    // Helper: try a provider, log result
    const tryProvider = async (name, fn) => {
        try {
            const t0 = Date.now();
            const result = await fn();
            if (result) {
                const latency = Date.now() - t0;
                updateStats(name, true, latency);
                console.log(`[TTS] ✓ ${name} succeeded (${latency}ms, voice: ${result.voice || 'default'})`);
                return result;
            }
            updateStats(name, false);
            console.warn(`[TTS] ✗ ${name} returned null`);
        } catch (err) {
            const errMsg = (err && err.message) ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
            console.warn(`[TTS] ✗ ${name} failed:`, errMsg?.substring(0, 150));
            updateStats(name, false);
        }
        return null;
    };

    // Provider chain — ordered by reliability for production:
    // 1. ElevenLabs (premium, best quality)
    // 2. OpenAI (premium, very high quality)
    // 3. Edge TTS (FREE, Azure Neural — most reliable free option)
    // 4. Groq Orpheus (free tier, cloud)
    // 5. Kokoro (local ONNX, may fail on constrained hosts)
    // 6. Browser fallback (last resort)

    let result = null;

    // ElevenLabs — ultra-realistic human TTS
    if (!result && providers.elevenlabs && (!preferredProvider || preferredProvider === 'elevenlabs') && !isInCooldown('elevenlabs')) {
        result = await tryProvider('elevenlabs', () => elevenLabsTTS(cleanText, persona, g));
    }

    // OpenAI — very high quality TTS
    if (!result && providers.openai && (!preferredProvider || preferredProvider === 'openai') && !isInCooldown('openai')) {
        result = await tryProvider('openai', () => openAITTS(cleanText, persona, g));
    }

    // Edge TTS — Free, High Quality Azure Neural voices (most reliable free option)
    if (!result && providers.edge && (!preferredProvider || preferredProvider === 'edge') && !isInCooldown('edge')) {
        result = await tryProvider('edge', () => edgeNeuralTTS(cleanText, persona, g));
    }

    // Groq Orpheus — cloud TTS (free tier)
    if (!result && providers.groq && (!preferredProvider || preferredProvider === 'groq' || preferredProvider === 'groq-orpheus') && !isInCooldown('groq')) {
        result = await tryProvider('groq', () => groqOrpheusTTS(cleanText, persona, g));
    }

    // Kokoro — local, free, CPU-only (may fail on constrained servers)
    if (!result && (!preferredProvider || preferredProvider === 'kokoro') && !isInCooldown('kokoro')) {
        result = await tryProvider('kokoro', () => kokoroTTS(cleanText, persona, g));
    }

    if (result) return result;

    // All server-side TTS failed — signal frontend to use browser speechSynthesis
    console.warn('[TTS] ⚠ All providers failed — falling back to browser speechSynthesis');
    return { fallback: true };
}

/**
 * Speech-to-Text from audio file
 * DEPRECATED: STT is now handled client-side via Web Speech API.
 * This function returns { fallback: true } to signal the frontend
 * to use the browser's built-in SpeechRecognition.
 */
export function speechToText(_filePath, _preferredProvider = null) {
    // All STT is now client-side via Web Speech API (free forever)
    console.info('[STT] Server-side STT removed — using client-side Web Speech API');
    return { fallback: true, text: '' };
}



/**
 * Generate short backchannel audio clips ("mm-hmm", "I see", "go on")
 * using Kokoro TTS — called once and cached. Returns base64 audio strings.
 */
export async function generateBackchannelClips(persona = 'friendly', gender = 'female') {
    const clips = {
        mmhmm:  'Mm-hmm.',
        isee:   'I see.',
        goon:   'Go on.',
        interesting: 'Interesting.',
    };

    const results = {};
    for (const [key, text] of Object.entries(clips)) {
        try {
            // Use the top-level textToSpeech so backchannels match the main interview voice perfectly
            const result = await textToSpeech(text, persona, null, 'en', gender);
            if (result && !result.fallback && result.audio) {
                results[key] = `data:${result.contentType};base64,${result.audio.toString('base64')}`;
            }
        } catch (err) {
            console.warn(`[Backchannel] Failed to generate clip "${key}":`, err.message?.substring(0, 80));
        }
    }

    return Object.keys(results).length > 0 ? results : null;
}

// ─────────────────────────────────────────────────────────
// PRIVATE IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────

// ── Text chunking utilities ──
function chunkText(text, maxLength) {
    const chunks = [];
    let current = text.trim();
    while (current.length > maxLength) {
        let idx = current.lastIndexOf('.', maxLength);
        if (idx === -1) idx = current.lastIndexOf('?', maxLength);
        if (idx === -1) idx = current.lastIndexOf('!', maxLength);
        if (idx === -1) idx = current.lastIndexOf('\n', maxLength);
        if (idx === -1 || idx < maxLength * 0.5) {
            const comma = current.lastIndexOf(',', maxLength);
            idx = (comma > maxLength * 0.5) ? comma + 1 : (current.lastIndexOf(' ', maxLength) || maxLength);
        } else {
            idx += 1;
        }
        chunks.push(current.substring(0, idx).trim());
        current = current.substring(idx).trim();
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
}

function combineWavContent(buffers) {
    if (!buffers || buffers.length === 0) return Buffer.alloc(0);
    if (buffers.length === 1) return buffers[0];
    const header    = Buffer.from(buffers[0].subarray(0, 44));
    const pcmData   = buffers.map(b => b.length > 44 ? b.subarray(44) : Buffer.alloc(0));
    const combined  = Buffer.concat(pcmData);
    const out       = Buffer.concat([header, combined]);
    out.writeUInt32LE(out.length - 8, 4);
    out.writeUInt32LE(combined.length, 40);
    return out;
}

async function elevenLabsTTS(text, persona, gender = 'female') {
    const genderDict = ELEVENLABS_VOICES[gender] || ELEVENLABS_VOICES.female;
    const voiceName = genderDict[persona] || genderDict.default;
    const voiceId = ELEVENLABS_VOICE_IDS[voiceName];

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
                similarity_boost: 0.75,
                stability: 0.5,
                style: 0.0,
                use_speaker_boost: true
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return { audio: buffer, contentType: 'audio/mpeg', provider: 'elevenlabs', voice: voiceName };
}

async function openAITTS(text, persona, gender = 'female') {
    const genderDict = OPENAI_VOICES[gender] || OPENAI_VOICES.female;
    const voice = genderDict[persona] || genderDict.default;

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: voice,
            response_format: 'mp3'
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText} ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return { audio: buffer, contentType: 'audio/mpeg', provider: 'openai', voice };
}

async function edgeNeuralTTS(text, persona, gender = 'female') {
    // Premium Azure Neural voices — selected for natural, warm interview tone
    const edgeVoices = {
        female: {
            friendly:   'en-US-JennyMultilingualNeural',  // Best quality, warm
            analytical: 'en-US-AriaNeural',               // Clear, professional
            formal:     'en-GB-SoniaNeural',              // British, authoritative
            casual:     'en-US-JennyNeural',              // Natural, conversational
            default:    'en-US-JennyMultilingualNeural',
        },
        male: {
            friendly:   'en-US-GuyNeural',                // Warm, natural
            analytical: 'en-US-ChristopherNeural',        // Clear, measured
            formal:     'en-GB-RyanNeural',               // British, professional
            casual:     'en-US-EricNeural',               // Relaxed, approachable
            default:    'en-US-GuyNeural',
        }
    };
    
    const voice = (edgeVoices[gender] || edgeVoices.female)[persona] || (edgeVoices[gender] || edgeVoices.female).default;
    
    // --- Prosody variation for natural, human-like speech ---
    // Base prosody values (warm and conversational, not robotic)
    const baseRate = gender === 'male' ? '-3%' : '-2%';
    const basePitch = gender === 'male' ? '-2Hz' : '+2Hz';
    
    // For short text (single sentence), use simple prosody
    const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    
    if (sentences.length <= 1) {
        // Short text — single synthesis with warm prosody
        const tts = new EdgeTTS({
            voice,
            lang: 'en-US',
            rate: baseRate,
            pitch: basePitch,
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
        });
        
        const tempFilePath = path.join(TMP_AUDIO_ROOT, `edge-tts-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.mp3`);
        await tts.ttsPromise(text, tempFilePath);
        const buffer = await fs.promises.readFile(tempFilePath);
        fs.promises.unlink(tempFilePath).catch(() => {});
        return { audio: buffer, contentType: 'audio/mpeg', provider: 'edge', voice };
    }
    
    // Multi-sentence: apply per-sentence prosody variation for natural cadence
    // Fetch all sentences concurrently to reduce latency
    const synthesisPromises = sentences.map(async (sentence, i) => {
        if (!sentence.trim()) return null;
        
        const isQuestion = sentence.trim().endsWith('?');
        const isExclamation = sentence.trim().endsWith('!');
        const isFirst = i === 0;
        
        // Rate variation: questions slightly slower, first sentence warm/slow
        let ratePercent = gender === 'male' ? -3 : -2;
        ratePercent += Math.floor(Math.random() * 6) - 3; // ±3% jitter
        if (isQuestion) ratePercent -= 3;
        if (isFirst) ratePercent -= 2;
        ratePercent = Math.max(-15, Math.min(5, ratePercent));
        
        // Pitch variation: questions rise, exclamations slightly up
        let pitchHz = gender === 'male' ? -2 : 2;
        pitchHz += Math.floor(Math.random() * 6) - 3; // ±3Hz jitter
        if (isQuestion) pitchHz += 4;
        if (isExclamation) pitchHz += 2;
        pitchHz = Math.max(-10, Math.min(10, pitchHz));
        
        const tts = new EdgeTTS({
            voice,
            lang: 'en-US',
            rate: `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`,
            pitch: `${pitchHz >= 0 ? '+' : ''}${pitchHz}Hz`,
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
        });
        
        const tempFilePath = path.join(TMP_AUDIO_ROOT, `edge-tts-${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${i}.mp3`);
        await tts.ttsPromise(sentence, tempFilePath);
        const buf = await fs.promises.readFile(tempFilePath);
        fs.promises.unlink(tempFilePath).catch(() => {});
        return buf.length > 100 ? buf : null;
    });

    const results = await Promise.all(synthesisPromises);
    const buffers = results.filter(Boolean);
    
    if (buffers.length === 0) throw new Error('Edge TTS returned empty audio');
    
    // Combine MP3 segments (MP3 frames are self-contained, safe to concatenate)
    const combined = Buffer.concat(buffers);
    return { audio: combined, contentType: 'audio/mpeg', provider: 'edge', voice };
}

async function groqOrpheusTTS(text, persona, gender = 'female') {
    const genderDict  = GROQ_VOICES[gender] || GROQ_VOICES.female;
    const voice       = genderDict[persona] || genderDict.default;
    const direction   = persona === 'friendly' ? '[cheerful] ' : '';
    const chunkLimit  = 200 - direction.length;
    const chunks      = chunkText(text, chunkLimit);

    const GROQ_TTS_TIMEOUT_MS = 10_000; // 10s max per chunk
    
    // Fetch chunks concurrently
    const chunkPromises = chunks.map(async (chunk) => {
        if (!chunk.trim()) return null;
        try {
            const response = await groq.audio.speech.create({
                model:           'canopylabs/orpheus-v1-english',
                input:           direction + chunk,
                voice,
                response_format: 'wav',
            }, { timeout: GROQ_TTS_TIMEOUT_MS });
            const buf = Buffer.from(await response.arrayBuffer());
            return buf.length > 100 ? buf : null;
        } catch (err) {
            const errMsg = err && err.message ? err.message : String(err);
            console.warn('[Orpheus] Chunk error:', errMsg);
            throw err;
        }
    });

    const results = await Promise.all(chunkPromises);
    const buffers = results.filter(Boolean);

    if (buffers.length === 0) throw new Error('Orpheus returned empty audio');
    return { audio: combineWavContent(buffers), contentType: 'audio/wav', provider: 'groq-orpheus', voice };
}

// ── Kokoro TTS — local ONNX model, zero cost, CPU-only ──
async function kokoroTTS(text, persona, gender = 'female') {
    const tts = await getKokoroTTS();
    if (!tts) return null;

    const genderDict = KOKORO_VOICES[gender] || KOKORO_VOICES.female;
    const voice      = genderDict[persona]   || genderDict.default;

    const t0 = Date.now();
    
    try {
        // Natural speed (1.0) — no rushing, let the voice breathe
        const audio = await tts.generate(text, { voice, speed: 1.0 });
        const latency = Date.now() - t0;

        const wavBuffer = Buffer.from(audio.toWav());
        if (wavBuffer.length < 100) throw new Error('Kokoro returned empty audio');

        console.log(`[Kokoro] Generated ${(audio.audio.length / audio.sampling_rate).toFixed(1)}s audio in ${latency}ms (voice: ${voice}, chars: ${text.length})`);
        return { audio: wavBuffer, contentType: 'audio/wav', provider: 'kokoro', voice };
    } catch (err) {
        console.warn('[Kokoro] Generation failed:', err.message?.substring(0, 120));
        return null; // Fall through to next provider
    }
}

// ── Google Translate TTS — REMOVED ──
// Google Translate TTS was unreliable (scraping-based, breaks frequently).
// Multilingual TTS should use browser speechSynthesis on the client side.


// ── Deepgram STT — REMOVED ──
// STT is now 100% client-side via Web Speech API.
// Deepgram API calls have been removed to achieve zero recurring cost.


async function _groqWhisperSTT(_filePath) {
    const safeFilePath = resolveSafeAudioPath(_filePath);

    const GROQ_WHISPER_TIMEOUT_MS = 15_000; // 15s max for Whisper STT
    const transcription = await groq.audio.transcriptions.create({
        model:           'whisper-large-v3-turbo',
        file:            fs.createReadStream(safeFilePath),
        response_format: 'json',
    }, { timeout: GROQ_WHISPER_TIMEOUT_MS });

    return {
        text:     transcription.text || '',
        language: transcription.language || 'en',
        provider: 'groq-whisper',
    };
}

/**
 * Preload Kokoro TTS model at startup (fire-and-forget).
 * Eliminates the ~2s cold-start penalty on the first TTS request.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
async function preloadKokoroTTS() {
    try {
        const instance = await getKokoroTTS();
        if (instance) {
            console.log('[Kokoro] Preloaded at startup ✓  (first TTS will be instant)');
        } else {
            console.warn('[Kokoro] Preload skipped — model unavailable, will use fallback providers');
        }
    } catch (err) {
        console.warn('[Kokoro] Preload failed (non-fatal):', err.message?.substring(0, 120));
    }
}

// Expose Groq client for reuse by voice routes (avoids duplicate SDK instances)
export { groq as groqClient };

export default {
    textToSpeech,
    speechToText,
    getAvailableProviders,
    generateBackchannelClips,
    preloadKokoroTTS,
    getProviderStats: () => providerStats, // Expose stats for monitoring
};
