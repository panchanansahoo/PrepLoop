import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreateJobApplicationSchema } from '@preploop/contracts/jobs';
import { Briefcase, Building2, ExternalLink, Plus, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';

const COLUMNS = [
  { id: 'bookmarked', label: 'Bookmarked', accent: 'border-slate-600' },
  { id: 'applied', label: 'Applied', accent: 'border-blue-500/60' },
  { id: 'phone_screen', label: 'Phone Screen', accent: 'border-cyan-500/60' },
  { id: 'technical', label: 'Technical', accent: 'border-purple-500/60' },
  { id: 'onsite', label: 'Onsite', accent: 'border-amber-500/60' },
  { id: 'offer', label: 'Offer', accent: 'border-emerald-500/60' },
  { id: 'rejected', label: 'Rejected', accent: 'border-rose-500/60' },
];

export default function JobTracker() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    company: '',
    role: '',
    status: 'bookmarked',
    location: '',
    salaryRange: '',
    jobUrl: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadApplications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(buildApiUrl('/api/job-applications'));
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data.applications) ? data.applications : []);
      }
    } catch {
      setError('Unable to load job applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.id, []]));
    for (const app of applications) {
      const key = map[app.status] ? app.status : 'bookmarked';
      map[key].push(app);
    }
    return map;
  }, [applications]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    const parsed = CreateJobApplicationSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues?.[0]?.message || 'Please check the application fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(buildApiUrl('/api/job-applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save application');
      }
      setApplications((prev) => [data.application, ...prev]);
      setForm({ company: '', role: '', status: 'bookmarked', location: '', salaryRange: '', jobUrl: '', notes: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Could not create job application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    const prev = applications;
    setApplications((curr) => curr.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    try {
      const res = await authFetch(buildApiUrl(`/api/job-applications/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        setApplications(prev);
      }
    } catch {
      setApplications(prev);
    }
  };

  const handleDelete = async (id) => {
    const prev = applications;
    setApplications((curr) => curr.filter((item) => item.id !== id));
    try {
      const res = await authFetch(buildApiUrl(`/api/job-applications/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        setApplications(prev);
      }
    } catch {
      setApplications(prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Briefcase className="text-indigo-400" size={24} />
              Job Application Tracker
            </h1>
            <p className="text-sm text-slate-400">
              Track every application from bookmark to offer and jump straight to company prep.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/copilot"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              <Sparkles size={15} className="text-purple-400" />
              AI Job Copilot
            </Link>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              <Plus size={16} />
              Add Application
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Company *"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                required
                placeholder="Role *"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Location (e.g. Bengaluru / Remote)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                placeholder="Salary Range"
                value={form.salaryRange}
                onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
              <input
                type="url"
                placeholder="Job URL (https://...)"
                value={form.jobUrl}
                onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Notes, referral contact, or key interview focus..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-700 px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {submitting ? 'Saving...' : 'Save Card'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-sm text-slate-400 py-10 text-center">Loading your Kanban board...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-start">
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                className={`rounded-2xl border-t-2 ${col.accent} border border-slate-800 bg-slate-900/60 p-3 min-h-[260px]`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">{col.label}</h2>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                    {grouped[col.id].length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {grouped[col.id].map((card) => (
                    <article
                      key={card.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 space-y-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">{card.role}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                            <Building2 size={12} /> {card.company}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(card.id)}
                          aria-label={`Delete ${card.company} ${card.role}`}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {card.notes && <p className="text-xs text-slate-400 line-clamp-2">{card.notes}</p>}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <select
                          aria-label={`Move ${card.company} status`}
                          value={card.status}
                          onChange={(e) => handleStatusChange(card.id, e.target.value)}
                          className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300"
                        >
                          {COLUMNS.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          {card.jobUrl && (
                            <a
                              href={card.jobUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-white"
                              aria-label="Open job posting"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <Link
                            to="/company-prep"
                            className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                          >
                            Prep →
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
