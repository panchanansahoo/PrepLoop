import { useEffect, useState } from 'react';
import { Award, Clock, Share2, Trophy } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { API_URL } from '../config/api.js';

export default function WeeklyContestPanel() {
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadContest() {
      try {
        const url = buildApiUrl('/contests/weekly', { rawBaseUrl: API_URL, apiPrefix: '/api' });
        const res = await authFetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setContest(data.contest || null);
          setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
        }
      } catch {
        // Ignore
      }
    }
    loadContest();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!contest) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = buildApiUrl(`/contests/weekly/${encodeURIComponent(contest.id)}/submit`, {
        rawBaseUrl: API_URL,
        apiPrefix: '/api',
      });
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, timeTakenSeconds: 1200 }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        const lbUrl = buildApiUrl(`/contests/weekly/${encodeURIComponent(contest.id)}/leaderboard`, {
          rawBaseUrl: API_URL,
          apiPrefix: '/api',
        });
        const lbRes = await authFetch(lbUrl);
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setLeaderboard(Array.isArray(lbData.leaderboard) ? lbData.leaderboard : []);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            {contest.title}
          </h2>
          <p className="text-xs text-slate-400">{contest.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-300">
          <Clock className="w-3.5 h-3.5" />
          {contest.durationMinutes} min · Top 3: {contest.prizes?.top3}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(contest.problems || []).map((p) => (
            <div key={p.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-100">{p.title}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 capitalize">
                  {p.difficulty} ({p.points})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{p.prompt}</p>
              <textarea
                rows={3}
                value={answers[p.id] ?? p.starterCode}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [p.id]: e.target.value }))}
                className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-200"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
          >
            {submitting ? 'Submitting Contest...' : 'Submit Weekly Contest'}
          </button>
          {result && (
            <div className="flex items-center gap-3 text-xs text-emerald-300">
              <span>
                Rank #{result.rank}/{result.totalParticipants} · Score {result.score}/600
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(result.shareCard?.text || '').catch(() => {});
                  setCopiedShare(true);
                  setTimeout(() => setCopiedShare(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedShare ? 'Copied Share Card!' : 'Share Rank'}
              </button>
            </div>
          )}
        </div>
      </form>

      {leaderboard.length > 0 && (
        <div className="pt-3 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Global Contest Leaderboard (Top {Math.min(5, leaderboard.length)})
          </div>
          <div className="space-y-1">
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <div
                key={entry.userId + idx}
                className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-200"
              >
                <span>
                  #{idx + 1} {entry.username} {idx < 3 ? '🏆' : ''}
                </span>
                <span>
                  {entry.score} pts · {Math.round((entry.timeTakenSeconds || 0) / 60)}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
