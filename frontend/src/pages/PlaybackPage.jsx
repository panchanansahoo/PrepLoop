import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageSquare,
  Pause,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { API_URL } from '../config/api.js';
import { DEMO_INTERVIEW_SESSION } from './InterviewHistory';

function formatTimestamp(ms = 0) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PlaybackPage() {
  const { sessionId } = useParams();
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPlayback() {
      setLoading(true);
      setError('');
      setActiveIndex(0);
      setIsPlaying(false);
      try {
        if (sessionId === DEMO_INTERVIEW_SESSION.id) {
          const demoTurns = DEMO_INTERVIEW_SESSION.conversation.map((m, idx) => ({
            id: `demo-${idx}`,
            turnIndex: idx,
            speaker: m.role === 'interviewer' ? 'interviewer' : m.role === 'feedback' ? 'system' : 'candidate',
            whatYouSaid: m.content,
            idealAnswer:
              m.role === 'candidate'
                ? 'Structure with clear requirements, trade-offs, capacity math, and failure modes.'
                : '',
            turnScore: typeof m.score === 'number' ? m.score : null,
            feedbackNotes: Array.isArray(m.improvements) ? m.improvements.join('; ') : '',
            timestampMs: idx * 25000,
            audioUrl: null,
            audioConsent: false,
          }));
          if (!cancelled) setTurns(demoTurns);
          return;
        }

        const url = buildApiUrl(`/interview/${encodeURIComponent(sessionId)}/playback`, {
          rawBaseUrl: API_URL,
          apiPrefix: '/api',
        });
        const res = await authFetch(url);
        if (!res.ok) throw new Error('Could not load interview playback');
        const data = await res.json();
        if (!cancelled) {
          setTurns(Array.isArray(data?.turns) ? data.turns : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load playback');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPlayback();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!isPlaying || turns.length === 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= turns.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [isPlaying, turns.length]);

  const activeTurn = turns[activeIndex] || null;

  const averageScore = useMemo(() => {
    const scored = turns.filter((t) => typeof t.turnScore === 'number');
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((s, t) => s + t.turnScore, 0) / scored.length);
  }, [turns]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/interview-history"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-sm text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Interview Transcript Playback</h1>
            <p className="text-xs text-slate-400">Session ID: {sessionId}</p>
          </div>
        </div>
        {averageScore !== null && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
            Avg Turn Score: {averageScore}/100
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 rounded-2xl bg-slate-900/70 border border-slate-800 text-center text-slate-400">
          Loading transcript timeline...
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">{error}</div>
      ) : turns.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/70 border border-slate-800 text-center text-slate-400">
          No transcript turns recorded for this session yet.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline Scrubber */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between gap-4 mb-3">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause Playback' : 'Auto-Play Timeline'}
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-4 h-4" />
                Turn {activeIndex + 1} of {turns.length} ({formatTimestamp(activeTurn?.timestampMs)})
              </div>
            </div>

            <input
              type="range"
              aria-label="Transcript timeline scrubber"
              min={0}
              max={Math.max(0, turns.length - 1)}
              value={activeIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setActiveIndex(Number(e.target.value));
              }}
              className="w-full accent-indigo-500 cursor-pointer"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {turns.map((turn, idx) => (
                <button
                  key={turn.id || idx}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveIndex(idx);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition ${
                    idx === activeIndex
                      ? 'bg-indigo-600/30 border-indigo-400 text-white'
                      : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  #{idx + 1} {turn.speaker}
                  {typeof turn.turnScore === 'number' ? ` · ${turn.turnScore}` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-side comparison */}
          {activeTurn && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
                    <MessageSquare className="w-4 h-4" />
                    What You Said ({activeTurn.speaker})
                  </span>
                  {typeof activeTurn.turnScore === 'number' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                      Score: {activeTurn.turnScore}/100
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                  {activeTurn.whatYouSaid || 'No transcript text captured.'}
                </p>
                {activeTurn.audioUrl && activeTurn.audioConsent && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      Recorded Audio
                    </div>
                    <audio controls src={activeTurn.audioUrl} className="w-full h-9" />
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                  Ideal Answer & Coaching Notes
                </div>
                <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                  {activeTurn.idealAnswer ||
                    'Focus on structured framing (context -> approach -> trade-offs -> measurable outcome).'}
                </p>
                {activeTurn.feedbackNotes && (
                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{activeTurn.feedbackNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
