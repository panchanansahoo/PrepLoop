import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResumeGapAnalysisRequestSchema } from '@preploop/contracts/jobs';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Target, X } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';

export default function ResumeGapAnalyzerModal({
  isOpen,
  onClose,
  initialJobTitle = '',
  initialCompany = '',
  initialJobDescription = '',
  initialResumeText = '',
}) {
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [company, setCompany] = useState(initialCompany);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    const parsed = ResumeGapAnalysisRequestSchema.safeParse({
      resumeText,
      jobDescription,
      jobTitle: jobTitle || undefined,
      company: company || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues?.[0]?.message || 'Please provide valid resume and job description text.');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(buildApiUrl('/api/resume/gap-analysis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to analyze resume fit');
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to analyze resume fit right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close resume gap analysis"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-400">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Resume ↔ Job Description Fit Analysis</h2>
            <p className="text-xs text-slate-400">Identify missing skills, talking points, and tailored interview questions.</p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Target Role (e.g. Backend Engineer)"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (e.g. Stripe)"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Job Description</label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description or required skills..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Your Resume Text</label>
            <textarea
              rows={4}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume summary, experience, and skills..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {loading ? 'Analyzing Fit...' : 'Analyze My Resume Fit'}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-6 space-y-4 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Overall Fit Score</p>
                <p className="text-3xl font-bold text-white">{result.matchScore}%</p>
              </div>
              <div className="w-48 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                  style={{ width: `${Math.min(100, Math.max(0, result.matchScore))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Matched Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(result.matchedSkills || []).length > 0 ? (
                    result.matchedSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No direct keyword matches detected.</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Missing / Gap Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(result.missingSkills || []).length > 0 ? (
                    result.missingSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-300">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Great coverage! No major skill gaps found.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                Suggested Talking Points
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                {(result.talkingPoints || []).map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Tailored Practice Questions
                </h3>
                <Link to="/ai-interview" className="text-xs font-medium text-purple-400 hover:text-purple-300">
                  Practice in AI Interview →
                </Link>
              </div>
              <ul className="list-decimal pl-5 space-y-1 text-xs text-slate-300">
                {(result.practiceQuestions || []).map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
