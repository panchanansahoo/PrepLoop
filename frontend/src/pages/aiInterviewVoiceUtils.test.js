import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  splitTextForTTS,
  buildAiInterviewTtsPayload,
  buildAiInterviewVoiceApiUrl,
  buildInterviewEndCleanup,
  WHISPER_DOMAIN_VOCABULARY_PROMPT,
  isSttCorrectionEnabled,
  setSttCorrectionFeatureFlag,
  clearSttCorrectionFeatureFlags,
  correctSttTechnicalTerms,
  getRecentSttTelemetry,
  getSttTelemetryLog,
  clearSttTelemetry,
  clearSttTelemetryLog,
  COMMON_ENGLISH_WORDS,
  levenshteinDistance,
  normalizedLevenshteinSimilarity,
} from './aiInterviewVoiceUtils';

describe('aiInterviewVoiceUtils - Core Voice Utilities (Baseline Tests)', () => {
  it('splits long text into bounded TTS chunks', () => {
    const longText = `${'Sentence one. '.repeat(20)}Sentence end.`;
    const chunks = splitTextForTTS(longText, 90);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 90)).toBe(true);
    expect(chunks.join(' ')).toContain('Sentence end.');
  });

  it('builds expected TTS payload for backend /api/voice/tts contract', () => {
    expect(buildAiInterviewTtsPayload({ text: '  Hello\nthere ', interviewerGender: 'male' })).toEqual({
      text: 'Hello there',
      persona: 'interviewer',
      language: 'en',
      gender: 'male',
    });

    expect(buildAiInterviewTtsPayload({ text: 'Hi', interviewerGender: 'unknown' }).gender).toBe('female');
  });

  it('normalizes voice endpoint paths under /api', () => {
    expect(buildAiInterviewVoiceApiUrl('/voice/tts', 'http://localhost:5000')).toBe(
      'http://localhost:5000/api/voice/tts',
    );

    expect(buildAiInterviewVoiceApiUrl('voice/tts', 'http://localhost:5000/api')).toBe(
      'http://localhost:5000/api/voice/tts',
    );
  });

  it('builds end interview cleanup callback with safe optional guards', () => {
    const clearPendingEndTimeout = vi.fn();
    const clearElapsedTimer = vi.fn();
    const stopVoiceRecording = vi.fn();
    const pauseCurrentTts = vi.fn();
    const cancelSpeechSynthesis = vi.fn();
    const setAiSpeaking = vi.fn();
    const setMicOn = vi.fn();
    const setPhase = vi.fn();

    const endInterview = buildInterviewEndCleanup({
      clearPendingEndTimeout,
      clearElapsedTimer,
      stopVoiceRecording,
      pauseCurrentTts,
      cancelSpeechSynthesis,
      setAiSpeaking,
      setMicOn,
      setPhase,
    });

    endInterview();

    expect(clearPendingEndTimeout).toHaveBeenCalledTimes(1);
    expect(clearElapsedTimer).toHaveBeenCalledTimes(1);
    expect(stopVoiceRecording).toHaveBeenCalledTimes(1);
    expect(pauseCurrentTts).toHaveBeenCalledTimes(1);
    expect(cancelSpeechSynthesis).toHaveBeenCalledTimes(1);
    expect(setAiSpeaking).toHaveBeenCalledWith(false);
    expect(setMicOn).toHaveBeenCalledWith(false);
    expect(setPhase).toHaveBeenCalledWith('summary');
  });
});

describe('aiInterviewVoiceUtils - Whisper Vocabulary Prompt', () => {
  it('exports the canonical WHISPER_DOMAIN_VOCABULARY_PROMPT matching domain requirements', () => {
    expect(typeof WHISPER_DOMAIN_VOCABULARY_PROMPT).toBe('string');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('Kubernetes');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('Redis');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('Kafka');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('PostgreSQL');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('BigQuery');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('gRPC');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('Docker');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('ACID');
    expect(WHISPER_DOMAIN_VOCABULARY_PROMPT).toContain('CAP theorem');
  });
});

describe('aiInterviewVoiceUtils - Dynamic Feature Flags', () => {
  beforeEach(() => {
    clearSttCorrectionFeatureFlags();
    clearSttTelemetry();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    clearSttCorrectionFeatureFlags();
    clearSttTelemetry();
    vi.unstubAllEnvs();
  });

  it('defaults to OFF (false) when no environment or runtime flags are set', () => {
    expect(isSttCorrectionEnabled()).toBe(false);
    const text = 'we deployed pods to coobernetes';
    expect(correctSttTechnicalTerms(text)).toBe(text);
  });

  it('enables dynamically via window.__PREPLOOP_FEATURE_FLAGS__.STT_CORRECTION without redeployment', () => {
    setSttCorrectionFeatureFlag(true);
    expect(isSttCorrectionEnabled()).toBe(true);
    expect(correctSttTechnicalTerms('we deployed pods to coobernetes')).toBe('we deployed pods to Kubernetes');

    // Hot-toggle OFF dynamically
    setSttCorrectionFeatureFlag(false);
    expect(isSttCorrectionEnabled()).toBe(false);
    expect(correctSttTechnicalTerms('we deployed pods to coobernetes')).toBe('we deployed pods to coobernetes');
  });

  it('enables dynamically via localStorage without redeployment', () => {
    window.localStorage.setItem('preploop_feature_stt_correction', 'true');
    expect(isSttCorrectionEnabled()).toBe(true);
    expect(correctSttTechnicalTerms('we deployed pods to coobernetes')).toBe('we deployed pods to Kubernetes');

    window.localStorage.setItem('preploop_feature_stt_correction', 'false');
    expect(isSttCorrectionEnabled()).toBe(false);
  });

  it('window override takes precedence over localStorage and env', () => {
    window.localStorage.setItem('preploop_feature_stt_correction', 'true');
    vi.stubEnv('VITE_FEATURE_STT_CORRECTION', 'true');
    window.__PREPLOOP_FEATURE_FLAGS__ = { STT_CORRECTION: false };

    expect(isSttCorrectionEnabled()).toBe(false);
  });

  it('falls back to VITE_FEATURE_STT_CORRECTION when window and localStorage are absent', () => {
    vi.stubEnv('VITE_FEATURE_STT_CORRECTION', 'true');
    expect(isSttCorrectionEnabled()).toBe(true);
  });

  it('options.enabled / options.force / options.forceEnabled bypasses flags for direct testing', () => {
    expect(isSttCorrectionEnabled()).toBe(false);
    expect(correctSttTechnicalTerms('we deployed pods to coobernetes', { enabled: true }))
      .toBe('we deployed pods to Kubernetes');
    expect(correctSttTechnicalTerms('we deployed pods to coobernetes', { force: true }))
      .toBe('we deployed pods to Kubernetes');
    expect(correctSttTechnicalTerms('we deployed pods to coobernetes', { forceEnabled: true }))
      .toBe('we deployed pods to Kubernetes');
  });
});

describe('aiInterviewVoiceUtils - Structured Machine-Readable Telemetry (No PII)', () => {
  beforeEach(() => {
    clearSttCorrectionFeatureFlags();
    clearSttTelemetry();
  });

  afterEach(() => {
    clearSttCorrectionFeatureFlags();
    clearSttTelemetry();
  });

  it('records structured telemetry event with machine-readable fields on correction without storing full transcript PII', () => {
    const customEventSpy = vi.fn();
    window.addEventListener('preploop:stt_correction', (e) => customEventSpy(e.detail));

    const original = 'we stored session tokens in radius cache';
    const result = correctSttTechnicalTerms(original, { enabled: true, sessionId: 'sess_123', turnIndex: 2 });

    expect(result).toBe('we stored session tokens in Redis cache');

    const log = getRecentSttTelemetry();
    expect(log.length).toBe(1);
    const event = log[0];

    expect(event.event).toBe('stt_term_corrected');
    expect(event.sessionId).toBe('sess_123');
    expect(event.turnIndex).toBe(2);
    expect(event.replacementsCount).toBeGreaterThanOrEqual(1);
    expect(typeof event.latencyMs).toBe('number');
    expect(event.latencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof event.timestamp).toBe('string');

    // Strict No PII Mandate: Full transcripts are omitted from telemetry records
    expect(event.originalText).toBeUndefined();
    expect(event.correctedText).toBeUndefined();
    expect(event.fullTranscript).toBeUndefined();

    // Replacements array holds token-level diffs
    expect(event.replacements.length).toBeGreaterThanOrEqual(1);
    expect(event.replacements[0].originalToken).toContain('radius');
    expect(event.replacements[0].correctedToken).toContain('Redis');
    expect(event.replacements[0].ruleTriggered).toBe('contextual_homophone');

    // DOM CustomEvent dispatch verified
    expect(customEventSpy).toHaveBeenCalledTimes(1);
    expect(customEventSpy.mock.calls[0][0].event).toBe('stt_term_corrected');
    expect(customEventSpy.mock.calls[0][0].originalText).toBeUndefined();

    // Verify alias exports
    expect(getSttTelemetryLog().length).toBe(1);
    clearSttTelemetryLog();
    expect(getRecentSttTelemetry().length).toBe(0);
  });

  it('does not emit telemetry when no terms are modified', () => {
    const text = 'The radius of the circle is five meters.';
    correctSttTechnicalTerms(text, { enabled: true });
    expect(getRecentSttTelemetry().length).toBe(0);
  });
});

describe('aiInterviewVoiceUtils - Negative STT Test Suite (0% False Positives)', () => {
  const NEGATIVE_TEST_CASES = [
    'The radius of the circle is five meters.',
    'We calculated the diameter using the outer radius of the sphere.',
    'All residents living within a five-mile radius were evacuated.',
    'The turning radius of this delivery truck is surprisingly narrow.',
    'Please draw an arc with a three-inch radius on the diagram.',
    'I watched the sequel of the movie last night.',
    'The author announced that the book sequel will be released next year.',
    'A tragic sequel of events followed the collapse of the negotiations.',
    'The original film was fantastic, but the sequel was disappointing.',
    'She spent two years writing the sequel to her debut novel.',
    'We parked the boat at the dock before the heavy storm hit.',
    'The cargo ship will dock at the harbor tomorrow morning.',
    'The warehouse workers unloaded wooden pallets at the loading dock.',
    'Several old fishing boats were tied to the wooden dock.',
    'Take a rest after the long walk through the nature reserve.',
    'You look very tired, so please get a good night of rest.',
    'We can discuss the rest of the agenda during tomorrow\'s team meeting.',
    'Put your mind at rest, everything will turn out fine.',
    'My grandmother baked a warm apple pie for Sunday dinner.',
    'The hikers carried a bright torch through the dark underground cavern.',
    'A glowing spark flew from the burning campfire into the cool evening air.',
    'The antique iron fence began to rust after the rainy season.',
    'She paid for the farmers market vegetables with paper cash and coins.',
    'They waited patiently in a long queue outside the concert hall.',
    'The theater actor missed his entrance cue during the second act.',
    'He boarded the express passenger train to visit his family in Chicago.',
    'The chef prepared a succulent rack of lamb served with mint sauce.',
    'Jason walked his golden retriever in the park every morning.',
    'How did the audience react when the headlining band walked onto the stage?',
    'The patient had a persistent cough and decided to rest at home.',
    'The storm clouds grew darker as the sunset faded behind the mountain.',
    'Please place the extra wool blankets in the dark container in the closet.',
    'He felt like a bit of a git for forgetting his coworker\'s name.',
    'We should go to the local library before the evening book sale closes.',
    'The child inserted a silver token into the carousel ride.',
  ];

  it('guarantees 0% false positives across all 35 non-technical sentences with STT correction enabled', () => {
    expect(NEGATIVE_TEST_CASES.length).toBeGreaterThanOrEqual(35);

    for (const sentence of NEGATIVE_TEST_CASES) {
      const result = correctSttTechnicalTerms(sentence, { enabled: true });
      expect(result).toBe(sentence);
    }
  });
});

describe('aiInterviewVoiceUtils - Regression Test for Known Bug', () => {
  it('preserves "we cache search results within a 5-mile radius" without converting to Redis', () => {
    const input = 'we cache search results within a 5-mile radius';
    const output = correctSttTechnicalTerms(input, { enabled: true });
    expect(output).toBe('we cache search results within a 5-mile radius');
  });

  it('preserves radius when distance context exists even if cache keyword is present', () => {
    expect(
      correctSttTechnicalTerms('We cache geographical locations within a 10-mile radius.', { enabled: true })
    ).toBe('We cache geographical locations within a 10-mile radius.');
  });
});

describe('aiInterviewVoiceUtils - Positive STT Recognition Test Suite', () => {
  it('corrects contextual homophones when technical context keywords are present', () => {
    expect(correctSttTechnicalTerms('We cache user sessions in radius', { enabled: true }))
      .toBe('We cache user sessions in Redis');

    expect(correctSttTechnicalTerms('we used radius cache for session storage', { enabled: true }))
      .toBe('we used Redis cache for session storage');

    expect(correctSttTechnicalTerms('we wrote a sequel query against the database table', { enabled: true }))
      .toBe('we wrote a SQL query against the database table');

    expect(correctSttTechnicalTerms('the analytics pipeline runs complex sequel queries with multiple joins', { enabled: true }))
      .toBe('the analytics pipeline runs complex SQL queries with multiple joins');

    expect(correctSttTechnicalTerms('we packaged the service into a dock container and deployed it', { enabled: true }))
      .toBe('we packaged the service into a Docker container and deployed it');

    expect(correctSttTechnicalTerms('the client calls the rest api endpoint using json over http', { enabled: true }))
      .toBe('the client calls the REST API endpoint using json over http');
  });

  it('corrects direct phonetic dictionary misrecognitions', () => {
    expect(correctSttTechnicalTerms('we deployed pods to coobernetes cluster', { enabled: true }))
      .toBe('we deployed pods to Kubernetes cluster');

    expect(correctSttTechnicalTerms('events are ingested into apache cough car topics', { enabled: true }))
      .toBe('events are ingested into Apache Kafka topics');

    expect(correctSttTechnicalTerms('we queried petabytes in big query on google cloud', { enabled: true }))
      .toBe('we queried petabytes in BigQuery on google cloud');

    expect(correctSttTechnicalTerms('the model was trained with pie torch on a cluster of gpus', { enabled: true }))
      .toBe('the model was trained with PyTorch on a cluster of gpus');

    expect(correctSttTechnicalTerms('we placed an engine x reverse proxy in front of the web servers', { enabled: true }))
      .toBe('we placed an NGINX reverse proxy in front of the web servers');

    expect(correctSttTechnicalTerms('services talk over gee rpc with protobuf definitions', { enabled: true }))
      .toBe('services talk over gRPC with protobuf definitions');

    expect(correctSttTechnicalTerms('we migrated from my sequel to post gres', { enabled: true }))
      .toBe('we migrated from MySQL to Postgres');

    expect(correctSttTechnicalTerms('we stored transactional data in postgres q l', { enabled: true }))
      .toBe('we stored transactional data in PostgreSQL');

    expect(correctSttTechnicalTerms('we stored user profiles in dynamo db', { enabled: true }))
      .toBe('we stored user profiles in DynamoDB');

    expect(correctSttTechnicalTerms('the auth service verifies jay dub dub tee signatures', { enabled: true }))
      .toBe('the auth service verifies JWT signatures');
  });

  it('corrects fuzzy terms above similarity threshold 0.82', () => {
    expect(correctSttTechnicalTerms('we deployed kubernets clusters', { enabled: true }))
      .toBe('we deployed Kubernetes clusters');

    expect(correctSttTechnicalTerms('we configured postgressql database', { enabled: true }))
      .toBe('we configured PostgreSQL database');

    expect(correctSttTechnicalTerms('we searched indices in elasticseach cluster', { enabled: true }))
      .toBe('we searched indices in Elasticsearch cluster');
  });

  it('protects English blocklist words from fuzzy replacement', () => {
    const blocklistSentences = [
      'My mother baked bread.',
      'We walked to the market.',
      'This is an important matter.',
      'Please listen carefully.',
      'A person arrived early.',
    ];

    for (const s of blocklistSentences) {
      expect(correctSttTechnicalTerms(s, { enabled: true })).toBe(s);
    }

    expect(COMMON_ENGLISH_WORDS.has('mother')).toBe(true);
    expect(COMMON_ENGLISH_WORDS.has('market')).toBe(true);
    expect(COMMON_ENGLISH_WORDS.has('matter')).toBe(true);
  });
});

describe('aiInterviewVoiceUtils - Levenshtein Distance & Similarity Math', () => {
  it('computes exact Levenshtein distance', () => {
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('a', '')).toBe(1);
    expect(levenshteinDistance('', 'b')).toBe(1);
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('kubernetes', 'kubernets')).toBe(1);
    expect(levenshteinDistance('Kubernetes', 'kubernets')).toBe(2); // case-sensitive diff: 'K' vs 'k' + missing 'e'
  });

  it('computes normalized similarity between 0 and 1', () => {
    expect(normalizedLevenshteinSimilarity('same', 'same')).toBe(1);
    expect(normalizedLevenshteinSimilarity('', 'word')).toBe(0);
    expect(normalizedLevenshteinSimilarity('kubernets', 'Kubernetes')).toBeGreaterThanOrEqual(0.82);
  });
});
