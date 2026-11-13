import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Code2, GitBranch, ShieldAlert, Sparkles } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { API_URL } from '../config/api.js';

export default function RealProjectCodeReviewPanel() {
  const [repoUrl, setRepoUrl] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!repoUrl.trim() && !code.trim()) return;
    setLoading(true);
    setError('');
    setReview(null);
    try {
      const url = buildApiUrl('/portfolio/code-review', {
        rawBaseUrl: API_URL,
        apiPrefix: '/api',
      });
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim() || undefined,
          code: code.trim() || undefined,
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Code review failed');
      setReview(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Code Review for Real Projects
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit a GitHub repository URL or paste code for quality scoring, security scanning, and interview readiness feedback.
          </p>
        </div>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700">
            <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/project"
              className="w-full bg-transparent text-sm text-slate-100 outline-none"
            />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Code language"
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-slate-100"
          >
            <option value="javascript">JavaScript / TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
          </select>
        </div>

        <textarea
          rows={5}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Or paste your project code snippet here..."
          className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-mono text-slate-100 outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={loading || (!repoUrl.trim() && !code.trim())}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white transition"
        >
          <Code2 className="w-4 h-4" />
          {loading ? 'Analyzing Project...' : 'Run AI Project Review'}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}

      {review && (
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400">Target: {review.analyzedTarget}</div>
              <p className="text-sm text-slate-200 mt-1">{review.summary}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
              <div className="text-[11px] text-emerald-300 uppercase font-semibold">Readiness</div>
              <div className="text-xl font-bold text-white">{review.interviewReadinessScore}/100</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {Object.entries(review.codeQuality || {}).map(([metric, val]) => (
              <div key={metric} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="text-xs text-slate-400 capitalize">{metric}</div>
                <div className="text-base font-bold text-slate-100">{val}/100</div>
              </div>
            ))}
          </div>

          {review.securityFindings?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Security Findings ({review.securityFindings.length})
              </div>
              {review.securityFindings.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Line {f.line} [{f.category}]:</strong> {f.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {review.improvements?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Actionable Improvements ({review.improvements.length})
              </div>
              {review.improvements.map((imp, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700 text-xs text-slate-200">
                  <strong>Line {imp.line}:</strong> {imp.issue} — <span className="text-emerald-300">{imp.suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
