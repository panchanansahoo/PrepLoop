import { useMemo, useState } from 'react';
import { BarChart3, Clock, Sparkles } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { API_URL } from '../config/api.js';

const TRACKS = ['All', 'SWE', 'PM', 'Data', 'Design'];

function inferTrack(q) {
  const hay = `${q?.role || ''} ${q?.category || ''} ${q?.stage || ''} ${q?.question || ''}`.toLowerCase();
  if (/(product manager|product sense|\bpm\b|roadmap|metrics)/.test(hay)) return 'PM';
  if (/(data scientist|data engineer|ml|sql|analytics)/.test(hay)) return 'Data';
  if (/(system design|architecture|ux|ui|scalability)/.test(hay)) return 'Design';
  return 'SWE';
}

export default function CompanyIntelligencePanel({
  questions = [],
  selectedCompany = '',
  selectedTrack = 'All',
  onSelectTrack,
}) {
  const [sampleQuestion, setSampleQuestion] = useState('');
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [followUps, setFollowUps] = useState([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [followUpError, setFollowUpError] = useState('');

  const safeQuestions = Array.isArray(questions) ? questions : [];

  const stats = useMemo(() => {
    const tracks = { SWE: 0, PM: 0, Data: 0, Design: 0 };
    const diff = { easy: 0, medium: 0, hard: 0 };
    let seenRecently = 0;

    for (const q of safeQuestions) {
      const t = inferTrack(q);
      tracks[t] = (tracks[t] || 0) + 1;

      const d = String(q?.difficulty || 'medium').toLowerCase();
      if (d === 'easy') diff.easy += 1;
      else if (d === 'hard') diff.hard += 1;
      else diff.medium += 1;

      if (q?.seenRecently || (typeof q?.recencyDays === 'number' && q.recencyDays <= 90)) {
        seenRecently += 1;
      }
    }

    const total = safeQuestions.length || 1;
    return {
      tracks,
      seenRecently,
      diff: {
        easyPct: Math.round((diff.easy / total) * 100),
        medPct: Math.round((diff.medium / total) * 100),
        hardPct: Math.round((diff.hard / total) * 100),
        ...diff,
      },
    };
  }, [safeQuestions]);

  async function handleGenerateFollowUps(e) {
    e.preventDefault();
    if (!sampleQuestion.trim() || !candidateAnswer.trim()) return;
    setLoadingFollowUps(true);
    setFollowUpError('');
    try {
      const url = buildApiUrl('/company-interview/follow-ups', {
        rawBaseUrl: API_URL,
        apiPrefix: '/api',
      });
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: sampleQuestion,
          answer: candidateAnswer,
          company: selectedCompany || 'Top Tech',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to generate follow-up questions');
      }
      setFollowUps(Array.isArray(data?.followUps) ? data.followUps : []);
    } catch (err) {
      setFollowUps([]);
      setFollowUpError(err.message || 'Unable to generate follow-up questions');
    } finally {
      setLoadingFollowUps(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Company Interview Intelligence
          {selectedCompany ? ` · ${selectedCompany}` : ''}
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <Clock className="w-3.5 h-3.5" />
          {stats.seenRecently} Seen recently (90d)
        </span>
      </div>

      {/* Role-specific tracks */}
      <div className="flex flex-wrap items-center gap-2">
        {TRACKS.map((track) => (
          <button
            key={track}
            type="button"
            onClick={() => onSelectTrack?.(track)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              selectedTrack === track
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            {track}
            {track !== 'All' ? ` (${stats.tracks[track] || 0})` : ` (${safeQuestions.length})`}
          </button>
        ))}
      </div>

      {/* Difficulty distribution chart */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Easy {stats.diff.easyPct}% ({stats.diff.easy})</span>
          <span>Medium {stats.diff.medPct}% ({stats.diff.medium})</span>
          <span>Hard {stats.diff.hardPct}% ({stats.diff.hard})</span>
        </div>
        <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-800">
          <div style={{ width: `${stats.diff.easyPct}%` }} className="bg-emerald-500" />
          <div style={{ width: `${stats.diff.medPct}%` }} className="bg-amber-500" />
          <div style={{ width: `${stats.diff.hardPct}%` }} className="bg-rose-500" />
        </div>
      </div>

      {/* AI Follow-up Generator */}
      <form onSubmit={handleGenerateFollowUps} className="pt-2 border-t border-slate-800 space-y-2">
        <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Practice Follow-Up Generator (3 AI Follow-Ups)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            value={sampleQuestion}
            onChange={(e) => setSampleQuestion(e.target.value)}
            placeholder="Paste a company question..."
            className="px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-xs text-slate-100"
          />
          <input
            type="text"
            value={candidateAnswer}
            onChange={(e) => setCandidateAnswer(e.target.value)}
            placeholder="Your short answer..."
            className="px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-xs text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={loadingFollowUps || !sampleQuestion.trim() || !candidateAnswer.trim()}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white"
        >
          {loadingFollowUps ? 'Generating...' : 'Generate 3 Follow-Up Questions'}
        </button>
        {followUpError && (
          <p className="text-xs text-rose-300">{followUpError}</p>
        )}
        {followUps.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-slate-200 list-disc pl-5">
            {followUps.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}
