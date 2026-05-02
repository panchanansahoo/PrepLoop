/**
 * Voice Routes — Unified TTS/STT API endpoints
 * Supports: Kokoro (local), Groq Orpheus, Deepgram, browser fallback
 */
import express from 'express';
import multer from 'multer';
import os from 'os';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';
import voiceService, { groqClient } from '../services/voiceService.js';
import * as voicePersonaManager from '../utils/voicePersonaManager.js';
import * as providerRouter from '../utils/providerRouter.js';
// SECURITY: isDeepgramAvailable replaces getDeepgramToken — raw keys never leave the server

const router = express.Router();

// ── Rate limiter for sensitive endpoints (in-memory, per-user) ──
const tokenRateLimits = new Map();
const TOKEN_RATE_WINDOW_MS = 60_000; // 1 minute
const TOKEN_RATE_MAX = 10;           // max 10 requests per window

function tokenRateLimit(req, res, next) {
    const userId = req.user?.id || req.ip || 'anon';
    const now = Date.now();
    const entry = tokenRateLimits.get(userId);
    if (entry && now - entry.windowStart < TOKEN_RATE_WINDOW_MS) {
        if (entry.count >= TOKEN_RATE_MAX) {
            return res.status(429).json({ error: 'Too many token requests. Try again later.' });
        }
        entry.count++;
    } else {
        tokenRateLimits.set(userId, { windowStart: now, count: 1 });
    }
    // Periodic cleanup (every 100 entries)
    if (tokenRateLimits.size > 100) {
        for (const [key, val] of tokenRateLimits) {
            if (now - val.windowStart > TOKEN_RATE_WINDOW_MS * 2) tokenRateLimits.delete(key);
        }
    }
    next();
}

// Periodic cleanup of stale rate-limit entries (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of tokenRateLimits) {
        if (now - val.windowStart > TOKEN_RATE_WINDOW_MS * 2) tokenRateLimits.delete(key);
    }
}, 5 * 60 * 1000).unref();

// ── Input validation for TTS parameters ──
const VALID_GENDERS = ['female', 'male'];
const VALID_PERSONAS = ['friendly', 'analytical', 'formal', 'casual'];
const VALID_LANGUAGES = ['en', 'en-us', 'hi', 'es', 'fr', 'de', 'ja', 'ko', 'zh'];

function sanitizeGender(val)   { const g = String(val || '').toLowerCase().trim(); return VALID_GENDERS.includes(g) ? g : 'female'; }
function sanitizePersona(val)  { const p = String(val || '').toLowerCase().trim(); return VALID_PERSONAS.includes(p) ? p : 'friendly'; }
function sanitizeLanguage(val) { const l = String(val || '').toLowerCase().trim(); return VALID_LANGUAGES.includes(l) ? l : 'en'; }
const TMP_UPLOAD_DIR = path.resolve(os.tmpdir());

const isPathInsideTmp = (filePath) => {
    if (!filePath) return false;
    const resolved = path.resolve(filePath);
    return resolved === TMP_UPLOAD_DIR || resolved.startsWith(`${TMP_UPLOAD_DIR}${path.sep}`);
};

const safeDeleteTempFile = (filePath) => {
    if (!isPathInsideTmp(filePath)) return;
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
        // Best-effort cleanup only.
    }
};

// Groq client: reuse the shared instance from voiceService (no duplicate SDK)
// Falls back to null if GROQ_API_KEY is not set.

// Fix #10: use crypto.randomBytes for unique filenames
const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => cb(null, `voice-stt-${crypto.randomBytes(8).toString('hex')}.webm`),
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/wav', 'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-wav'];
        cb(null, allowed.includes(file.mimetype) || /\.(wav|webm|mp3|ogg|m4a)$/i.test(file.originalname));
    },
});

// Multer for raw buffer (stt-chunk — no file extension, raw webm)
const rawUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per chunk
});

// ─── Get available providers ───
// Auth required to prevent leaking which API keys are configured
router.get('/providers', optionalAuth, (req, res) => {
    res.json(voiceService.getAvailableProviders());
});

// ─────────────────────────────────────────────────────────────────────────────
// TTS — Buffered (primary endpoint, used by useVoiceInterview)
// POST /api/voice/tts
// Chain: Kokoro (local) → Groq Orpheus → Google TTS → { fallback: true }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tts', optionalAuth, async (req, res) => {
    const { text, provider } = req.body;
    const persona  = sanitizePersona(req.body.persona);
    const language = sanitizeLanguage(req.body.language);
    const gender   = sanitizeGender(req.body.gender);

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await voiceService.textToSpeech(
            text,
            persona,
            provider || null,
            language,
            gender
        );

        if (result.fallback) {
            return res.status(200).json({ fallback: true });
        }

        const audioBuffer = Buffer.isBuffer(result.audio) ? result.audio : Buffer.from(result.audio || '');

        if (!audioBuffer || audioBuffer.length === 0) {
            console.warn('[voice/tts] Empty audio buffer received');
            return res.status(200).json({ fallback: true });
        }

        res.set({
            'Content-Type':   result.contentType,
            'Content-Length': audioBuffer.length,
            'X-TTS-Provider': result.provider,
            'X-TTS-Voice':    result.voice || '',
            'Cache-Control':  'no-cache',
        });
        res.type(result.contentType || 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error) {
        console.error('[voice/tts] Error:', error.message?.substring(0, 200));
        res.status(200).json({ fallback: true });
    }
});

router.post('/tts-fast', optionalAuth, async (req, res) => {
    const { text } = req.body;
    const persona = sanitizePersona(req.body.persona);
    const gender  = sanitizeGender(req.body.gender);

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await voiceService.textToSpeech(
            text.substring(0, 150),
            persona,
            req.body.provider || null,
            'en',
            gender
        );

        if (result.fallback) {
            return res.status(200).json({ fallback: true });
        }

        const audioBuffer = Buffer.isBuffer(result.audio) ? result.audio : Buffer.from(result.audio || '');

        if (!audioBuffer || audioBuffer.length === 0) {
            return res.status(200).json({ fallback: true });
        }

        res.set({
            'Content-Type':   result.contentType,
            'Content-Length': audioBuffer.length,
            'X-TTS-Provider': result.provider,
            'X-TTS-Voice':    result.voice || '',
            'Cache-Control':  'no-cache',
        });
        res.type(result.contentType || 'audio/wav');
        res.send(audioBuffer);
    } catch (error) {
        console.error('[voice/tts-fast] Error:', error.message?.substring(0, 200));
        res.status(200).json({ fallback: true });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TTS STREAM — Backwards-compatible endpoint (delegates to buffered TTS)
// POST /api/voice/tts-stream
// Previously used ElevenLabs streaming; now uses the same buffered chain
// so existing frontend callers continue to work without code changes.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tts-stream', optionalAuth, async (req, res) => {
    const { text } = req.body;
    const persona  = sanitizePersona(req.body.persona);
    const language = sanitizeLanguage(req.body.language);
    const gender   = sanitizeGender(req.body.gender);

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await voiceService.textToSpeech(
            text,
            persona,
            null,
            language,
            gender
        );

        if (result.fallback) {
            return res.status(200).json({ fallback: true });
        }

        const audioBuffer = Buffer.isBuffer(result.audio) ? result.audio : Buffer.from(result.audio || '');

        if (!audioBuffer || audioBuffer.length === 0) {
            console.warn('[voice/tts-stream] Empty audio buffer received');
            return res.status(200).json({ fallback: true });
        }

        res.set({
            'Content-Type':   result.contentType,
            'Content-Length': audioBuffer.length,
            'X-TTS-Provider': result.provider,
            'X-TTS-Voice':    result.voice || '',
            'Cache-Control':  'no-cache',
        });
        res.type(result.contentType || 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error) {
        console.error('[voice/tts-stream] Error:', error.message?.substring(0, 200));
        if (!res.headersSent) res.status(200).json({ fallback: true });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// TTS OPTIMIZED — Parallel provider racing (Kokoro + Groq simultaneous)
// POST /api/voice/tts-optimized
// OPTIMIZATION: Races Kokoro (local) + Groq (cloud) for latency reduction
// Returns first successful response, falling back to sequential chain if both fail
// Benefit: 1-2s latency reduction if Kokoro fails or primary provider is slow
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tts-optimized', optionalAuth, async (req, res) => {
    const { text } = req.body;
    const persona  = sanitizePersona(req.body.persona);
    const language = sanitizeLanguage(req.body.language);
    const gender   = sanitizeGender(req.body.gender);

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await voiceService.textToSpeechParallel(
            text,
            persona,
            language,
            gender
        );

        if (result.fallback) {
            return res.status(200).json({ fallback: true });
        }

        const audioBuffer = Buffer.isBuffer(result.audio) ? result.audio : Buffer.from(result.audio || '');

        if (!audioBuffer || audioBuffer.length === 0) {
            console.warn('[voice/tts-optimized] Empty audio buffer received');
            return res.status(200).json({ fallback: true });
        }

        res.set({
            'Content-Type':   result.contentType,
            'Content-Length': audioBuffer.length,
            'X-TTS-Provider': result.provider,
            'X-TTS-Voice':    result.voice || '',
            'X-TTS-Optimized': 'true',
            'Cache-Control':  'no-cache',
        });
        res.type(result.contentType || 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error) {
        console.error('[voice/tts-optimized] Error:', error.message?.substring(0, 200));
        if (!res.headersSent) res.status(200).json({ fallback: true });
    }
});


// ─────────────────────────────────────────────────────────────────────────────
// ANALYZE ANSWER — Groq-powered post-answer intelligence
// POST /api/voice/analyze-answer
// Body: { question, answer }
// Returns: { needsFollowUp, followUpQuestion, clarityScore, specificityScore, starUsed }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze-answer', authenticateToken, async (req, res) => {
    const { question, answer } = req.body;
    // Sanitize interviewType against allowlist to prevent prompt injection
    const VALID_INTERVIEW_TYPES = ['technical', 'behavioral', 'coding', 'dsa', 'system-design', 'hr'];
    const rawType = String(req.body.interviewType || '').toLowerCase().trim();
    const interviewType = VALID_INTERVIEW_TYPES.includes(rawType) ? rawType : 'technical';

    if (!answer || answer.trim().length < 10) {
        return res.json({ needsFollowUp: false, followUpQuestion: null, clarityScore: 5, specificityScore: 5, starUsed: false });
    }

    try {
        // Fix #1: reuse module-level groqClient instead of creating new instance per request
        if (!groqClient) {
            return res.json({ needsFollowUp: false, followUpQuestion: null, clarityScore: 6, specificityScore: 6, starUsed: false });
        }

        // Strip potential control chars from user-provided strings before LLM interpolation
        const safeQuestion = (question || 'General interview question').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').substring(0, 500);
        const safeAnswer = answer.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').substring(0, 800);

        const analysisPrompt = `You are an expert interview coach analyzing a candidate's answer.

Question: "${safeQuestion}"
Answer: "${safeAnswer}"
Interview type: ${interviewType || 'technical'}

Analyze this answer and respond ONLY with valid JSON (no markdown, no explanation):
{
  "needsFollowUp": boolean,
  "followUpQuestion": "string or null",
  "clarityScore": number 1-10,
  "specificityScore": number 1-10,
  "starUsed": boolean,
  "confidenceScore": number 1-10,
  "fillerWordImpact": "none|low|medium|high",
  "suggestion": "one short sentence of coaching advice"
}

Rules:
- needsFollowUp = true if answer is vague, lacks examples, or misses the point
- followUpQuestion = a natural interviewer follow-up if needed, null otherwise
- starUsed = true if answer uses Situation/Task/Action/Result structure
- confidenceScore based on language assertiveness (avoid "I think", "maybe", "I guess")`;

        const ANALYZE_TIMEOUT_MS = 8_000; // 8s max for LLM analysis

        let completion;
        try {
            completion = await groqClient.chat.completions.create({
                model:       'llama-3.1-8b-instant',
                messages:    [{ role: 'user', content: analysisPrompt }],
                temperature: 0.3,
                max_tokens:  300,
            }, { timeout: ANALYZE_TIMEOUT_MS });
        } catch (error) {
            console.error('[voice/analyze-answer] Completion failed:', error.message);
            throw error;
        }

        const raw = completion.choices?.[0]?.message?.content?.trim() || '';

        // Parse JSON from response (handle markdown code blocks)
        const jsonMatch = raw.match(/\{[\s\S]+\}/);
        if (!jsonMatch) throw new Error('No JSON in response');

        const analysis = JSON.parse(jsonMatch[0]);
        res.json({
            needsFollowUp:    Boolean(analysis.needsFollowUp),
            followUpQuestion: analysis.followUpQuestion || null,
            clarityScore:     Number(analysis.clarityScore) || 5,
            specificityScore: Number(analysis.specificityScore) || 5,
            confidenceScore:  Number(analysis.confidenceScore) || 5,
            starUsed:         Boolean(analysis.starUsed),
            fillerWordImpact: analysis.fillerWordImpact || 'none',
            suggestion:       analysis.suggestion || '',
        });

    } catch (error) {
        console.error('[voice/analyze-answer] Error:', error.message?.substring(0, 150));
        // Return safe defaults — never block the interview flow
        res.json({ needsFollowUp: false, followUpQuestion: null, clarityScore: 6, specificityScore: 6, starUsed: false });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKCHANNEL CLIPS — One-time generation of "mm-hmm", "I see" etc.
// GET /api/voice/backchannel-clips?persona=friendly&gender=female
// Returns: { mmhmm: "data:audio/mpeg;base64,...", isee: ..., ... }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/backchannel-clips', optionalAuth, async (req, res) => {
    const persona = sanitizePersona(req.query.persona);
    const gender  = sanitizeGender(req.query.gender);

    try {
        const clips = await voiceService.generateBackchannelClips(persona, gender);
        if (!clips) {
            return res.json({ available: false, clips: {} });
        }
        res.json({ available: true, clips });
    } catch (error) {
        console.error('[voice/backchannel-clips] Error:', error.message?.substring(0, 150));
        res.json({ available: false, clips: {} });
    }
});



// ─────────────────────────────────────────────────────────────────────────────
// TTS HEALTH CHECK — Monitor provider performance
// GET /api/voice/tts-health
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tts-health', authenticateToken, (req, res) => {
    const stats = voiceService.getProviderStats();
    const providers = voiceService.getAvailableProviders();
    
    res.json({
        providers,
        stats,
        timestamp: Date.now(),
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER STATS (PHASE 3) — Regional performance analytics
// GET /api/voice/provider-stats?region=US-East
// Returns: { global: {...}, regions: {...}, optimalProviders: {...} }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/provider-stats', (req, res) => {
    const region = req.query.region || 'UNKNOWN';
    const stats = voiceService.getProviderStatsByRegion(region);
    
    res.json({
        region,
        stats,
        timestamp: Date.now(),
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BEST PROVIDER LOOKUP (PHASE 3) — Get optimal provider for region
// GET /api/voice/best-provider?region=US-East&service=TTS
// Returns: { provider: 'kokoro', score: 0.92, region: 'US-East' }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/best-provider', (req, res) => {
    const region = req.query.region || 'UNKNOWN';
    const service = req.query.service || 'TTS';
    const provider = voiceService.getBestProvider(service, region);
    const rankedProviders = voiceService.getRankedProviders(region);
    
    res.json({
        region,
        service,
        provider,
        rankedProviders,
        timestamp: Date.now(),
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// TTS CACHE STATUS — Service Worker cache statistics
// GET /api/voice/cache-status
// ─────────────────────────────────────────────────────────────────────────────
router.get('/cache-status', (req, res) => {
    // Service Worker cache stats are managed client-side
    // This endpoint provides server-side cache info (for future sync/debugging)
    res.json({
        sw_cache_enabled: true,
        cache_name: 'tts-v1',
        cache_ttl_ms: 24 * 60 * 60 * 1000,
        timestamp: Date.now(),
        description: 'Service Worker TTS cache — query client-side via useServiceWorkerTTS hook',
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// STT FILE — Legacy file-based STT (still used by other features)
// POST /api/voice/stt
// ─────────────────────────────────────────────────────────────────────────────
router.post('/stt', optionalAuth, upload.single('audio'), async (req, res) => {
    const filePath = req.file?.path;

    try {
        if (!filePath) return res.status(400).json({ error: 'Audio file is required' });

        const result = await voiceService.speechToText(filePath, req.body?.provider || null);
        safeDeleteTempFile(filePath);

        if (result.fallback) return res.status(200).json({ fallback: true, text: '' });

        res.json({
            text:       result.text,
            confidence: result.confidence,
            language:   result.language,
            provider:   result.provider,
        });
    } catch (error) {
        console.error('[voice/stt] Error:', error.message);
        safeDeleteTempFile(filePath);
        res.status(200).json({ fallback: true, text: '' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1.3: VOICE PERSONAS & INTELLIGENT ROUTING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/voice/personas
 * List all available voice personas, accents, and genders
 */
router.get('/personas', (req, res) => {
    try {
        const personas = voiceService.getAvailableVoicePersonas();
        res.json({
            success: true,
            data: personas
        });
    } catch (error) {
        console.error('[Voice API] Error getting personas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/voice/recommended
 * Get recommended persona for interview type and difficulty
 * Query params: interviewType (string), difficulty (easy|medium|hard)
 */
router.get('/recommended', (req, res) => {
    try {
        const { interviewType = 'general', difficulty = 'medium' } = req.query;

        const recommended = voiceService.getRecommendedPersona(interviewType, difficulty);

        res.json({
            success: true,
            data: {
                interviewType,
                difficulty,
                recommended
            }
        });
    } catch (error) {
        console.error('[Voice API] Error getting recommendation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/voice/validate
 * Validate a persona configuration
 * Body: { persona, accent, gender }
 */
router.post('/validate', (req, res) => {
    try {
        const { persona, accent = 'neutral', gender = 'female' } = req.body;

        if (!persona) {
            return res.status(400).json({
                success: false,
                error: 'Persona is required'
            });
        }

        const validation = voicePersonaManager.validatePersona(persona, accent, gender);

        res.json({
            success: true,
            data: {
                valid: validation.valid,
                persona,
                accent,
                gender,
                error: validation.error || null
            }
        });
    } catch (error) {
        console.error('[Voice API] Error validating persona:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/voice/select-provider
 * Get best provider for persona using intelligent routing
 * Body: { persona, accent, priority, context }
 */
router.post('/select-provider', (req, res) => {
    try {
        const { persona, accent = 'neutral', priority = 'quality', context = 'standard' } = req.body;

        if (!persona) {
            return res.status(400).json({
                success: false,
                error: 'Persona is required'
            });
        }

        const selection = voiceService.selectProviderForPersona(persona, accent, {
            priority,
            context
        });

        res.json({
            success: true,
            data: selection
        });
    } catch (error) {
        console.error('[Voice API] Error selecting provider:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/voice/provider-chain
 * Get provider fallback chain for persona
 * Query params: persona (required), accent (default: neutral), priority (default: quality)
 */
router.get('/provider-chain', (req, res) => {
    try {
        const { persona, accent = 'neutral', priority = 'quality' } = req.query;

        if (!persona) {
            return res.status(400).json({
                success: false,
                error: 'Persona is required'
            });
        }

        const chain = voiceService.getProviderChain(persona, accent, priority);

        res.json({
            success: true,
            data: {
                persona,
                accent,
                priority,
                provider_chain: chain
            }
        });
    } catch (error) {
        console.error('[Voice API] Error getting provider chain:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/voice/preview
 * Generate voice preview for UI testing
 * Body: { text, persona, accent, gender }
 */
router.post('/preview', async (req, res) => {
    try {
        const {
            text = "Hello! I am your AI interview assistant. Let's get started.",
            persona = 'default_neutral',
            accent = 'neutral',
            gender = 'female'
        } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Text is required for preview'
            });
        }

        const preview = await voiceService.generateVoicePreview(text, persona, accent, gender);

        if (!preview.success) {
            return res.status(503).json({
                success: false,
                error: preview.reason || 'Failed to generate preview'
            });
        }

        res.json({
            success: true,
            data: preview
        });
    } catch (error) {
        console.error('[Voice API] Error generating preview:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/voice/health
 * Check provider health status
 */
router.get('/health', (req, res) => {
    try {
        const providers = voiceService.getAvailableProviders();
        const health = {
            tts: {},
            stt: {}
        };

        // Check TTS provider health
        for (const [provider, available] of Object.entries(providers.tts)) {
            if (available && typeof providerRouter?.isProviderHealthy === 'function') {
                health.tts[provider] = {
                    available,
                    healthy: providerRouter.isProviderHealthy(provider)
                };
            } else {
                health.tts[provider] = {
                    available,
                    healthy: available
                };
            }
        }

        // STT is always available (client-side)
        health.stt = providers.stt;

        res.json({
            success: true,
            data: {
                recommended_tts: providers.recommended.tts,
                recommended_stt: providers.recommended.stt,
                providers: {
                    tts: health.tts,
                    stt: health.stt
                }
            }
        });
    } catch (error) {
        console.error('[Voice API] Error checking health:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
