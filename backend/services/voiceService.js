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
import { respellForTts } from '../utils/technicalPronunciation.js';

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
    elevenlabs: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0, isHardFailure: false, isHalfOpen: false },
    openai: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0, isHardFailure: false, isHalfOpen: false },
    edge: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0, isHardFailure: false, isHalfOpen: false },
    kokoro: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0, isHardFailure: false, isHalfOpen: false },
    groq: { successCount: 0, failCount: 0, avgLatency: 0, lastFail: 0, isHardFailure: false, isHalfOpen: false },
};

const PROVIDER_COOLDOWN_MS = 60000; // 1 minute cooldown after failures
const CIRCUIT_BREAKER_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes circuit breaker for hard errors (403, repeated failures)

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
    female: {
        friendly:   'hannah',  // Warm, empathetic, natural
        analytical: 'diana',   // Crisp, measured, intellectual
        formal:     'diana',   // Professional, clear
        casual:     'autumn',  // Conversational, relaxed, peer-to-peer
        default:    'hannah',
    },
    male: {
        friendly:   'austin',  // Warm, personable, engaging
        analytical: 'daniel',  // Deep, measured, analytical lead
        formal:     'daniel',  // Authoritative, structured
        casual:     'troy',    // Modern, crisp, energetic
        default:    'austin',
    }
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



// ── Pre-generated Static Reaction Audio Clips ──
const staticReactionsMap = new Map();
try {
    const staticReactionsPath = path.resolve(__dirname, '../data/pregeneratedReactionLines.json');
    if (fs.existsSync(staticReactionsPath)) {
        const lines = JSON.parse(fs.readFileSync(staticReactionsPath, 'utf8'));
        for (const item of lines) {
            const key = item.text.toLowerCase().replace(/[^a-z0-9]/g, '');
            staticReactionsMap.set(key, item.id);
        }
    }
} catch (e) {
    console.warn('[voiceService] Failed to load static reactions index:', e.message);
}

// Helper to normalize gender
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
            groq:    providers.groq,
            edge:    providers.edge,
            kokoro:  providers.kokoro && !_kokoroInitFailed,
            browser: true,
        },
        stt: {
            browser: true,
            groq: providers.groq,
        },
        recommended: {
            tts: providers.edge ? 'edge' : providers.groq ? 'groq' : (providers.kokoro && !_kokoroInitFailed) ? 'kokoro' : 'browser',
            stt: 'browser',
        }
    };
}

// ── LRU TTS in-memory audio cache with Byte Budget ──
const ttsAudioCache = new Map();
const MAX_TTS_CACHE_ITEMS = 150;
const MAX_TTS_CACHE_BYTES = 30 * 1024 * 1024; // 30 MB maximum memory budget for uncompressed audio
let currentCacheBytes = 0;

/**
 * Inspect in-memory TTS audio cache metrics
 */
export function getTtsCacheStats() {
    return {
        itemCount: ttsAudioCache.size,
        currentBytes: currentCacheBytes,
        maxBytes: MAX_TTS_CACHE_BYTES,
        maxItems: MAX_TTS_CACHE_ITEMS,
    };
}

/**
 * Normalizes text for speech synthesis:
 * - Strips code blocks, inline backticks, markdown styling (#, **, _, links, bullets)
 * - Expands programming complexity notations (O(1) -> "O of 1", O(n log n) -> "O of N log N")
 * - Expands equality / comparison symbols
 * - Removes emojis and URLs so speech engines don't stumble
 */
export function cleanTextForSpeech(text, options = {}) {
    if (!text || typeof text !== 'string') return '';
    let clean = text;

    // Code blocks -> replace with spoken transition
    clean = clean.replace(/```[\s\S]*?```/g, 'here is the code.');

    // Inline code backticks: `variable` -> variable
    clean = clean.replace(/`([^`]+)`/g, '$1');

    // Markdown headers: # Title -> Title
    clean = clean.replace(/^#{1,6}\s+/gm, '');

    // Bold / italic markdown: **text** or *text* -> text
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
    clean = clean.replace(/\*([^*]+)\*/g, '$1');
    clean = clean.replace(/__([^_]+)__/g, '$1');
    clean = clean.replace(/_([^_]+)_/g, '$1');

    // Markdown links: [text](url) -> text
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Bullet points & numbered lists: "- item" / "1. item" -> "item"
    clean = clean.replace(/^\s*[-*+]\s+/gm, '');
    clean = clean.replace(/^\s*\d+\.\s+/gm, '');

    // Common algorithmic complexity & syntax expansions for natural speech
    clean = clean.replace(/\bO\(1\)/gi, 'O of 1');
    clean = clean.replace(/\bO\(n\)/gi, 'O of N');
    clean = clean.replace(/\bO\(n\^2\)/gi, 'O of N squared');
    clean = clean.replace(/\bO\(n\s*log\s*n\)/gi, 'O of N log N');
    clean = clean.replace(/\bO\(log\s*n\)/gi, 'O of log N');
    clean = clean.replace(/\bO\(([^)]+)\)/gi, 'O of $1');
    clean = clean.replace(/===?/g, ' equals ');
    clean = clean.replace(/!==?/g, ' does not equal ');
    clean = clean.replace(/&&/g, ' and ');
    clean = clean.replace(/\|\|/g, ' or ');
    clean = clean.replace(/=>/g, ' yields ');
    clean = clean.replace(/<=/g, ' is less than or equal to ');
    clean = clean.replace(/>=/g, ' is greater than or equal to ');

    // URLs
    clean = clean.replace(/https?:\/\/\S+/gi, '');

    // Phonetic technical respellings (per provider awareness: Orpheus vs Edge)
    clean = respellForTts(clean, { provider: options?.provider || 'edge' });

    // Emojis and miscellaneous non-verbal symbols
    clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    // Collapse multiple whitespace
    return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Text-to-Speech — returns audio buffer
 * Chain: Groq Orpheus → Edge TTS → Kokoro (local) → { fallback: true }
 * When fallback: true is returned, the frontend should use browser speechSynthesis.
 * Intelligent provider selection based on availability and performance.
 */
export async function textToSpeech(text, persona = 'friendly', preferredProvider = null, _language = 'en', gender = 'female', options = {}) {
    if (!text || String(text).trim().length === 0) throw new Error('Text is required for TTS');

    const cleanText = cleanTextForSpeech(String(text), { provider: preferredProvider });
    if (!cleanText) throw new Error('Text is required for TTS');

    const g = normalizeGender(gender);
    const textHash = crypto.createHash('sha256').update(cleanText).digest('hex');
    const cacheKey = `${persona}:${g}:${textHash}`;

    // ⚡ Fast path: Return cached synthesized audio buffer (0ms latency, refresh LRU)
    if (ttsAudioCache.has(cacheKey)) {
        console.log(`[TTS] ⚡ Cache hit for: "${cleanText.substring(0, 35)}..."`);
        const cached = ttsAudioCache.get(cacheKey);
        ttsAudioCache.delete(cacheKey);
        ttsAudioCache.set(cacheKey, cached);
        return cached;
    }

    // ⚡ Pre-generated reaction clip fast path: Zero API quota, instant disk audio
    // Only serve when matching the pinned pilot female neural persona and not in browser fallback mode
    const normTextKey = cleanText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const canUseStaticClips = g === 'female' && preferredProvider !== 'browser' && !options?.skipStaticClips;
    if (canUseStaticClips && staticReactionsMap.has(normTextKey)) {
        const clipId = staticReactionsMap.get(normTextKey);
        const clipPath = path.resolve(__dirname, `../data/static-reactions/${clipId}.mp3`);
        if (fs.existsSync(clipPath)) {
            try {
                const clipBuffer = fs.readFileSync(clipPath);
                console.log(`[TTS] ⚡ Static reaction clip hit: "${cleanText.substring(0, 35)}..." (${clipId})`);
                const entry = { audio: clipBuffer, contentType: 'audio/mpeg', provider: 'static-reaction-clip', voice: 'pinned-neural' };
                ttsAudioCache.set(cacheKey, entry);
                return entry;
            } catch {
                /* fall through to live synthesis */
            }
        }
    }

    // Helper to check if provider is in cooldown with fail-fast half-open probe state
    const isInCooldown = (provider) => {
        const stats = providerStats[provider];
        if (!stats) return false;
        const cooldown = (stats.isHardFailure || stats.failCount >= 2)
            ? CIRCUIT_BREAKER_COOLDOWN_MS
            : PROVIDER_COOLDOWN_MS;
        const inCooldown = Date.now() - stats.lastFail < cooldown;
        if (!inCooldown && (stats.isHardFailure || stats.failCount > 0)) {
            // Half-open transition: cooldown has expired, probe with exactly one request.
            // Retain failure flags so if probe fails, it trips fail-fast without waiting!
            stats.isHalfOpen = true;
            return false;
        }
        return inCooldown;
    };

    // Helper to update provider stats
    const updateStats = (provider, success, latency = 0, isHard = false) => {
        const stats = providerStats[provider];
        if (!stats) return;
        
        if (success) {
            stats.successCount++;
            stats.isHardFailure = false;
            stats.isHalfOpen = false;
            stats.failCount = 0;
            stats.avgLatency = (stats.avgLatency * (stats.successCount - 1) + latency) / stats.successCount;
        } else {
            const wasHalfOpen = stats.isHalfOpen;
            stats.isHalfOpen = false;
            stats.lastFail = Date.now();

            // Fail-fast on half-open probe failure or hard error: re-trip immediately into full 15m cooldown
            if (wasHalfOpen || isHard || stats.failCount >= 1) {
                stats.isHardFailure = true;
                stats.failCount = Math.max(stats.failCount + 1, 2);
                console.warn(`[TTS] ⚡ Circuit breaker re-tripped for ${provider} (half-open probe failed or hard error: ${isHard ? 'hard' : 'probe'}) — 15m cooldown applied`);
            } else {
                stats.failCount++;
            }
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
            const isHard = /403|forbidden|401|unauthorized|429|too many requests|500|502|503|504|timeout|etimedout|esockettimedout/i.test(errMsg);
            updateStats(name, false, 0, isHard);
        }
        return null;
    };

    // Provider chain — ordered by reliability & speed:
    // 1. ElevenLabs (premium, if API key set)
    // 2. OpenAI (premium, if API key set)
    // 3. Groq Orpheus (FREE tier cloud, fast ~600ms, natural)
    // 4. Edge TTS (FREE Azure Neural voices)
    // 5. Kokoro (local ONNX model, zero-cost, CPU)
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

    // Edge TTS — Free, High Quality Azure Neural voices (Voice-matched to 40 static clips in en-US-AriaNeural)
    if (!result && providers.edge && (!preferredProvider || preferredProvider === 'edge') && !isInCooldown('edge')) {
        result = await tryProvider('edge', () => edgeNeuralTTS(cleanText, persona, g));
    }

    // Groq Orpheus — cloud TTS (fallback or when explicitly requested via preferredProvider)
    const isQuestionOrLongText = cleanText.trim().endsWith('?') || cleanText.length > 50 || cleanText.split(/\s+/).filter(Boolean).length > 4;
    if (!result && providers.groq && isQuestionOrLongText && (!preferredProvider || preferredProvider === 'groq' || preferredProvider === 'groq-orpheus') && !isInCooldown('groq')) {
        result = await tryProvider('groq', () => groqOrpheusTTS(cleanText, persona, g));
    }

    // Kokoro — local, free, CPU-only (may fail on constrained servers)
    if (!result && (!preferredProvider || preferredProvider === 'kokoro') && !isInCooldown('kokoro')) {
        result = await tryProvider('kokoro', () => kokoroTTS(cleanText, persona, g));
    }

    if (result && result.audio) {
        const audioBuffer = result.audio;
        const entryBytes = Buffer.isBuffer(audioBuffer)
            ? audioBuffer.length
            : (typeof audioBuffer === 'string' ? Buffer.byteLength(audioBuffer) : 0);

        // Deduct existing entry bytes if updating key
        if (ttsAudioCache.has(cacheKey)) {
            const oldEntry = ttsAudioCache.get(cacheKey);
            currentCacheBytes -= (oldEntry?._byteSize || 0);
            ttsAudioCache.delete(cacheKey);
        }

        // Enforce both total MB byte budget and max item count (LRU eviction)
        while ((currentCacheBytes + entryBytes > MAX_TTS_CACHE_BYTES || ttsAudioCache.size >= MAX_TTS_CACHE_ITEMS) && ttsAudioCache.size > 0) {
            const oldestKey = ttsAudioCache.keys().next().value;
            const oldestEntry = ttsAudioCache.get(oldestKey);
            currentCacheBytes -= (oldestEntry?._byteSize || 0);
            ttsAudioCache.delete(oldestKey);
        }

        currentCacheBytes = Math.max(0, currentCacheBytes + entryBytes);
        result._byteSize = entryBytes;
        ttsAudioCache.set(cacheKey, result);
        return result;
    }

    // All server-side TTS failed — signal frontend to use browser speechSynthesis
    console.warn('[TTS] ⚠ All providers failed — falling back to browser speechSynthesis');
    return { fallback: true };
}

/**
 * Speech-to-Text from audio file
 * Primary STT is handled client-side via Web Speech API.
 * When client-side STT is unavailable (Firefox, Safari, Mobile), this server endpoint
 * transcribes using Groq Whisper (large-v3-turbo) for ultra-fast, 99% accuracy.
 */
export async function speechToText(filePath, _preferredProvider = null) {
    if (providers.groq && groq && filePath) {
        try {
            const res = await _groqWhisperSTT(filePath);
            if (!res.text?.trim()) {
                throw new Error('Groq Whisper returned an empty transcript');
            }
            return {
                text: res.text,
                language: res.language || 'en',
                provider: 'groq-whisper',
                confidence: 0.98,
            };
        } catch (err) {
            console.warn('[STT] Groq Whisper failed:', err.message?.substring(0, 100));
        }
    }
    return { fallback: true, text: '' };
}



/**
 * Generate short backchannel audio clips ("mm-hmm", "I see", "go on")
 * using Kokoro TTS — called once and cached. Returns base64 audio strings.
 */
export async function generateBackchannelClips(persona = 'friendly', gender = 'female') {
    const clips = {
        mmhmm:       'Mm-hmm.',
        isee:        'I see.',
        goon:        'Go on.',
        interesting: 'Interesting.',
        right:       'Right.',
        gotit:       'Got it.',
        yeah:        'Yeah.',
        okay:        'Okay.',
    };

    const results = {};
    for (const [key, text] of Object.entries(clips)) {
        try {
            // Use Edge TTS (free Azure Neural) or local fallback so backchannels never consume Groq Orpheus limits
            const result = await textToSpeech(text, persona, 'edge', 'en', gender);
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

/**
 * Trims leading and trailing silence from 16-bit PCM WAV buffers.
 * Eliminates 100-300ms of dead air produced by models like Orpheus and Kokoro.
 * Keeps a small safety margin (default 15ms) to preserve the onset of plosive consonants.
 */
export function trimWavSilence(buffer, threshold = 350, marginMs = 15) {
    if (!buffer || buffer.length <= 44) return buffer;
    if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
        return buffer;
    }

    let dataOffset = 12;
    let dataLength = 0;
    while (dataOffset < buffer.length - 8) {
        const chunkId = buffer.toString('ascii', dataOffset, dataOffset + 4);
        const chunkSize = buffer.readUInt32LE(dataOffset + 4);
        if (chunkId === 'data') {
            dataOffset += 8;
            dataLength = chunkSize;
            break;
        }
        dataOffset += 8 + chunkSize;
    }

    if (dataLength === 0 || dataOffset >= buffer.length) {
        dataOffset = 44;
    }

    const sampleRate = buffer.readUInt32LE(24) || 24000;
    const channels = buffer.readUInt16LE(22) || 1;
    const bitsPerSample = buffer.readUInt16LE(34) || 16;
    if (bitsPerSample !== 16) return buffer;

    const bytesPerSample = 2 * channels;
    const totalSamples = Math.floor((buffer.length - dataOffset) / bytesPerSample);
    if (totalSamples <= 0) return buffer;

    const marginSamples = Math.floor((sampleRate * marginMs) / 1000);

    let firstSample = 0;
    for (let i = 0; i < totalSamples; i++) {
        let maxAmp = 0;
        for (let ch = 0; ch < channels; ch++) {
            const bytePos = dataOffset + (i * bytesPerSample) + (ch * 2);
            if (bytePos + 1 < buffer.length) {
                const amp = Math.abs(buffer.readInt16LE(bytePos));
                if (amp > maxAmp) maxAmp = amp;
            }
        }
        if (maxAmp > threshold) {
            firstSample = Math.max(0, i - marginSamples);
            break;
        }
    }

    let lastSample = totalSamples - 1;
    for (let i = totalSamples - 1; i >= firstSample; i--) {
        let maxAmp = 0;
        for (let ch = 0; ch < channels; ch++) {
            const bytePos = dataOffset + (i * bytesPerSample) + (ch * 2);
            if (bytePos + 1 < buffer.length) {
                const amp = Math.abs(buffer.readInt16LE(bytePos));
                if (amp > maxAmp) maxAmp = amp;
            }
        }
        if (maxAmp > threshold) {
            lastSample = Math.min(totalSamples - 1, i + marginSamples);
            break;
        }
    }

    if (firstSample === 0 && lastSample === totalSamples - 1) {
        return buffer;
    }

    const startByte = dataOffset + (firstSample * bytesPerSample);
    const endByte = dataOffset + ((lastSample + 1) * bytesPerSample);
    const trimmedPcm = buffer.subarray(startByte, Math.min(buffer.length, endByte));

    const header = Buffer.from(buffer.subarray(0, dataOffset));
    const out = Buffer.concat([header, trimmedPcm]);
    out.writeUInt32LE(out.length - 8, 4);
    if (dataOffset >= 44) {
        out.writeUInt32LE(trimmedPcm.length, dataOffset - 4);
    }

    return out;
}

function combineWavContent(buffers) {
    if (!buffers || buffers.length === 0) return Buffer.alloc(0);
    const trimmedBuffers = buffers.map(b => trimWavSilence(b));
    if (trimmedBuffers.length === 1) return trimmedBuffers[0];
    const header    = Buffer.from(trimmedBuffers[0].subarray(0, 44));
    const pcmData   = trimmedBuffers.map(b => b.length > 44 ? b.subarray(44) : Buffer.alloc(0));
    const combined  = Buffer.concat(pcmData);
    const out       = Buffer.concat([header, combined]);
    out.writeUInt32LE(out.length - 8, 4);
    out.writeUInt32LE(combined.length, 40);
    return trimWavSilence(out);
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
    // Premium Azure Neural voices — pinned to en-US-AriaNeural for 100% voice consistency with static clips
    const edgeVoices = {
        female: {
            friendly:   'en-US-AriaNeural',               // Voice-matched to static clips
            analytical: 'en-US-AriaNeural',               // Clear, professional
            formal:     'en-GB-SoniaNeural',              // British, authoritative
            casual:     'en-US-AriaNeural',               // Natural, conversational
            default:    'en-US-AriaNeural',
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
        // Short text — single synthesis with warm prosody (slower 0.95x for questions, normal for reactions)
        const isQuestion = text.trim().endsWith('?');
        const tts = new EdgeTTS({
            voice,
            lang: 'en-US',
            rate: isQuestion ? '-5%' : baseRate,
            pitch: isQuestion ? '+4Hz' : basePitch,
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

function getOrpheusDirection(sentence, persona = 'friendly') {
    const trimmed = sentence.trim();
    const isQuestion = trimmed.endsWith('?');
    const isEncouraging = /^(great|good|nice|thank|thanks|excellent|well done|i see|interesting|understood|awesome|right|alright)/i.test(trimmed);
    const isThoughtful = /^(let's|now|consider|imagine|suppose|how would|what if|walk me through|can you explain|could you tell)/i.test(trimmed);

    if (isEncouraging) return '[encouraging] ';
    if (isQuestion) return '[curious] ';
    if (isThoughtful) return '[thoughtful] ';

    switch (persona) {
        case 'analytical':
        case 'formal':
            return '[thoughtful] ';
        case 'casual':
            return '[conversational] ';
        case 'friendly':
        default:
            return '[warm] ';
    }
}

async function groqOrpheusTTS(text, persona, gender = 'female') {
    const genderDict  = GROQ_VOICES[gender] || GROQ_VOICES.female;
    const voice       = genderDict[persona] || genderDict.default;

    // Split into sentences for per-sentence prosody and natural inflection changes
    const rawSentences = text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);

    // If single long block without punctuation, fallback to chunkText
    const segments = rawSentences.length > 0
        ? rawSentences.flatMap(s => (s.length > 180 ? chunkText(s, 180) : [s]))
        : chunkText(text, 180);

    const GROQ_TTS_TIMEOUT_MS = 10_000; // 10s max per chunk
    
    // Fetch chunks concurrently with intelligent emotional direction
    const chunkPromises = segments.map(async (segment) => {
        if (!segment.trim()) return null;
        const direction = getOrpheusDirection(segment, persona);
        try {
            const response = await groq.audio.speech.create({
                model:           'canopylabs/orpheus-v1-english',
                input:           direction + segment,
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
        return { audio: trimWavSilence(wavBuffer), contentType: 'audio/wav', provider: 'kokoro', voice };
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
        language:        'en',
        temperature:     0,
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
