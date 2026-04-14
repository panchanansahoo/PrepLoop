import { describe, it, expect } from 'vitest';
import {
    buildDeepgramVoiceApiUrl,
    buildDeepgramStreamingUrl,
    getAdaptiveSilenceMs,
    isAudioContentType,
    shouldTreatTtsResponseAsFallback,
    shouldAutoSubmitAnswer,
} from './useDeepgramVoice';

describe('useDeepgramVoice helpers', () => {
    it('uses longer silence windows for shorter answers', () => {
        expect(getAdaptiveSilenceMs(20)).toBe(2500);
        expect(getAdaptiveSilenceMs(80)).toBe(1800);
        expect(getAdaptiveSilenceMs(260)).toBe(1200);
    });

    it('builds the Deepgram websocket url with the streaming options', () => {
        const url = buildDeepgramStreamingUrl();

        expect(url).toContain('wss://api.deepgram.com/v1/listen?');
        expect(url).toContain('model=nova-2');
        expect(url).toContain('interim_results=true');
        expect(url).toContain('utterance_end_ms=1200');
        expect(url).toContain('endpointing=300');
    });

    it('builds voice api urls from the configured backend origin', () => {
        expect(buildDeepgramVoiceApiUrl('/voice/tts-stream', 'http://localhost:5000')).toBe('http://localhost:5000/api/voice/tts-stream');
        expect(buildDeepgramVoiceApiUrl('/voice/tts-stream', 'http://localhost:5000/api')).toBe('http://localhost:5000/api/voice/tts-stream');
    });

    it('only auto-submits when an utterance ended and the transcript is quiet enough', () => {
        expect(
            shouldAutoSubmitAnswer({
                transcriptLength: 120,
                inputLevel: 0.03,
                utteranceEnded: true,
            })
        ).toBe(true);

        expect(
            shouldAutoSubmitAnswer({
                transcriptLength: 120,
                inputLevel: 0.2,
                utteranceEnded: true,
            })
        ).toBe(false);

        expect(
            shouldAutoSubmitAnswer({
                transcriptLength: 120,
                inputLevel: 0.03,
                utteranceEnded: false,
            })
        ).toBe(false);
    });

    it('detects valid audio content types for TTS playback', () => {
        expect(isAudioContentType('audio/wav')).toBe(true);
        expect(isAudioContentType('audio/mpeg')).toBe(true);
        expect(isAudioContentType('application/json')).toBe(false);
        expect(isAudioContentType('')).toBe(false);
    });

    it('treats non-audio or tiny blobs as fallback responses', () => {
        expect(
            shouldTreatTtsResponseAsFallback({
                contentType: 'application/json; charset=utf-8',
                blobSize: 210,
            })
        ).toBe(true);

        expect(
            shouldTreatTtsResponseAsFallback({
                contentType: 'audio/wav',
                blobSize: 40,
            })
        ).toBe(true);

        expect(
            shouldTreatTtsResponseAsFallback({
                contentType: 'audio/wav',
                blobSize: 1024,
            })
        ).toBe(false);
    });
});
