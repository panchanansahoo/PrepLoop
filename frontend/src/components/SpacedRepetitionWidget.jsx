import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';

const QUALITY_OPTIONS = [
  { label: 'Again', quality: 1, tone: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25' },
  { label: 'Hard', quality: 3, tone: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' },
  { label: 'Good', quality: 4, tone: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' },
  { label: 'Easy', quality: 5, tone: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25' },
];

export default function SpacedRepetitionWidget() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dueProblems, setDueProblems] = useState([]);
  const [totalTracked, setTotalTracked] = useState(0);
  const [submittingId, setSubmittingId] = useState(null);

  const loadDueReviews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await authFetch(buildApiUrl('/api/spaced-repetition/due?limit=6'));
      if (res.ok) {
        const data = await res.json();
        setDueProblems(Array.isArray(data.dueProblems) ? data.dueProblems : []);
        setTotalTracked(Number(data.totalTracked || 0));
      }
    } catch {
      // Non-critical widget; fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueReviews();
  }, [user?.id]);

  const handleRate = async (problem, quality) => {
    setSubmittingId(problem.problem_id);
    try {
      const res = await authFetch(buildApiUrl('/api/spaced-repetition/review'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.problem_id,
          problemTitle: problem.problem_title || problem.problem_id,
          quality,
        }),
      });
      if (res.ok) {
        setDueProblems((prev) => prev.filter((item) => item.problem_id !== problem.problem_id));
      }
    } catch {
      // Ignore transient network failures
    } finally {
      setSubmittingId(null);
    }
  };

  if (!user) return null;

  return (
    <section
      aria-label="Spaced Repetition Review Queue"
      className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Spaced Repetition Queue
              <span className="inline-flex items-center rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
                {dueProblems.length} Due for Review
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              SM-2 memory scheduling · {totalTracked} problems tracked
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadDueReviews}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {dueProblems.length === 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            All caught up! Solve problems in DSA Explorer to build your review queue.
          </span>
          <Link to="/problems" className="text-purple-400 hover:text-purple-300 font-medium">
            Explore Problems →
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dueProblems.map((item) => (
            <div
              key={item.problem_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <Link
                  to={`/dsa-editor/${item.problem_id}`}
                  className="text-sm font-medium text-slate-100 hover:text-purple-300 truncate block"
                >
                  {item.problem_title || item.problem_id}
                </Link>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock size={11} />
                  Interval: {item.interval_days || 1}d · EF: {Number(item.ease_factor || 2.5).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={submittingId === item.problem_id}
                    onClick={() => handleRate(item, opt.quality)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${opt.tone}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
