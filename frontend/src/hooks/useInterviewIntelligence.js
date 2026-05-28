import { useCallback, useMemo, useState } from 'react';
import { authFetch } from '../utils/authFetch';

const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'sort of', 'right'];

export function normalizeConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric * 100)));
}

export function detectFillersInText(text = '') {
  const normalized = String(text || '').toLowerCase().replace(/[^a-z\s]/g, ' ');
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const counts = Object.fromEntries(FILLERS.map((filler) => [filler, 0]));

  let total = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    const current = tokens[i];
    const next = tokens[i + 1] || '';
    const pair = `${current} ${next}`.trim();

    if (pair === 'you know' || pair === 'sort of') {
      counts[pair] += 1;
      total += 1;
      i += 1;
      continue;
    }

    if (counts[current] !== undefined) {
      counts[current] += 1;
      total += 1;
    }
  }

  return { counts, total };
}

export default function useInterviewIntelligence({ getAuthHeaders } = {}) {
  const [fillerCounts, setFillerCounts] = useState(() => Object.fromEntries(FILLERS.map((f) => [f, 0])));
  const [clarityScore, setClarityScore] = useState(0);
  const [specificityScore, setSpecificityScore] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');

  const ingestTranscript = useCallback((text) => {
    const detected = detectFillersInText(text);
    setFillerCounts(detected.counts);
    return detected;
  }, []);

  const ingestAudioConfidence = useCallback((rms) => {
    const bounded = Math.max(0, Math.min(1, Number(rms) || 0));
    const score = normalizeConfidence(bounded);
    setConfidenceScore(score);
    return score;
  }, []);

  const analyzeAnswer = useCallback(async (answer, question = '') => {
    try {
      const res = await authFetch('/api/voice/analyze-answer', {
        method: 'POST',
        body: JSON.stringify({ answer, question }),
      });

      if (!res.ok) throw new Error('analysis request failed');
      const payload = await res.json();

      setClarityScore(Number(payload.clarityScore || 0));
      setSpecificityScore(Number(payload.specificityScore || 0));
      if (Number.isFinite(Number(payload.confidenceScore))) {
        setConfidenceScore(Number(payload.confidenceScore));
      }
      setNeedsFollowUp(Boolean(payload.needsFollowUp));
      setFollowUpQuestion(String(payload.followUpQuestion || ''));

      return payload;
    } catch {
      const fallback = {
        clarityScore: 60,
        specificityScore: 50,
        confidenceScore,
        needsFollowUp: true,
        followUpQuestion: 'Could you add a specific result with metrics?',
      };
      setClarityScore(fallback.clarityScore);
      setSpecificityScore(fallback.specificityScore);
      setNeedsFollowUp(fallback.needsFollowUp);
      setFollowUpQuestion(fallback.followUpQuestion);
      return fallback;
    }
  }, [confidenceScore]);

  return useMemo(() => ({
    fillerCounts,
    totalFillers: Object.values(fillerCounts).reduce((sum, count) => sum + Number(count || 0), 0),
    clarityScore,
    specificityScore,
    confidenceScore,
    needsFollowUp,
    followUpQuestion,
    ingestTranscript,
    ingestAudioConfidence,
    analyzeAnswer,
  }), [
    fillerCounts,
    clarityScore,
    specificityScore,
    confidenceScore,
    needsFollowUp,
    followUpQuestion,
    ingestTranscript,
    ingestAudioConfidence,
    analyzeAnswer,
  ]);
}
