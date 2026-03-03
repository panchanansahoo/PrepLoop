/**
 * Voice Service — Unified TTS/STT provider abstraction
 * Supports: ElevenLabs, Groq (Orpheus/PlayAI/Whisper), browser fallback
 */
import 'dotenv/config';
import Groq from 'groq-sdk';
import fs from 'fs';

// ─── Provider availability ───
const providers = {
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    deepgram: !!process.env.DEEPGRAM_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
};

const groq = providers.groq ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// ─── Voice Presets ───
const ELEVENLABS_VOICES = {
    friendly: '21m00Tcm4TlvDq8ikWAM',   // Rachel — warm, natural
    analytical: 'EXAVITQu4vr4xnSDxMaL',  // Bella — clear, precise
    formal: 'ErXwobaYiN019PkySvjV',      // Antoni — professional male
    casual: 'MF3mGyEYCl7XYWbV9V6O',      // Elli — youthful, casual
    default: '21m00Tcm4TlvDq8ikWAM',
};

const GROQ_VOICES = {
    friendly: 'diana',       // warm female voice
    analytical: 'hannah',    // clear, articulate
    formal: 'daniel',        // professional male
    casual: 'autumn',        // relaxed, natural
    default: 'diana',
};

/**
 * Get available voice providers
 */
export function getAvailableProviders() {
    return {
        tts: {
            elevenlabs: providers.elevenlabs,
            groq: providers.groq,
            browser: true, // always available as fallback
        },
        stt: {
            deepgram: providers.deepgram,
            groq: providers.groq,
            browser: true,
        },
        recommended: {
            tts: providers.elevenlabs ? 'elevenlabs' : providers.groq ? 'groq' : 'browser',
            stt: providers.deepgram ? 'deepgram' : providers.groq ? 'groq' : 'browser',
        }
    };
}

/**
 * Text-to-Speech with provider fallback chain
 * ElevenLabs → Groq Orpheus → Groq PlayAI → { fallback: true }
 * 
 * @param {string} text - Text to synthesize
 * @param {string} persona - Voice persona (friendly, analytical, formal, casual)
 * @param {string} preferredProvider - Force a specific provider
 * @returns {{ audio: Buffer, contentType: string } | { fallback: true }}
 */
export async function textToSpeech(text, persona = 'friendly', preferredProvider = null) {
    if (!text || text.trim().length === 0) {
        throw new Error('Text is required for TTS');
    }

    // Truncate text — Orpheus has 200 char max per request
    const truncatedText = text.length > 190 ? text.substring(0, 190) : text;

    // Try ElevenLabs first (if available and not forced to another provider)
    if (providers.elevenlabs && (!preferredProvider || preferredProvider === 'elevenlabs')) {
        try {
            const result = await elevenLabsTTS(truncatedText, persona);
            if (result) return result;
        } catch (err) {
            console.warn('ElevenLabs TTS failed:', err.message?.substring(0, 150));
        }
    }

    // Try Groq Orpheus
    if (providers.groq && (!preferredProvider || preferredProvider === 'groq')) {
        try {
            const result = await groqOrpheusTTS(truncatedText, persona);
            if (result) return result;
        } catch (err) {
            console.warn('Groq Orpheus TTS failed:', err.message?.substring(0, 150));
        }
        // Groq Orpheus is the only available Groq TTS model now
    }

    // All providers failed — signal frontend to use browser TTS
    return { fallback: true };
}

/**
 * Speech-to-Text from audio file
 * Deepgram → Groq Whisper → { fallback: true }
 */
export async function speechToText(filePath, preferredProvider = null) {
    if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('Valid audio file path is required');
    }

    // Try Deepgram
    if (providers.deepgram && (!preferredProvider || preferredProvider === 'deepgram')) {
        try {
            const result = await deepgramSTT(filePath);
            if (result) return result;
        } catch (err) {
            console.warn('Deepgram STT failed:', err.message?.substring(0, 150));
        }
    }

    // Try Groq Whisper
    if (providers.groq && (!preferredProvider || preferredProvider === 'groq')) {
        try {
            const result = await groqWhisperSTT(filePath);
            if (result) return result;
        } catch (err) {
            console.warn('Groq Whisper STT failed:', err.message?.substring(0, 150));
        }
    }

    return { fallback: true, text: '' };
}

/**
 * Get a temporary Deepgram API key for frontend WebSocket STT
 * In production, you'd use Deepgram's temporary key API.
 * For now, we return the key directly (only for trusted frontends).
 */
export function getDeepgramToken() {
    if (!providers.deepgram) return null;
    return process.env.DEEPGRAM_API_KEY;
}

// ─── Provider Implementations ───

async function elevenLabsTTS(text, persona) {
    const voiceId = ELEVENLABS_VOICES[persona] || ELEVENLABS_VOICES.default;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.65,
                similarity_boost: 0.8,
                style: 0.5,
                use_speaker_boost: true,
            }
        }),
    });

    if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) throw new Error('ElevenLabs returned empty audio');

    return { audio: buffer, contentType: 'audio/mpeg', provider: 'elevenlabs' };
}

async function groqOrpheusTTS(text, persona) {
    const voice = GROQ_VOICES[persona] || GROQ_VOICES.default;

    // Add vocal direction for friendlier delivery
    const vocalText = persona === 'friendly'
        ? `[cheerful] ${text}`
        : text;

    const response = await groq.audio.speech.create({
        model: 'canopylabs/orpheus-v1-english',
        input: vocalText.substring(0, 200), // Orpheus 200 char hard limit
        voice,
        response_format: 'wav',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) throw new Error('Orpheus returned empty audio');

    return { audio: buffer, contentType: 'audio/wav', provider: 'groq-orpheus' };
}

async function groqPlayAITTS(text) {
    const response = await groq.audio.speech.create({
        model: 'playai-tts',
        input: text,
        voice: 'Jennifer-PlayAI',
        response_format: 'wav',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) throw new Error('PlayAI returned empty audio');

    return { audio: buffer, contentType: 'audio/wav', provider: 'groq-playai' };
}

async function deepgramSTT(filePath) {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    const audioBuffer = fs.readFileSync(filePath);

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'audio/wav',
        },
        body: audioBuffer,
    });

    if (!response.ok) {
        throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return {
        text: transcript,
        confidence: data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
        language: 'en',
        provider: 'deepgram',
    };
}

async function groqWhisperSTT(filePath) {
    const transcription = await groq.audio.transcriptions.create({
        model: 'whisper-large-v3-turbo',
        file: fs.createReadStream(filePath),
        response_format: 'json',
    });

    return {
        text: transcription.text || '',
        language: transcription.language || 'en',
        provider: 'groq-whisper',
    };
}

export default { textToSpeech, speechToText, getDeepgramToken, getAvailableProviders };
