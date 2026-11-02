import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Circle,
  TrendingUp,
  AlertCircle,
  Calendar,
  Award,
  ChevronRight,
  Code2,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Target,
  Layers,
  Zap,
} from 'lucide-react';

export default function CareerRoadmapPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [completedMilestones, setCompletedMilestones] = useState(() => {
    try {
      const saved = localStorage.getItem('preploop_roadmap_completed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [targetRole, setTargetRole] = useState('Full Stack Engineer');
  const [targetCompany, setTargetCompany] = useState('Google');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchRoadmap = async (role = targetRole, company = targetCompany) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.post('/api/career/roadmap', {
        targetRole: role,
        targetCompany: company,
      });
      if (res.data?.success && res.data?.roadmap) {
        setRoadmap(res.data.roadmap);
      } else {
        throw new Error(res.data?.error || 'Failed to load roadmap');
      }
    } catch (err) {
      console.warn('Roadmap API fallback to default mock', err);
      // Fallback structured roadmap if API is offline
      setRoadmap({
        targetRole: role,
        targetCompany: company,
        readinessScore: 68,
        domainScores: {
          dsa: 75,
          systemDesign: 60,
          behavioral: 80,
          domainKnowledge: 65,
        },
        diagnostics: {
          primaryGaps: [
            'System Design scaling under high-throughput concurrency',
            'Graph traversal and Dynamic Programming optimization patterns',
            'STAR framework structure in situational leadership questions',
          ],
          strengths: [
            'Clean code modularization and idiomatic JavaScript/TypeScript',
            'Strong foundation in RESTful API design',
          ],
        },
        weeks: [
          {
            weekNumber: 1,
            title: 'Week 1: Foundations & DSA Patterns',
            description: 'Master Sliding Window, Two Pointers, and Fast/Slow Pointers algorithms.',
            milestones: [
              { id: 'w1_m1', title: 'Complete Top 15 Sliding Window problems', tag: 'DSA', link: '/problems' },
              { id: 'w1_m2', title: 'Review Big-O Space/Time complexity trade-offs', tag: 'Theory', link: '/roadmap/language' },
              { id: 'w1_m3', title: 'Complete 1 Technical Mock Interview Round', tag: 'Mock', link: '/ai-interview' },
            ],
          },
          {
            weekNumber: 2,
            title: 'Week 2: System Design & Data Pipelines',
            description: 'Database partitioning, Redis caching layers, and microservices resilience.',
            milestones: [
              { id: 'w2_m1', title: 'Design a Distributed Rate Limiter & Cache', tag: 'System Design', link: '/roadmap/system-design' },
              { id: 'w2_m2', title: 'Explore CAP Theorem and Consistency Models', tag: 'Architecture', link: '/roadmap/system-design' },
              { id: 'w2_m3', title: '1-on-1 Peer Interview practice session', tag: 'Peer', link: '/peer-interview' },
            ],
          },
          {
            weekNumber: 3,
            title: 'Week 3: Behavioral Leadership & STAR Mastery',
            description: 'Craft high-impact behavioral stories aligned with company cultural principles.',
            milestones: [
              { id: 'w3_m1', title: 'Draft 5 STAR stories (Conflict, Failure, Ambiguity, Delivery)', tag: 'Behavioral', link: '/ai-interview' },
              { id: 'w3_m2', title: 'Complete Company-Specific HR Simulation', tag: 'HR Round', link: '/ai-interview' },
            ],
          },
          {
            weekNumber: 4,
            title: 'Week 4: Mock Blitz & Final Calibration',
            description: 'Full-length timed interviews, code execution polish, and stress-test rounds.',
            milestones: [
              { id: 'w4_m1', title: 'Full 45-minute timed DSA coding interview', tag: 'Live Sim', link: '/ai-interview' },
              { id: 'w4_m2', title: 'Participate in Daily Community Challenge', tag: 'Challenge', link: '/daily-challenges' },
              { id: 'w4_m3', title: 'Final Readiness Audit review', tag: 'Milestone', link: '/dashboard' },
            ],
          },
        ],
      });
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const toggleMilestone = (id) => {
    setCompletedMilestones((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('preploop_roadmap_completed', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const allMilestoneIds = roadmap?.weeks?.flatMap((w) => w.milestones.map((m) => m.id)) || [];
  const completedCount = allMilestoneIds.filter((id) => completedMilestones[id]).length;
  const progressPercent = allMilestoneIds.length > 0 ? Math.round((completedCount / allMilestoneIds.length) * 100) : 0;

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0a] text-slate-100'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 text-indigo-400 font-semibold text-sm mb-1">
              <Compass size={18} className="animate-spin-slow" />
              <span>AI CAREER COPILOT</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Personalized Career Roadmap</h1>
            <p className="text-sm text-slate-400 mt-1">
              Dynamic milestone path calibrated by AI from your past interview performance & target role.
            </p>
          </div>

          {/* Quick Filter Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target Role"
              className={`px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                isLight ? 'bg-white border-slate-300' : 'bg-zinc-900 border-zinc-700 text-white'
              }`}
            />
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="Target Company"
              className={`px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                isLight ? 'bg-white border-slate-300' : 'bg-zinc-900 border-zinc-700 text-white'
              }`}
            />
            <button
              onClick={() => {
                setIsRegenerating(true);
                fetchRoadmap(targetRole, targetCompany);
              }}
              disabled={loading || isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
              <span>Recalibrate</span>
            </button>
          </div>
        </div>

        {/* Readiness Score & Diagnostics Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Readiness Gauge Card */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target size={14} className="text-indigo-400" /> Interview Readiness
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Target: {roadmap?.targetCompany || 'Tier 1'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  {roadmap?.readinessScore || 72}%
                </span>
                <span className="text-xs text-slate-400">Readiness Index</span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Based on historical technical accuracy, pacing, communication clarity, and problem decomposition.
              </p>
            </div>

            {/* Overall Milestones Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span>Milestone Completion</span>
                <span className="text-indigo-400">{completedCount} / {allMilestoneIds.length} ({progressPercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Skill Domain Readiness Breakdown */}
          <div className={`p-6 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Layers size={14} className="text-purple-400" /> Skill Competencies
            </h3>
            <div className="space-y-3.5">
              {[
                { name: 'Data Structures & Algorithms', score: roadmap?.domainScores?.dsa || 75, color: 'from-blue-500 to-indigo-500' },
                { name: 'System Design & Scalability', score: roadmap?.domainScores?.systemDesign || 60, color: 'from-purple-500 to-pink-500' },
                { name: 'Behavioral & Leadership (STAR)', score: roadmap?.domainScores?.behavioral || 80, color: 'from-emerald-500 to-teal-500' },
                { name: 'Domain & Engineering Stack', score: roadmap?.domainScores?.domainKnowledge || 65, color: 'from-amber-500 to-orange-500' },
              ].map((domain) => (
                <div key={domain.name}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>{domain.name}</span>
                    <span className="font-bold">{domain.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${domain.color}`}
                      style={{ width: `${domain.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Performance Diagnostics & Gaps */}
          <div className={`p-6 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-400" /> Focus Gaps & Recommendations
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              {(roadmap?.diagnostics?.primaryGaps || [
                'System Design scaling under high concurrency',
                'Graph traversal and Dynamic Programming optimization',
                'STAR framework structure in situational leadership',
              ]).map((gap, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  <span className="font-bold text-amber-400">#{idx + 1}</span>
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Week Milestone Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Calendar size={20} className="text-indigo-400" /> 4-Week Preparation Pathway
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => navigate('/roadmap/system-design')}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium transition"
              >
                System Design Tree
              </button>
              <button
                onClick={() => navigate('/roadmap/language')}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium transition"
              >
                Language Tree
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(roadmap?.weeks || []).map((week) => (
              <div
                key={week.weekNumber}
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:shadow-md'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                      WEEK {week.weekNumber}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-slate-400">
                      {week.milestones.filter((m) => completedMilestones[m.id]).length} / {week.milestones.length} Done
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{week.title}</h3>
                  <p className="text-xs text-slate-400 mb-4">{week.description}</p>

                  {/* Milestones list */}
                  <div className="space-y-2.5">
                    {week.milestones.map((m) => {
                      const isDone = !!completedMilestones[m.id];
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                            isDone
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-300'
                              : isLight
                              ? 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                              : 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600'
                          }`}
                        >
                          <div
                            onClick={() => toggleMilestone(m.id)}
                            className="flex items-center gap-2.5 cursor-pointer flex-1 mr-2"
                          >
                            {isDone ? (
                              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Circle size={18} className="text-slate-500 flex-shrink-0 hover:text-indigo-400" />
                            )}
                            <span className={`text-xs font-medium ${isDone ? 'line-through text-slate-400' : ''}`}>
                              {m.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {m.tag && (
                              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-slate-400">
                                {m.tag}
                              </span>
                            )}
                            {m.link && (
                              <button
                                onClick={() => navigate(m.link)}
                                className="p-1 rounded hover:bg-zinc-700/50 text-indigo-400 hover:text-indigo-300 transition"
                                title="Go to module"
                              >
                                <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => navigate('/ai-interview')}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
                  >
                    <Zap size={13} />
                    <span>Launch AI Calibration Round</span>
                  </button>
                  <button
                    onClick={() => navigate('/peer-interview')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                  >
                    <span>Peer Practice</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

