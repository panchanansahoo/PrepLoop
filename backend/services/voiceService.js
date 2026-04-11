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
    female: {
        friendly: '21m00Tcm4TlvDq8ikWAM',   // Rachel — warm, natural
        analytical: 'EXAVITQu4vr4xnSDxMaL',  // Bella — clear, precise
        formal: 'EXAVITQu4vr4xnSDxMaL',      // Bella (or another suitable female)
        casual: 'MF3mGyEYCl7XYWbV9V6O',      // Elli — youthful, casual
        default: '21m00Tcm4TlvDq8ikWAM',
    },
    male: {
        friendly: 'pNInz6obpgDQGcFmaJcg',    // Adam (or equivalent warm male voice)
        analytical: 'ErXwobaYiN019PkySvjV',   // Antoni
        formal: 'ErXwobaYiN019PkySvjV',      // Antoni — professional male
        casual: 'pNInz6obpgDQGcFmaJcg',      
        default: 'ErXwobaYiN019PkySvjV',
    }
};

const GROQ_VOICES = {
    female: {
        friendly: 'hannah',      // clearer female tone for interview prompts
        analytical: 'hannah',    // clear, articulate
        formal: 'hannah',        
        casual: 'autumn',        // relaxed, natural
        default: 'hannah',
    },
    male: {
        friendly: 'austin',       // warm male voice
        analytical: 'austin',    
        formal: 'austin',        // professional male
        casual: 'austin',        
        default: 'austin',
    }
};

const PLAYAI_VOICES = {
    female: {
        friendly: 'Celeste-PlayAI',      // warm, approachable female
        analytical: 'Jennifer-PlayAI',       
        formal: 'Celeste-PlayAI',           
        casual: 'Jennifer-PlayAI',        // relaxed, natural female
        default: 'Celeste-PlayAI',
    },
    male: {
        friendly: 'Fritz-PlayAI',      
        analytical: 'Fritz-PlayAI',       // clear, precise male
        formal: 'Fritz-PlayAI',           // professional male
        casual: 'Fritz-PlayAI',        
        default: 'Fritz-PlayAI',
    }
};

function normalizeGender(gender) {
    const normalized = String(gender || '').trim().toLowerCase();
    if (normalized === 'male' || normalized === 'man') return 'male';
    if (normalized === 'female' || normalized === 'woman') return 'female';
    return 'female';
}

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
 * ElevenLabs → Groq Orpheus → { fallback: true }
 * 
 * @param {string} text - Text to synthesize
 * @param {string} persona - Voice persona (friendly, analytical, formal, casual)
 * @param {string} preferredProvider - Force a specific provider
 * @param {string} language - Requested announcement language
 * @returns {{ audio: Buffer, contentType: string } | { fallback: true }}
 */
export async function textToSpeech(text, persona = 'friendly', preferredProvider = null, language = 'en', gender = 'female') {
    if (!text || text.trim().length === 0) {
        throw new Error('Text is required for TTS');
    }

    const normalizedText = String(text).trim();
    const normalizedGender = normalizeGender(gender);
    const normalizedLanguage = String(language || 'en').toLowerCase();
    const requiresMultilingualSupport = normalizedLanguage !== 'en' && normalizedLanguage !== 'en-us';

    // Try ElevenLabs first for multilingual output, or for the default English path.
    if (providers.elevenlabs && (!preferredProvider || preferredProvider === 'elevenlabs' || requiresMultilingualSupport)) {
        try {
            const result = await elevenLabsTTS(normalizedText, persona, normalizedLanguage, normalizedGender);
            if (result) return result;
        } catch (err) {
            console.warn('ElevenLabs TTS failed:', err.message?.substring(0, 150));
        }
    }

    // Groq PlayAI is our fallback for multilingual requests when ElevenLabs is unavailable.
    if (providers.groq && requiresMultilingualSupport && (!preferredProvider || preferredProvider === 'groq' || preferredProvider === 'groq-playai')) {
        try {
            const result = await groqPlayAITTS(normalizedText, persona, normalizedGender);
            if (result) return result;
        } catch (err) {
            console.warn('Groq PlayAI TTS failed:', err.message?.substring(0, 150));
        }
    }

    // Last-resort multilingual fallback that works without any API key.
    if (requiresMultilingualSupport && (!preferredProvider || preferredProvider === 'browser')) {
        try {
            const result = await googleTranslateTTS(normalizedText, normalizedLanguage);
            if (result) return result;
        } catch (err) {
            console.warn('Google Translate TTS failed:', err.message?.substring(0, 150));
        }
    }

    // Groq Orpheus — stable English voice path (200 char limit)
    if (!requiresMultilingualSupport && providers.groq && (!preferredProvider || preferredProvider === 'groq' || preferredProvider === 'groq-orpheus')) {
        try {
            const result = await groqOrpheusTTS(normalizedText, persona, normalizedGender);
            if (result) return result;
        } catch (err) {
            console.warn('Groq Orpheus TTS failed:', err.message?.substring(0, 150));
        }
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
 * Production defaults to disabling direct key exposure.
 */
export function getDeepgramToken() {
    if (!providers.deepgram) return null;
    if (process.env.EXPOSE_DEEPGRAM_TOKEN !== 'true') return null;
    return process.env.DEEPGRAM_API_KEY;
}

// ─── Provider Implementations ───

async function elevenLabsTTS(text, persona, language = 'en', gender = 'female') {
    const genderDict = ELEVENLABS_VOICES[gender] || ELEVENLABS_VOICES.female;
    const voiceId = genderDict[persona] || genderDict.default;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const normalizedLanguage = String(language || 'en').toLowerCase();
    const modelId = normalizedLanguage !== 'en' && normalizedLanguage !== 'en-us'
        ? 'eleven_multilingual_v2'
        : 'eleven_multilingual_v2';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
            text,
            model_id: modelId,
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

// --- Utility Functions for Chunking and WAV manipulation ---
function chunkText(text, maxLength) {
    const chunks = [];
    let current = text.trim();
    while (current.length > maxLength) {
        let splitIndex = current.lastIndexOf('.', maxLength);
        if (splitIndex === -1) splitIndex = current.lastIndexOf('?', maxLength);
        if (splitIndex === -1) splitIndex = current.lastIndexOf('!', maxLength);
        if (splitIndex === -1) splitIndex = current.lastIndexOf('\n', maxLength);
        
        if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
            let commaIndex = current.lastIndexOf(',', maxLength);
            if (commaIndex !== -1 && commaIndex > maxLength * 0.5) {
                splitIndex = commaIndex + 1;
            } else {
                let spaceIndex = current.lastIndexOf(' ', maxLength);
                if (spaceIndex !== -1) {
                    splitIndex = spaceIndex;
                } else {
                    splitIndex = maxLength; // hard split
                }
            }
        } else {
            splitIndex += 1;
        }

        chunks.push(current.substring(0, splitIndex).trim());
        current = current.substring(splitIndex).trim();
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
}

function combineWavContent(buffers) {
    if (!buffers || buffers.length === 0) return Buffer.alloc(0);
    if (buffers.length === 1) return buffers[0];
    
    // Parse the 44-byte WAV header from the first buffer
    const header = Buffer.from(buffers[0].subarray(0, 44));
    
    // Extract PCM data without the headers
    const pcmData = buffers.map(b => b.length > 44 ? b.subarray(44) : Buffer.alloc(0));
    const combinedPcm = Buffer.concat(pcmData);

    // Create the new output buffer
    const outBuffer = Buffer.concat([header, combinedPcm]);
    
    // Update sizes in header (little endian 32-bit)
    outBuffer.writeUInt32LE(outBuffer.length - 8, 4); // ChunkSize
    outBuffer.writeUInt32LE(combinedPcm.length, 40);  // Subchunk2Size (PCM Data Size)

    return outBuffer;
}
// -----------------------------------------------------------

async function groqOrpheusTTS(text, persona, gender = 'female') {
    const genderDict = GROQ_VOICES[gender] || GROQ_VOICES.female;
    const voice = genderDict[persona] || genderDict.default;

    const direction = persona === 'friendly' ? '[cheerful] ' : '';
    // Orpheus max limit is 200. Account for the length of direction string.
    const chunkLimit = 200 - direction.length;
    const chunks = chunkText(text, chunkLimit);
    
    const buffers = [];
    // Process sequentially to be safe with rate limits and output ordering
    for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const response = await groq.audio.speech.create({
            model: 'canopylabs/orpheus-v1-english',
            input: direction + chunk,
            voice,
            response_format: 'wav',
        });
        
        const chunkBuffer = Buffer.from(await response.arrayBuffer());
        if (chunkBuffer.length > 100) {
            buffers.push(chunkBuffer);
        }
    }

    if (buffers.length === 0) throw new Error('Orpheus returned empty audio for all chunks');

    const finalBuffer = combineWavContent(buffers);
    return { audio: finalBuffer, contentType: 'audio/wav', provider: 'groq-orpheus', voice };
}

async function groqPlayAITTS(text, persona = 'friendly', gender = 'female') {
    // Choose voice based on persona for a natural experience
    const genderDict = PLAYAI_VOICES[gender] || PLAYAI_VOICES.female;
    const voice = genderDict[persona] || genderDict.default;

    const response = await groq.audio.speech.create({
        model: 'playai-tts',
        input: text,
        voice,
        response_format: 'wav',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) throw new Error('PlayAI returned empty audio');

    return { audio: buffer, contentType: 'audio/wav', provider: 'groq-playai' };
}

async function googleTranslateTTS(text, language) {
    const voiceLanguage = /^hi/i.test(language) ? 'hi' : 'en';
    const query = new URLSearchParams({
        ie: 'UTF-8',
        client: 'tw-ob',
        tl: voiceLanguage,
        q: text,
    });

    const response = await fetch(`https://translate.google.com/translate_tts?${query.toString()}`, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://translate.google.com/',
        },
    });

    if (!response.ok) {
        throw new Error(`Google TTS API error: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) throw new Error('Google TTS returned empty audio');

    return { audio: buffer, contentType: 'audio/mpeg', provider: 'google-translate' };
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
