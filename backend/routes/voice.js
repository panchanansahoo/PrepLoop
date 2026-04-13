/**
 * Voice Routes — Unified TTS/STT API endpoints
 * Supports: Kokoro (local), Groq Orpheus, Deepgram, browser fallback
 */
import express from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import { optionalAuth, authenticateToken } from '../middleware/auth.js';
import voiceService from '../services/voiceService.js';

const router = express.Router();

// Multer config — accepts audio blobs up to 25 MB
const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => cb(null, `voice-stt-${Date.now()}-${file.originalname}`),
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
router.get('/providers', (req, res) => {
    res.json(voiceService.getAvailableProviders());
});

// ─────────────────────────────────────────────────────────────────────────────
// TTS — Buffered (primary endpoint, used by useVoiceInterview)
// POST /api/voice/tts
// Chain: Kokoro (local) → Groq Orpheus → Google TTS → { fallback: true }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tts', optionalAuth, async (req, res) => {
    const { text, persona, provider, language, gender } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await voiceService.textToSpeech(
            text,
            persona || 'friendly',
            provider || null,
            language || 'en',
            gender  || 'female'
        );

        if (result.fallback) {
            return res.status(200).json({ fallback: true });
        }

        res.set({
            'Content-Type':   result.contentType,
            'Content-Length': result.audio.length,
            'X-TTS-Provider': result.provider,
            'X-TTS-Voice':    result.voice || '',
            'Cache-Control':  'no-cache',
        });
        res.send(result.audio);
    } catch (error) {
        console.error('[voice/tts] Error:', error.message?.substring(0, 200));
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
    const { text, persona, language, gender } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await voiceService.textToSpeech(
            text,
            persona  || 'friendly',
            null,
            language || 'en',
            gender   || 'female'
        );

        if (result.fallback) {
            return res.status(200).json({ fallback: true });
        }

        res.set({
            'Content-Type':   result.contentType,
            'Content-Length': result.audio.length,
            'X-TTS-Provider': result.provider,
            'X-TTS-Voice':    result.voice || '',
            'Cache-Control':  'no-cache',
        });
        res.send(result.audio);
    } catch (error) {
        console.error('[voice/tts-stream] Error:', error.message?.substring(0, 200));
        if (!res.headersSent) res.status(200).json({ fallback: true });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// STT CHUNK — Real-time Deepgram (250ms chunks from MediaRecorder)
// POST /api/voice/stt-chunk
// Body: multipart/form-data with audio field (raw webm blob)
// Returns: { transcript, isFinal, confidence, words, fillerWords }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/stt-chunk', optionalAuth, rawUpload.single('audio'), async (req, res) => {
    if (!req.file || !req.file.buffer || req.file.buffer.length < 100) {
        return res.status(400).json({ error: 'Audio chunk is required', transcript: '', isFinal: false });
    }

    const mimeType = req.file.mimetype || req.body.mimeType || 'audio/webm';

    try {
        const result = await voiceService.speechToTextChunk(req.file.buffer, mimeType);

        if (result.fallback) {
            return res.status(200).json({ transcript: '', isFinal: false, confidence: 0, fallback: true });
        }

        res.json({
            transcript:  result.transcript,
            isFinal:     result.isFinal,
            confidence:  result.confidence,
            words:       result.words,
            fillerWords: result.fillerWords,
            provider:    result.provider,
        });
    } catch (error) {
        console.error('[voice/stt-chunk] Error:', error.message?.substring(0, 200));
        res.status(200).json({ transcript: '', isFinal: false, confidence: 0, error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ANALYZE ANSWER — Groq-powered post-answer intelligence
// POST /api/voice/analyze-answer
// Body: { question, answer }
// Returns: { needsFollowUp, followUpQuestion, clarityScore, specificityScore, starUsed }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/analyze-answer', optionalAuth, async (req, res) => {
    const { question, answer, interviewType } = req.body;

    if (!answer || answer.trim().length < 10) {
        return res.json({ needsFollowUp: false, followUpQuestion: null, clarityScore: 5, specificityScore: 5, starUsed: false });
    }

    try {
        // Use Groq llama-3.1-8b-instant (fast, free) for analysis
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const analysisPrompt = `You are an expert interview coach analyzing a candidate's answer.

Question: "${question || 'General interview question'}"
Answer: "${answer.substring(0, 800)}"
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

        const completion = await groq.chat.completions.create({
            model:       'llama-3.1-8b-instant',
            messages:    [{ role: 'user', content: analysisPrompt }],
            temperature: 0.3,
            max_tokens:  300,
        });

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
    const { persona = 'friendly', gender = 'female' } = req.query;

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
// DEEPGRAM TOKEN — For frontend WebSocket STT (if enabled)
// GET /api/voice/deepgram-token  (requires auth)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/deepgram-token', optionalAuth, (req, res) => {
    const token = voiceService.getDeepgramToken();
    if (!token) {
        return res.status(200).json({ available: false, message: 'Deepgram not configured. Using browser speech recognition.' });
    }
    res.json({ available: true, token });
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
        try { fs.unlinkSync(filePath); } catch { }

        if (result.fallback) return res.status(200).json({ fallback: true, text: '' });

        res.json({
            text:       result.text,
            confidence: result.confidence,
            language:   result.language,
            provider:   result.provider,
        });
    } catch (error) {
        console.error('[voice/stt] Error:', error.message);
        try { if (filePath) fs.unlinkSync(filePath); } catch { }
        res.status(200).json({ fallback: true, text: '' });
    }
});

export default router;
