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
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

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
    kokoro:   true,  // always available — local model, no API key needed
    deepgram: !!process.env.DEEPGRAM_API_KEY,
    groq:     !!process.env.GROQ_API_KEY,
};

// Provider performance tracking
const providerStats = {
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

// ─── Deepgram STT config ───
const DEEPGRAM_STT_URL = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&language=en&interim_results=false';
const DEEPGRAM_CHUNK_URL = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&language=en&interim_results=true&utterance_end_ms=1000&vad_events=true';

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
            kokoro:  providers.kokoro && !_kokoroInitFailed,
            groq:    providers.groq,
            browser: true,
        },
        stt: {
            deepgram: providers.deepgram,
            groq:     providers.groq,
            browser:  true,
        },
        recommended: {
            tts: providers.groq ? 'groq' : (providers.kokoro && !_kokoroInitFailed) ? 'kokoro' : 'browser',
            stt: providers.deepgram ? 'deepgram' : providers.groq ? 'groq' : 'browser',
        }
    };
}

/**
 * Text-to-Speech — returns audio buffer
 * Chain: Kokoro (local) → Groq Orpheus → Google TTS → { fallback: true }
 * Now with intelligent provider selection based on performance
 */
export async function textToSpeech(text, persona = 'friendly', preferredProvider = null, language = 'en', gender = 'female') {
    if (!text || text.trim().length === 0) throw new Error('Text is required for TTS');

    const cleanText = String(text).trim();
    const g = normalizeGender(gender);
    const lang = String(language || 'en').toLowerCase();
    const multilingual = lang !== 'en' && lang !== 'en-us';

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

    // Groq Orpheus — cloud fallback (chunks long text automatically)
    if (providers.groq && (!preferredProvider || preferredProvider === 'groq' || preferredProvider === 'groq-orpheus') && !isInCooldown('groq')) {
        try {
            const t0 = Date.now();
            const result = await groqOrpheusTTS(cleanText, persona, g);
            if (result) {
                updateStats('groq', true, Date.now() - t0);
                return result;
            }
            updateStats('groq', false);
        } catch (err) {
            console.warn('[TTS] Groq Orpheus failed:', err.message?.substring(0, 120));
            updateStats('groq', false);
        }
    }

    // Kokoro — local, free, fallback (English only)
    if (!multilingual && (!preferredProvider || preferredProvider === 'kokoro') && !isInCooldown('kokoro')) {
        try {
            const t0 = Date.now();
            const result = await kokoroTTS(cleanText, persona, g);
            if (result) {
                updateStats('kokoro', true, Date.now() - t0);
                return result;
            }
            updateStats('kokoro', false);
        } catch (err) {
            console.warn('[TTS] Kokoro failed:', err.message?.substring(0, 120));
            updateStats('kokoro', false);
        }
    }

    // Google Translate — free multilingual last resort
    if (multilingual && (!preferredProvider || preferredProvider === 'browser')) {
        try {
            const result = await googleTranslateTTS(cleanText, lang);
            if (result) return result;
        } catch (err) {
            console.warn('[TTS] Google Translate failed:', err.message?.substring(0, 120));
        }
    }

    return { fallback: true };
}

/**
 * Speech-to-Text from audio file
 * Deepgram Nova-2 → Groq Whisper → { fallback: true }
 */
export async function speechToText(filePath, preferredProvider = null) {
    const safeFilePath = resolveSafeAudioPath(filePath);

    if (providers.deepgram && (!preferredProvider || preferredProvider === 'deepgram')) {
        try {
            const result = await deepgramSTT(safeFilePath);
            if (result) return result;
        } catch (err) {
            console.warn('[STT] Deepgram failed:', err.message?.substring(0, 120));
        }
    }

    if (providers.groq && (!preferredProvider || preferredProvider === 'groq')) {
        try {
            const result = await groqWhisperSTT(safeFilePath);
            if (result) return result;
        } catch (err) {
            console.warn('[STT] Groq Whisper failed:', err.message?.substring(0, 120));
        }
    }

    return { fallback: true, text: '' };
}

/**
 * Speech-to-Text from raw audio buffer (for real-time chunks from MediaRecorder)
 * Used by /api/voice/stt-chunk endpoint.
 * Returns { transcript, isFinal, confidence, words }
 */
export async function speechToTextChunk(audioBuffer, mimeType = 'audio/webm') {
    if (!providers.deepgram) {
        return { fallback: true, transcript: '', isFinal: false, confidence: 0 };
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;
    // Deepgram REST API requires clean MIME types without codec params
    // MediaRecorder sends 'audio/webm;codecs=opus' → strip to 'audio/webm'
    const cleanMimeType = String(mimeType).split(';')[0].trim() || 'audio/webm';

    const DEEPGRAM_CHUNK_TIMEOUT_MS = 10_000; // 10s max for chunk STT
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), DEEPGRAM_CHUNK_TIMEOUT_MS);

    let response;
    try {
        response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&language=en&diarize=false&filler_words=true', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type':  cleanMimeType,
            },
            body: audioBuffer,
            signal: ac.signal,
        });
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`Deepgram chunk STT error: ${response.status} — ${errBody.substring(0, 200)}`);
    }

    const data = await response.json();
    const channel   = data.results?.channels?.[0];
    const alt       = channel?.alternatives?.[0];
    const transcript = alt?.transcript || '';
    const confidence = alt?.confidence || 0;
    const words     = alt?.words || [];

    // Extract filler words for intelligence layer
    const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'sort of', 'literally', 'right'];
    const fillerWords = words
        .filter(w => FILLERS.includes((w.word || '').toLowerCase()))
        .map(w => w.word.toLowerCase());

    return {
        transcript,
        isFinal:    true,  // REST endpoint always returns final
        confidence,
        words,
        fillerWords,
        provider:   'deepgram',
    };
}

/**
 * Check Deepgram availability for STT.
 * SECURITY: Never expose the raw API key to the frontend.
 * All STT should be proxied through backend endpoints (/stt, /stt-chunk).
 */
export function isDeepgramAvailable() {
    return providers.deepgram;
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
            const result = await kokoroTTS(text, persona, normalizeGender(gender));
            if (result?.audio) {
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

async function groqOrpheusTTS(text, persona, gender = 'female') {
    const genderDict  = GROQ_VOICES[gender] || GROQ_VOICES.female;
    const voice       = genderDict[persona] || genderDict.default;
    const direction   = persona === 'friendly' ? '[cheerful] ' : '';
    const chunkLimit  = 200 - direction.length;
    const chunks      = chunkText(text, chunkLimit);

    const GROQ_TTS_TIMEOUT_MS = 10_000; // 10s max per chunk
    const buffers = [];
    for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const response = await groq.audio.speech.create({
            model:           'canopylabs/orpheus-v1-english',
            input:           direction + chunk,
            voice,
            response_format: 'wav',
        }, { timeout: GROQ_TTS_TIMEOUT_MS });
        const buf = Buffer.from(await response.arrayBuffer());
        if (buf.length > 100) buffers.push(buf);
    }

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
    
    // Limit text length to reduce generation time while keeping questions intact.
    // 500 chars covers most interview questions + context without truncation.
    const maxChars = 500;
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
    
    try {
        const audio = await tts.generate(truncatedText, { voice, speed: 1.15 }); // Slightly faster, natural tone
        const latency = Date.now() - t0;

        const wavBuffer = Buffer.from(audio.toWav());
        if (wavBuffer.length < 100) throw new Error('Kokoro returned empty audio');

        console.log(`[Kokoro] Generated ${(audio.audio.length / audio.sampling_rate).toFixed(1)}s audio in ${latency}ms (voice: ${voice}, chars: ${truncatedText.length})`);
        return { audio: wavBuffer, contentType: 'audio/wav', provider: 'kokoro', voice };
    } catch (err) {
        console.warn('[Kokoro] Generation failed:', err.message?.substring(0, 120));
        return null; // Fall through to next provider
    }
}

async function googleTranslateTTS(text, language) {
    // SECURITY: Strict allowlist for the `tl` parameter to prevent SSRF/injection
    const ALLOWED_LANGUAGES = new Set(['en', 'hi', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'pt', 'ar']);
    const normalizedLang = String(language || 'en').toLowerCase().slice(0, 2);
    const tl = ALLOWED_LANGUAGES.has(normalizedLang) ? normalizedLang : 'en';
    const googleTtsUrl = new URL('https://translate.google.com/translate_tts');
    googleTtsUrl.search = new URLSearchParams({ ie: 'UTF-8', client: 'tw-ob', tl, q: String(text) }).toString();

    if (googleTtsUrl.protocol !== 'https:' || googleTtsUrl.hostname !== 'translate.google.com') {
        throw new Error('Blocked unexpected Google TTS host');
    }

    const GOOGLE_TTS_TIMEOUT_MS = 8_000; // 8s max
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), GOOGLE_TTS_TIMEOUT_MS);

    let response;
    try {
        response = await fetch(googleTtsUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://translate.google.com/' },
            signal: ac.signal,
        });
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) throw new Error(`Google TTS error: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) throw new Error('Google TTS returned empty audio');
    return { audio: buffer, contentType: 'audio/mpeg', provider: 'google-translate' };
}

async function deepgramSTT(filePath) {
    const apiKey      = process.env.DEEPGRAM_API_KEY;
    const safeFilePath = resolveSafeAudioPath(filePath);
    const audioBuffer = fs.readFileSync(safeFilePath);

    const DEEPGRAM_FILE_TIMEOUT_MS = 15_000; // 15s max for file STT
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), DEEPGRAM_FILE_TIMEOUT_MS);

    let response;
    try {
        response = await fetch(DEEPGRAM_STT_URL, {
            method:  'POST',
            headers: { 'Authorization': `Token ${apiKey}`, 'Content-Type': 'audio/wav' },
            body:    audioBuffer,
            signal:  ac.signal,
        });
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) throw new Error(`Deepgram API error: ${response.status}`);

    const data       = await response.json();
    const alt        = data.results?.channels?.[0]?.alternatives?.[0];
    const transcript = alt?.transcript || '';

    return {
        text:       transcript,
        confidence: alt?.confidence || 0,
        language:   'en',
        provider:   'deepgram',
    };
}

async function groqWhisperSTT(filePath) {
    const safeFilePath = resolveSafeAudioPath(filePath);

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
    speechToTextChunk,
    isDeepgramAvailable,
    getAvailableProviders,
    generateBackchannelClips,
    preloadKokoroTTS,
    getProviderStats: () => providerStats, // Expose stats for monitoring
};
