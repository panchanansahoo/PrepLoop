/**
 * Voice Routes — Unified TTS/STT API endpoints
 * Supports multiple providers with automatic fallback
 */
import express from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import { optionalAuth } from '../middleware/auth.js';
import voiceService from '../services/voiceService.js';

const router = express.Router();

// Multer for audio file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => cb(null, `voice-stt-${Date.now()}-${file.originalname}`),
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/wav', 'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-wav'];
        cb(null, allowed.includes(file.mimetype) || file.originalname.match(/\.(wav|webm|mp3|ogg|m4a)$/i));
    }
});

// ─── Get available providers ───
router.get('/providers', (req, res) => {
    res.json(voiceService.getAvailableProviders());
});

// ─── Unified Text-to-Speech ───
router.post('/tts', optionalAuth, async (req, res) => {
    const { text, persona, provider } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await voiceService.textToSpeech(text, persona || 'friendly', provider || null);

        if (result.fallback) {
            // Signal frontend to use browser TTS
            return res.status(200).json({ fallback: true });
        }

        res.set({
            'Content-Type': result.contentType,
            'Content-Length': result.audio.length,
            'X-TTS-Provider': result.provider,
            'Cache-Control': 'no-cache',
        });
        res.send(result.audio);
    } catch (error) {
        console.error('Voice TTS error:', error.message?.substring(0, 200));
        res.status(200).json({ fallback: true });
    }
});

// ─── Get Deepgram token for frontend WebSocket STT ───
router.get('/deepgram-token', optionalAuth, (req, res) => {
    const token = voiceService.getDeepgramToken();

    if (!token) {
        return res.status(200).json({
            available: false,
            message: 'Deepgram not configured. Using browser speech recognition.',
        });
    }

    res.json({ available: true, token });
});

// ─── File-based Speech-to-Text ───
router.post('/stt', optionalAuth, upload.single('audio'), async (req, res) => {
    const filePath = req.file?.path;

    try {
        if (!filePath) {
            return res.status(400).json({ error: 'Audio file is required' });
        }

        const result = await voiceService.speechToText(filePath, req.body?.provider || null);

        // Clean up temp file
        try { fs.unlinkSync(filePath); } catch { }

        if (result.fallback) {
            return res.status(200).json({ fallback: true, text: '' });
        }

        res.json({
            text: result.text,
            confidence: result.confidence,
            language: result.language,
            provider: result.provider,
        });
    } catch (error) {
        console.error('Voice STT error:', error.message);
        try { if (filePath) fs.unlinkSync(filePath); } catch { }
        res.status(200).json({ fallback: true, text: '' });
    }
});

export default router;
