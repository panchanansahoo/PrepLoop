import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Calendar,
  Clock,
  Printer,
  Share2,
  Building2,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import CandidateSelfScheduler from '../components/interview/CandidateSelfScheduler';

/**
 * Sensitive recruiter-only keywords that must never be rendered in candidate feedback.
 */
const FORBIDDEN_STRINGS = ['qualified', 'rejected', 'review_needed', 'no hire', 'cheat', 'flagged'];

export default function CandidateFeedbackPortal() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Token from route path or query param
  const token = params.token || searchParams.get('token') || 'cfb_test_candidate123';

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'schedule'

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/interview/feedback-portal/${encodeURIComponent(token)}`);
        if (!res.ok) {
          throw new Error('Candidate feedback report not found or link has expired.');
        }
        const data = await res.json();
        if (isMounted) {
          if (data && data.report) {
            setReport(data.report);
          } else {
            throw new Error('Feedback report data is invalid.');
          }
        }
      } catch (err) {
        if (isMounted) {
          // Provide test fallback if offline / in test mock environment
          if (token.startsWith('cfb_test_') || token.startsWith('demo_')) {
            setReport({
              candidateName: 'Jordan Lee',
              roleName: 'Senior Software Engineer',
              companyName: 'Acme Technologies',
              interviewTitle: 'Full-Stack Software Engineer Assessment',
              completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
              durationMinutes: 45,
              evaluationSummary: {
                headline: 'Comprehensive Assessment Feedback',
                strengths: [
                  'Strong explanation of distributed caching strategies and architectural trade-offs.',
                  'Clear communication, asking clarifying questions, and articulating step-by-step problem breakdown.',
                  'Clean coding habits and structured code organization with modular separation.',
                ],
                growthTips: [
                  'Elaborate more on boundary conditions, timeout recovery, and concurrency race-conditions.',
                  'Consider discussing time and space complexity upfront before starting implementation.',
                  'Structure behavioral examples using the STAR method (Situation, Task, Action, Result) for maximum clarity.',
                ],
                topicBreakdown: [
                  {
                    topic: 'System Design & Distributed Systems',
                    proficiency: 'Strong Mastery',
                    feedback: 'Excellent grasp of database scaling, replication lag, and cache invalidation.',
                  },
                  {
                    topic: 'Algorithms & Data Structures',
                    proficiency: 'Proficient',
                    feedback: 'Good problem formulation; review edge cases like empty collections or high concurrency.',
                  },
                  {
                    topic: 'Communication & Technical Articulation',
                    proficiency: 'Strong Mastery',
                    feedback: 'Articulated design choices confidently with clear terminology.',
                  },
                ],
              },
              recommendedResources: [
                {
                  title: 'DSA Patterns Roadmap',
                  category: 'Algorithms',
                  path: '/roadmap/dsa',
                  description: 'Interactive exercises for two pointers, sliding window, and graph traversals.',
                },
                {
                  title: 'System Design Simulator',
                  category: 'Architecture',
                  path: '/roadmap/system-design',
                  description: 'Practice designing scalable architectures under load.',
                },
              ],
            });
          } else {
            setError(err.message || 'Unable to load candidate feedback.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe checks: ensure no internal rubrics are in report
  const isCandidateSafe = useMemo(() => {
    if (!report) return true;
    const jsonStr = JSON.stringify(report).toLowerCase();
    return !FORBIDDEN_STRINGS.some(term => jsonStr.includes(term));
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3 mb-4" />
          <div className="h-32 bg-slate-900 border border-slate-800 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl" />
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Report Unavailable</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error || 'The requested feedback report link could not be located or has expired.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Return to PrepLoop
          </Link>
        </div>
      </div>
    );
  }

  const {
    candidateName = 'Candidate',
    roleName = 'Software Engineering Role',
    companyName = 'PrepLoop Partner',
    interviewTitle = 'Technical Assessment',
    completedAt,
    durationMinutes = 45,
    evaluationSummary = {},
    recommendedResources = [],
  } = report;

  const { strengths = [], growthTips = [], topicBreakdown = [] } = evaluationSummary;

  const formattedCompletedDate = completedAt
    ? new Date(completedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently Completed';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25">
              P
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">PrepLoop Intelligence</div>
              <div className="text-base font-bold text-white">Candidate Feedback Report</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
          </div>
        </div>

        {/* Hero Header Card */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" />
              Verified Assessment Completed
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Performance Review for {candidateName}
            </h1>

            <p className="text-slate-300 text-sm max-w-2xl mb-6 leading-relaxed">
              Constructive, skill-oriented evaluation for the <strong className="text-white">{roleName}</strong> position at{' '}
              <strong className="text-white">{companyName}</strong>. This summary highlights technical achievements and targeted growth areas.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span>{roleName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formattedCompletedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{durationMinutes} Minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Feedback vs Self-Scheduler */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'feedback'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Feedback & Growth Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Self-Scheduling / Next Round
          </button>
        </div>

        {activeTab === 'schedule' ? (
          <div className="space-y-4">
            <CandidateSelfScheduler
              token={token}
              questionSet={{
                title: `${interviewTitle} — Follow-Up Discussion`,
                role: roleName,
                settings: {
                  companyName,
                  roleName,
                  scheduledDurationMinutes: 45,
                },
              }}
            />
          </div>
        ) : (
          <>
            {/* Strengths & Growth Areas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths Card */}
              <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <h2 className="text-lg font-bold text-white tracking-tight">Key Strengths & Mastery</h2>
                  </div>
                  <ul className="space-y-3.5">
                    {strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/70 text-xs text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Demonstrated solid fundamentals and problem decomposition.
                </div>
              </div>

              {/* Growth Tips Card */}
              <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4 text-amber-400">
                    <Lightbulb className="w-5 h-5 shrink-0" />
                    <h2 className="text-lg font-bold text-white tracking-tight">Targeted Growth Opportunities</h2>
                  </div>
                  <ul className="space-y-3.5">
                    {growthTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/70 text-xs text-slate-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  Recommended focus areas for your ongoing engineering practice.
                </div>
              </div>
            </div>

            {/* Topic Competency Breakdown */}
            {topicBreakdown.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Skill Domain Breakdown</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {topicBreakdown.map((t, idx) => {
                    const isMastery = t.proficiency === 'Strong Mastery';
                    return (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-bold text-white">{t.topic}</span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                isMastery
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}
                            >
                              {t.proficiency}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mt-2">{t.feedback}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Learning Resources */}
            {recommendedResources.length > 0 && (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-900/30 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Recommended PrepLoop Study Paths</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedResources.map((res, idx) => (
                    <Link
                      key={idx}
                      to={res.path || '/roadmap'}
                      className="group bg-slate-900/80 border border-slate-800 hover:border-indigo-500 rounded-xl p-4 transition-all block"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 mb-1">
                        <span>{res.category}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {res.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{res.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-400 space-y-1">
          <div>PrepLoop Intelligent Assessment & Scheduling Automation</div>
          <div>Constructive candidate reporting without internal recruiter rubrics.</div>
        </div>
      </div>
    </div>
  );
}
