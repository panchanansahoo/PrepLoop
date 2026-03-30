import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Target,
  Brain,
  FileText,
  Users,
  Mic,
  Code2,
  History,
  Network,
  Building2,
  Loader2,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MODULES = [
  {
    title: 'Adaptive AI Mock Interview',
    subtitle: 'Dynamic company-aware rounds and pressure control',
    icon: Sparkles,
    path: '/company-interview',
    accent: '#8b5cf6',
  },
  {
    title: 'Feedback and Scoring Rubric',
    subtitle: 'Communication rubric with actionable coaching',
    icon: Target,
    path: '/interview-analytics',
    accent: '#22c55e',
  },
  {
    title: 'Weak Topic Analysis Dashboard',
    subtitle: 'Heatmap-backed weak area prioritization',
    icon: BarChart3,
    path: '/interview-analytics',
    accent: '#3b82f6',
  },
  {
    title: 'Resume Analyzer and ATS Checker',
    subtitle: 'ATS score, keyword gaps, and resume fixes',
    icon: FileText,
    path: '/resume-analyzer',
    accent: '#f59e0b',
  },
  {
    title: 'Resume-Based Project Viva',
    subtitle: 'Generate tailored viva and HR follow-up questions',
    icon: Brain,
    path: '/resume-analyzer',
    accent: '#06b6d4',
  },
  {
    title: 'Company-Wise Interview Roadmap',
    subtitle: 'Round flow and prep checklist by role and company',
    icon: Building2,
    path: '/company-prep',
    accent: '#ef4444',
  },
  {
    title: 'Coding Editor with Test Feedback',
    subtitle: 'Execution, complexity, and solution quality feedback',
    icon: Code2,
    path: '/playground',
    accent: '#a855f7',
  },
  {
    title: 'Behavioral Answer Coach',
    subtitle: 'Rubric-based polish for behavioral responses',
    icon: Mic,
    path: '/hr-path',
    accent: '#14b8a6',
  },
  {
    title: 'Searchable Interview History',
    subtitle: 'Replay, summary, and searchable prior sessions',
    icon: History,
    path: '/interview-history',
    accent: '#eab308',
  },
  {
    title: 'Community and Mentor Support',
    subtitle: 'Peer mock matching and mentor slot booking',
    icon: Users,
    path: '/community',
    accent: '#10b981',
  },
];

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function InterviewSuite() {
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [heatmap, setHeatmap] = useState([]);

  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapForm, setRoadmapForm] = useState({
    company: 'Google',
    role: 'SDE',
    skillLevel: 'intermediate',
  });

  const [rubricInput, setRubricInput] = useState('I usually start by clarifying assumptions, outline trade-offs, and then propose a practical solution.');
  const [rubricLoading, setRubricLoading] = useState(false);
  const [rubricResult, setRubricResult] = useState(null);
  const [rubricError, setRubricError] = useState('');

  const [resumeText, setResumeText] = useState('');
  const [vivaLoading, setVivaLoading] = useState(false);
  const [vivaError, setVivaError] = useState('');
  const [vivaResult, setVivaResult] = useState(null);

  useEffect(() => {
    const loadHeatmap = async () => {
      setLoadingHeatmap(true);
      try {
        const res = await fetch(`${API_URL}/api/interview-suite/weakness/heatmap`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        setHeatmap(Array.isArray(data?.heatmap) ? data.heatmap.slice(0, 5) : []);
      } catch (error) {
        setHeatmap([]);
      } finally {
        setLoadingHeatmap(false);
      }
    };

    loadHeatmap();
  }, []);

  const topWeakness = useMemo(() => (heatmap.length > 0 ? heatmap[0] : null), [heatmap]);

  const generateRoadmap = async () => {
    setRoadmapLoading(true);
    setRoadmapError('');
    setRoadmap(null);
    try {
      const res = await fetch(`${API_URL}/api/interview-suite/company/round-simulation-flow`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          company: roadmapForm.company,
          role: roadmapForm.role,
          skillLevel: roadmapForm.skillLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to generate roadmap');
      }
      setRoadmap(data);
    } catch (error) {
      setRoadmapError(error.message || 'Unable to generate roadmap');
    } finally {
      setRoadmapLoading(false);
    }
  };

  const scoreRubric = async () => {
    if (!rubricInput.trim()) {
      setRubricError('Enter an interview answer first.');
      return;
    }
    setRubricError('');
    setRubricLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/interview-suite/communication/rubric-score`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          answer: rubricInput,
          question: 'Tell me about a time you handled ambiguity.',
          context: {
            company: roadmapForm.company,
            role: roadmapForm.role,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to score answer');
      }
      setRubricResult(data);
    } catch (error) {
      setRubricError(error.message || 'Unable to score answer');
      setRubricResult(null);
    } finally {
      setRubricLoading(false);
    }
  };

  const generateVivaQuestions = async () => {
    if (!resumeText.trim()) {
      setVivaError('Paste resume text or project bullets first.');
      return;
    }
    setVivaError('');
    setVivaLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/interview-suite/resume/question-generator`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          resumeText,
          company: roadmapForm.company,
          role: roadmapForm.role,
          experienceLevel: roadmapForm.skillLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to generate viva questions');
      }
      setVivaResult(data);
    } catch (error) {
      setVivaError(error.message || 'Unable to generate viva questions');
      setVivaResult(null);
    } finally {
      setVivaLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '20px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#fff', fontSize: 28, fontWeight: 800 }}>Interview Suite</h1>
        <p style={{ marginTop: 8, color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
          End-to-end mock preparation workspace across adaptive interviews, rubric scoring, weak-topic analytics, resume viva, coding signals, and mentor support.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.title}
              to={module.path}
              style={{
                textDecoration: 'none',
                borderRadius: 14,
                border: `1px solid ${module.accent}33`,
                background: 'rgba(255,255,255,0.03)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: `${module.accent}22`,
                  color: module.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={16} />
                </div>
                <ArrowRight size={14} color={module.accent} />
              </div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{module.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.4 }}>{module.subtitle}</div>
            </Link>
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 16,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            borderRadius: 16,
            border: '1px solid rgba(59,130,246,0.28)',
            background: 'rgba(255,255,255,0.03)',
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <BarChart3 size={16} color="#60a5fa" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: 14 }}>Weak Topic Snapshot</h3>
            </div>
            {loadingHeatmap ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} className="spinning" style={{ animation: 'spin 1s linear infinite' }} /> Loading weakness heatmap...
              </div>
            ) : heatmap.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                No interview sessions yet. Complete one round to unlock weak-topic analysis.
              </div>
            ) : (
              <div>
                {topWeakness && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(248,113,113,0.12)',
                    border: '1px solid rgba(248,113,113,0.25)',
                    marginBottom: 10,
                    color: '#fecaca',
                    fontSize: 12,
                  }}>
                    Highest priority: <strong>{topWeakness.area.replace(/_/g, ' ')}</strong> (weakness {topWeakness.weakness}%)
                  </div>
                )}
                <div style={{ display: 'grid', gap: 8 }}>
                  {heatmap.map((item) => (
                    <div key={item.area} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 8,
                      alignItems: 'center',
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: 12,
                    }}>
                      <div>{item.area.replace(/_/g, ' ')}</div>
                      <div style={{ color: item.intensity === 'high' ? '#f87171' : item.intensity === 'medium' ? '#fbbf24' : '#6ee7b7', fontWeight: 700 }}>
                        {item.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            borderRadius: 16,
            border: '1px solid rgba(34,197,94,0.28)',
            background: 'rgba(255,255,255,0.03)',
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Building2 size={16} color="#22c55e" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: 14 }}>Company-Wise Roadmap Builder</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 10 }}>
              <input
                value={roadmapForm.company}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, company: e.target.value }))}
                placeholder="Company"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '9px 10px', color: '#fff', fontSize: 12 }}
              />
              <input
                value={roadmapForm.role}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Role"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '9px 10px', color: '#fff', fontSize: 12 }}
              />
              <select
                value={roadmapForm.skillLevel}
                onChange={(e) => setRoadmapForm((prev) => ({ ...prev, skillLevel: e.target.value }))}
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '9px 10px', color: '#fff', fontSize: 12 }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                type="button"
                onClick={generateRoadmap}
                disabled={roadmapLoading}
                style={{ border: 'none', borderRadius: 10, background: '#22c55e', color: '#052e16', padding: '0 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {roadmapLoading ? '...' : 'Build'}
              </button>
            </div>
            {roadmapError && <div style={{ color: '#fca5a5', fontSize: 12 }}>{roadmapError}</div>}
            {roadmap?.roadmap && (
              <div style={{ display: 'grid', gap: 8 }}>
                {roadmap.roadmap.rounds?.slice(0, 4).map((round, idx) => (
                  <div key={`${round.name}-${idx}`} style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10, padding: 10 }}>
                    <div style={{ color: '#dcfce7', fontSize: 12, fontWeight: 700 }}>{round.round}. {round.name}</div>
                    <div style={{ color: 'rgba(220,252,231,0.8)', fontSize: 11, marginTop: 4 }}>{round.objective}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            borderRadius: 16,
            border: '1px solid rgba(168,85,247,0.3)',
            background: 'rgba(255,255,255,0.03)',
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Mic size={16} color="#c084fc" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: 14 }}>Behavioral Answer Coach</h3>
            </div>
            <textarea
              value={rubricInput}
              onChange={(e) => setRubricInput(e.target.value)}
              rows={4}
              placeholder="Paste your answer..."
              style={{ width: '100%', resize: 'vertical', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(15,23,42,0.8)', color: '#fff', fontSize: 12, padding: 10 }}
            />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={scoreRubric} disabled={rubricLoading} style={{ border: 'none', borderRadius: 10, background: '#a855f7', color: '#f5f3ff', padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {rubricLoading ? 'Scoring...' : 'Score Answer'}
              </button>
              <Link to="/interview-history" style={{ color: '#c4b5fd', fontSize: 11, textDecoration: 'none', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <Search size={12} /> Search interview history
              </Link>
            </div>
            {rubricError && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 8 }}>{rubricError}</div>}
            {rubricResult && (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                <div style={{ color: '#ddd6fe', fontSize: 12, fontWeight: 700 }}>
                  Overall: {rubricResult.evaluation?.overall ?? rubricResult.overall ?? 0}/100
                </div>
                {Array.isArray(rubricResult.evaluation?.improvements || rubricResult.improvements) && (
                  <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11 }}>
                    {(rubricResult.evaluation?.improvements || rubricResult.improvements).slice(0, 2).map((tip, idx) => (
                      <div key={idx}>• {tip}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{
            borderRadius: 16,
            border: '1px solid rgba(14,165,233,0.3)',
            background: 'rgba(255,255,255,0.03)',
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileText size={16} color="#38bdf8" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: 14 }}>Resume Viva Question Generator</h3>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={5}
              placeholder="Paste resume summary, projects, skills..."
              style={{ width: '100%', resize: 'vertical', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(15,23,42,0.8)', color: '#fff', fontSize: 12, padding: 10 }}
            />
            <div style={{ marginTop: 8 }}>
              <button type="button" onClick={generateVivaQuestions} disabled={vivaLoading} style={{ border: 'none', borderRadius: 10, background: '#0ea5e9', color: '#082f49', padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {vivaLoading ? 'Generating...' : 'Generate Questions'}
              </button>
            </div>
            {vivaError && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 8 }}>{vivaError}</div>}
            {vivaResult && (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bae6fd', fontSize: 12, fontWeight: 700 }}>
                  <CheckCircle2 size={13} /> Generated question sets
                </div>
                {[
                  { label: 'Project', key: 'projectQuestions' },
                  { label: 'HR', key: 'hrQuestions' },
                  { label: 'Technical', key: 'technicalQuestions' },
                ].map((group) => (
                  <div key={group.key} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                    <strong>{group.label}:</strong>{' '}
                    {(vivaResult.questions?.[group.key] || vivaResult[group.key] || []).slice(0, 1).join('') || 'No questions'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            borderRadius: 16,
            border: '1px solid rgba(16,185,129,0.28)',
            background: 'rgba(255,255,255,0.03)',
            padding: 14,
            color: 'rgba(255,255,255,0.75)',
            fontSize: 12,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            <AlertTriangle size={14} color="#34d399" style={{ marginTop: 2 }} />
            Peer mock and mentor booking are available through backend Interview Suite APIs and can be reached from Community Hub and Real Interview flows.
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
