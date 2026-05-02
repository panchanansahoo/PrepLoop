import express from 'express';
import { voicePersonaManager } from '../utils/voicePersonaManager.js';
import { providerRouter } from '../utils/providerRouter.js';
import * as voiceService from '../services/voiceService.js';

const router = express.Router();

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
