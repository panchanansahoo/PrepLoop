import { buildApiUrl } from '../utils/safeApiUrl';

const DEFAULT_TTS_MAX_CHUNK_LENGTH = 220;

function sanitizeTtsInput(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitTextForTTS(input, maxChunkLength = DEFAULT_TTS_MAX_CHUNK_LENGTH) {
  const normalized = sanitizeTtsInput(input);
  if (!normalized) return [];

  const limit = Number.isFinite(maxChunkLength) && maxChunkLength > 40
    ? Math.floor(maxChunkLength)
    : DEFAULT_TTS_MAX_CHUNK_LENGTH;

  if (normalized.length <= limit) {
    return [normalized];
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];
  const chunks = [];
  let buffer = '';

  for (const sentence of sentences) {
    const candidate = `${buffer} ${sentence}`.trim();

    if (candidate.length <= limit) {
      buffer = candidate;
      continue;
    }

    if (buffer) {
      chunks.push(buffer);
      buffer = '';
    }

    if (sentence.length <= limit) {
      buffer = sentence.trim();
      continue;
    }

    // Fallback for very long single sentence: split by words.
    const words = sentence.trim().split(/\s+/);
    let wordBuffer = '';

    for (const word of words) {
      const wordCandidate = `${wordBuffer} ${word}`.trim();
      if (wordCandidate.length <= limit) {
        wordBuffer = wordCandidate;
      } else {
        if (wordBuffer) {
          chunks.push(wordBuffer);
        }
        wordBuffer = word;
      }
    }

    if (wordBuffer) {
      buffer = wordBuffer;
    }
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks.filter(Boolean);
}

export function buildAiInterviewTtsPayload({ text, interviewerGender }) {
  const sanitizedText = sanitizeTtsInput(text);

  return {
    text: sanitizedText,
    persona: 'interviewer',
    language: 'en',
    gender: interviewerGender === 'male' ? 'male' : 'female',
  };
}

export function buildAiInterviewVoiceApiUrl(path, rawBaseUrl) {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  return buildApiUrl(normalizedPath, {
    rawBaseUrl,
    apiPrefix: '/api',
  });
}

export function buildInterviewEndCleanup(options) {
  return function endInterview() {
    options?.clearPendingEndTimeout?.();
    options?.clearElapsedTimer?.();
    options?.stopVoiceRecording?.();
    options?.pauseCurrentTts?.();
    options?.cancelSpeechSynthesis?.();
    options?.setAiSpeaking?.(false);
    options?.setMicOn?.(false);
    options?.setPhase?.('summary');
  };
}
