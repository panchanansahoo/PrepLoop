import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('transcript-playback');

export interface TranscriptTurnInput {
  turnIndex?: number;
  speaker: 'interviewer' | 'candidate' | 'system';
  transcriptText: string;
  idealAnswer?: string;
  turnScore?: number | null;
  feedbackNotes?: string;
  timestampMs?: number;
  audioUrl?: string | null;
  audioConsent?: boolean;
}

export interface PlaybackTurn {
  id: string;
  sessionId: string;
  turnIndex: number;
  speaker: 'interviewer' | 'candidate' | 'system';
  whatYouSaid: string;
  idealAnswer: string;
  turnScore: number | null;
  feedbackNotes: string;
  timestampMs: number;
  audioUrl: string | null;
  audioConsent: boolean;
  createdAt: string;
}

const memoryTranscriptStore = new Map<string, PlaybackTurn[]>();

function sanitizeAudioUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = String(rawUrl).trim().slice(0, 1000);
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}

function isSchemaMissingError(error: any): boolean {
  const code = String(error?.code || '').toUpperCase();
  return code === '42P01' || code === '42703' || code === 'PGRST205';
}

export async function saveTranscriptTurns(
  userId: string,
  sessionId: string,
  turns: TranscriptTurnInput[]
): Promise<{ saved: PlaybackTurn[]; storage: 'supabase' | 'memory' }> {
  const cleanSessionId = String(sessionId || '').trim();
  if (!cleanSessionId) {
    throw new Error('sessionId is required');
  }

  const normalized = (Array.isArray(turns) ? turns : []).map((t, idx) => ({
    session_id: cleanSessionId,
    user_id: userId,
    turn_index: Number.isFinite(Number(t.turnIndex)) ? Number(t.turnIndex) : idx,
    speaker: (['interviewer', 'candidate', 'system'].includes(t.speaker) ? t.speaker : 'candidate') as
      | 'interviewer'
      | 'candidate'
      | 'system',
    transcript_text: String(t.transcriptText || '').slice(0, 8000),
    ideal_answer: String(t.idealAnswer || '').slice(0, 8000),
    turn_score: t.turnScore !== undefined && t.turnScore !== null && Number.isFinite(Number(t.turnScore))
      ? Math.max(0, Math.min(100, Number(t.turnScore)))
      : null,
    feedback_notes: String(t.feedbackNotes || '').slice(0, 2000),
    timestamp_ms: Math.max(0, Number(t.timestampMs) || idx * 15000),
    audio_url: t.audioConsent ? sanitizeAudioUrl(t.audioUrl) : null,
    audio_consent: Boolean(t.audioConsent),
  }));

  if (normalized.length === 0) {
    return { saved: [], storage: 'memory' };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('interview_transcripts')
      .insert(normalized)
      .select('*');

    if (!error && Array.isArray(data)) {
      return {
        storage: 'supabase',
        saved: data.map((row: any) => ({
          id: row.id,
          sessionId: row.session_id,
          turnIndex: row.turn_index,
          speaker: row.speaker,
          whatYouSaid: row.transcript_text,
          idealAnswer: row.ideal_answer || '',
          turnScore: row.turn_score !== null ? Number(row.turn_score) : null,
          feedbackNotes: row.feedback_notes || '',
          timestampMs: row.timestamp_ms || 0,
          audioUrl: row.audio_url || null,
          audioConsent: Boolean(row.audio_consent),
          createdAt: row.created_at,
        })),
      };
    }

    if (error && !isSchemaMissingError(error)) {
      logger.warn('Failed to persist transcript turns to Supabase; falling back to memory', {
        sessionId: cleanSessionId,
        error: error.message,
      });
    }
  } catch (err: any) {
    logger.warn('Transcript persistence error; using memory fallback', {
      sessionId: cleanSessionId,
      error: err.message,
    });
  }

  const key = `${userId}:${cleanSessionId}`;
  const existing = memoryTranscriptStore.get(key) || [];
  const memRows: PlaybackTurn[] = normalized.map((n, idx) => ({
    id: `mem-${cleanSessionId}-${existing.length + idx}`,
    sessionId: cleanSessionId,
    turnIndex: n.turn_index,
    speaker: n.speaker,
    whatYouSaid: n.transcript_text,
    idealAnswer: n.ideal_answer,
    turnScore: n.turn_score,
    feedbackNotes: n.feedback_notes,
    timestampMs: n.timestamp_ms,
    audioUrl: n.audio_url,
    audioConsent: n.audio_consent,
    createdAt: new Date().toISOString(),
  }));
  memoryTranscriptStore.set(key, [...existing, ...memRows]);
  return { saved: memRows, storage: 'memory' };
}

export async function getInterviewPlayback(
  userId: string,
  sessionId: string
): Promise<{
  sessionId: string;
  turns: PlaybackTurn[];
  totalDurationMs: number;
  averageTurnScore: number | null;
  hasAudio: boolean;
}> {
  const cleanSessionId = String(sessionId || '').trim();
  let turns: PlaybackTurn[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('interview_transcripts')
      .select('*')
      .eq('session_id', cleanSessionId)
      .eq('user_id', userId)
      .order('turn_index', { ascending: true })
      .order('timestamp_ms', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      turns = data.map((row: any) => ({
        id: row.id,
        sessionId: row.session_id,
        turnIndex: row.turn_index,
        speaker: row.speaker,
        whatYouSaid: row.transcript_text,
        idealAnswer: row.ideal_answer || '',
        turnScore: row.turn_score !== null ? Number(row.turn_score) : null,
        feedbackNotes: row.feedback_notes || '',
        timestampMs: row.timestamp_ms || 0,
        audioUrl: row.audio_url || null,
        audioConsent: Boolean(row.audio_consent),
        createdAt: row.created_at,
      }));
    }
  } catch (err: any) {
    logger.warn('Error querying interview_transcripts', { sessionId: cleanSessionId, error: err.message });
  }

  if (turns.length === 0) {
    const key = `${userId}:${cleanSessionId}`;
    turns = memoryTranscriptStore.get(key) || [];
  }

  // Fallback: reconstruct from mock_interviews.questions / responses if no rows in interview_transcripts
  if (turns.length === 0) {
    try {
      const { data: interview } = await supabaseAdmin
        .from('mock_interviews')
        .select('id, questions, responses, duration, started_at, completed_at')
        .eq('id', cleanSessionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (interview) {
        const questions = Array.isArray(interview.questions) ? interview.questions : [];
        const responses = Array.isArray(interview.responses) ? interview.responses : [];
        const maxLen = Math.max(questions.length, responses.length);
        const createdAt = interview.completed_at || interview.started_at || new Date().toISOString();
        let turnIdx = 0;

        for (let i = 0; i < maxLen; i += 1) {
          const q = questions[i];
          if (q !== undefined && q !== null) {
            const qText = typeof q === 'string' ? q : String(q.question || q.text || q.content || '');
            if (qText) {
              turns.push({
                id: `${cleanSessionId}-turn-${turnIdx}`,
                sessionId: cleanSessionId,
                turnIndex: turnIdx,
                speaker: 'interviewer',
                whatYouSaid: qText,
                idealAnswer: '',
                turnScore: null,
                feedbackNotes: '',
                timestampMs: turnIdx * 20000,
                audioUrl: null,
                audioConsent: false,
                createdAt,
              });
              turnIdx += 1;
            }
          }

          const r = responses[i];
          if (r !== undefined && r !== null) {
            const rText = typeof r === 'string' ? r : String(r.content || r.text || r.answer || '');
            const rScore = typeof r === 'object' && r !== null && r.score !== undefined ? Number(r.score) : null;
            if (rText) {
              turns.push({
                id: `${cleanSessionId}-turn-${turnIdx}`,
                sessionId: cleanSessionId,
                turnIndex: turnIdx,
                speaker: 'candidate',
                whatYouSaid: rText,
                idealAnswer: typeof r === 'object' && r !== null ? String(r.idealAnswer || '') : '',
                turnScore: rScore !== null && Number.isFinite(rScore) ? rScore : null,
                feedbackNotes: typeof r === 'object' && r !== null ? String(r.feedback || '') : '',
                timestampMs: turnIdx * 20000,
                audioUrl: null,
                audioConsent: false,
                createdAt,
              });
              turnIdx += 1;
            }
          }
        }
      }
    } catch {
      // Ignore if mock_interviews lookup fails
    }
  }

  const scoredTurns = turns.filter((t) => typeof t.turnScore === 'number');
  const averageTurnScore =
    scoredTurns.length > 0
      ? Number((scoredTurns.reduce((sum, t) => sum + (t.turnScore || 0), 0) / scoredTurns.length).toFixed(1))
      : null;

  const totalDurationMs = turns.reduce((max, t) => Math.max(max, t.timestampMs || 0), 0);
  const hasAudio = turns.some((t) => Boolean(t.audioUrl && t.audioConsent));

  return {
    sessionId: cleanSessionId,
    turns,
    totalDurationMs,
    averageTurnScore,
    hasAudio,
  };
}
