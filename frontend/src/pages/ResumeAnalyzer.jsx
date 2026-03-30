import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  Sparkles, Target, Award, ChevronRight, Clock, Loader2, Trash2,
  Download, ArrowRight, BarChart3, Tag, RefreshCw, Eye, Mic,
  Zap, Shield, BookOpen, Briefcase, Star, Info
} from 'lucide-react';

// ── Animated circular gauge ──
function ATSGauge({ score, size = 180 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let frame;
    const duration = 1500;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const getColor = (s) => {
    if (s >= 80) return '#6ee7b7';
    if (s >= 60) return '#fbbf24';
    if (s >= 40) return '#fb923c';
    return '#f87171';
  };

  const color = getColor(score);
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.3s ease' }}
          filter="url(#glow)"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 42, fontWeight: 800, color, lineHeight: 1 }}>{animatedScore}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 600 }}>ATS Score</div>
        <div style={{
          fontSize: 11, fontWeight: 700, marginTop: 6,
          padding: '3px 10px', borderRadius: 20,
          background: `${color}15`, color, letterSpacing: 0.3
        }}>
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work'}
        </div>
      </div>
    </div>
  );
}

// ── Keyword tag ──
function KeywordTag({ label, type }) {
  const colors = {
    technical: { bg: 'rgba(139,92,246,0.12)', color: '#c084fc', border: 'rgba(139,92,246,0.2)' },
    soft: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
    missing: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.2)' },
  };
  const c = colors[type] || colors.technical;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {type === 'missing' && <AlertTriangle size={11} />}
      {label}
    </span>
  );
}

// ── Main Page ──
export default function ResumeAnalyzer() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mode, setMode] = useState('landing'); // 'landing' | 'enhance' | 'create'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
  });

  // Fetch history on mount
  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/resume/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.analyses || []);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
    setLoadingHistory(false);
  };

  const handleFileUpload = useCallback((file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.txt')) {
      setError('Please upload a PDF, TXT, or DOCX file.');
      return;
    }
    setFileName(file.name);
    setError('');

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => setResumeText(e.target.result);
      reader.readAsText(file);
    } else {
      // For PDF/DOCX, we'll send the file directly
      setResumeText('__FILE_UPLOAD__');
      fileInputRef.current._file = file;
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  }, [handleFileUpload]);

  const analyzeResume = async () => {
    if (!resumeText && !fileName) {
      setError('Please paste your resume text or upload a file.');
      return;
    }
    setAnalyzing(true);
    setError('');
    setResult(null);
    setActiveTab('overview');

    try {
      const token = localStorage.getItem('token');
      let res;

      if (resumeText === '__FILE_UPLOAD__' && fileInputRef.current?._file) {
        const formData = new FormData();
        formData.append('resume', fileInputRef.current._file);
        res = await fetch('/api/resume/analyze', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        res = await fetch('/api/resume/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ resumeText }),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to analyze resume. Please try again.');
    }
    setAnalyzing(false);
  };

  const loadAnalysis = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/resume/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResult({
          analysis: {
            atsScore: data.analysis.ats_score,
            strengths: data.analysis.strengths,
            weaknesses: data.analysis.weaknesses,
            suggestions: data.analysis.suggestions,
            keywordMatch: data.analysis.keyword_match,
          },
          id: data.analysis.id,
        });
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('Load analysis error:', err);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setResumeText('');
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current._file = null;
    }
  };

  const analysis = result?.analysis;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'keywords', label: 'Keywords', icon: Tag },
    { id: 'suggestions', label: 'Suggestions', icon: Sparkles },
    { id: 'interview', label: 'Interview Prep', icon: Mic },
  ];

  // Templates data
  const templates = [
    { id: 1, name: 'Modern Professional', desc: 'Clean, contemporary design', atsScore: 95, color: '#6ee7b7' },
    { id: 2, name: 'Classic Corporate', desc: 'Traditional, conservative format', atsScore: 98, color: '#fbbf24' },
    { id: 3, name: 'Technical Focused', desc: 'Skills and project emphasis', atsScore: 92, color: '#60a5fa' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 0' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(168,85,247,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <FileText size={22} color="#a78bfa" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#fff' }}>Resume Analyzer</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              AI-powered ATS scoring, keyword analysis & interview prep insights
            </p>
          </div>
        </div>
      </div>

      {/* ── LANDING PAGE ── */}
      {mode === 'landing' && !result && (
        <div>
          {/* Choose Your Path */}
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', color: '#fff', marginBottom: 12 }}>
              Choose Your Path
            </h2>
            <p style={{ fontSize: 15, textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
              Select your preferred option
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
              {/* Enhance Existing Resume */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: 32,
                border: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                  e.currentTarget.style.background = 'rgba(139,92,246,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
                onClick={() => setMode('enhance')}
              >
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,92,246,0.04)', pointerEvents: 'none' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(168,85,247,0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}>
                    <Upload size={28} color="#a78bfa" />
                  </div>
                  <span style={{
                    padding: '6px 14px', borderRadius: 20,
                    background: 'rgba(110,231,183,0.15)', color: '#6ee7b7',
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    Popular
                  </span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8, position: 'relative', zIndex: 1 }}>
                  Enhance Existing Resume
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  Upload your current resume and get detailed analysis with AI-powered improvements
                </p>

                <div style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    How it works:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#6ee7b7" /> Upload your PDF or DOCX resume
                    </li>
                    <li style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#6ee7b7" /> Get comprehensive ATS analysis
                    </li>
                    <li style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#6ee7b7" /> Receive optimization suggestions
                    </li>
                  </ul>
                </div>

                <button style={{
                  width: '100%', padding: '14px 24px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
                  color: '#fff', fontSize: 14, fontWeight: 700, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 24px rgba(139,92,246,0.25)',
                  transition: 'all 0.3s',
                  position: 'relative', zIndex: 1,
                }}>
                  Upload Resume <ArrowRight size={16} />
                </button>
              </div>

              {/* Create Resume from Scratch */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: 32,
                border: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)';
                  e.currentTarget.style.background = 'rgba(168,85,247,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
                onClick={() => setMode('create')}
              >
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(168,85,247,0.04)', pointerEvents: 'none' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(186,85,211,0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(168,85,247,0.2)',
                  }}>
                    <Sparkles size={28} color="#d8b4fe" />
                  </div>
                  <span style={{
                    padding: '6px 14px', borderRadius: 20,
                    background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    New
                  </span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8, position: 'relative', zIndex: 1 }}>
                  Create Resume from Scratch
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                  Tell us about yourself in natural language and we'll create a professional resume
                </p>

                <div style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    How it works:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#a78bfa" /> Fill out natural language form
                    </li>
                    <li style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#a78bfa" /> Choose your preferred template
                    </li>
                    <li style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={14} color="#a78bfa" /> AI creates structured resume
                    </li>
                  </ul>
                </div>

                <button style={{
                  width: '100%', padding: '14px 24px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #a855f7, #d946ef)',
                  color: '#fff', fontSize: 14, fontWeight: 700, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 24px rgba(168,85,247,0.25)',
                  transition: 'all 0.3s',
                  position: 'relative', zIndex: 1,
                }}>
                  Start Creating <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Professional Templates */}
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', color: '#fff', marginBottom: 8 }}>
              Professional Templates
            </h2>
            <p style={{ fontSize: 13, textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
              Choose from 3 ATS-optimized templates designed by professionals
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {templates.map((template) => (
                <div key={template.id} style={{
                  background: 'var(--bg-card)', borderRadius: 20, padding: 24,
                  border: '1px solid var(--border)', overflow: 'hidden',
                  transition: 'all 0.3s', cursor: 'pointer',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${template.color}`;
                    e.currentTarget.style.background = `${template.color}08`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                      {template.name}
                    </h3>
                    <span style={{
                      padding: '6px 12px', borderRadius: 12,
                      background: `${template.color}15`, color: template.color,
                      fontSize: 13, fontWeight: 800,
                    }}>
                      {template.atsScore}% ATS
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                    {template.desc}
                  </p>

                  {/* Mock resume preview */}
                  <div style={{
                    padding: 16, borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: 16, height: 180, overflow: 'hidden',
                  }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                      <div style={{ fontWeight: 700, color: template.color, marginBottom: 4 }}>John Doe</div>
                      <div style={{ fontSize: 10, marginBottom: 8 }}>john@example.com • (123) 456-7890</div>
                      <div style={{ fontSize: 10 }}>
                        • Led development of web applications<br />
                        • Managed cross-functional teams<br />
                        • Improved system performance by 40%
                      </div>
                    </div>
                  </div>

                  <button style={{
                    width: '100%', padding: '10px 16px', borderRadius: 10,
                    background: selectedTemplate === template.id ? `${template.color}20` : 'rgba(255,255,255,0.05)',
                    color: selectedTemplate === template.id ? template.color : '#fff',
                    fontSize: 12, fontWeight: 700, border: `1px solid ${selectedTemplate === template.id ? template.color : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}>
                    {selectedTemplate === template.id ? '✓ Selected' : 'Select Template'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ENHANCE MODE ── */}
      {mode === 'enhance' && (
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 320px' : '1fr', gap: 20 }}>
          {/* Back button */}
          <button onClick={() => { setMode('landing'); setResult(null); resetAnalysis(); }} style={{
            marginBottom: 16, padding: '8px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            width: 'fit-content',
          }}>
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
        {/* ── Main Content ── */}
        <div>
          {!result ? (
            /* ── Upload Section ── */
            <div style={{
              background: 'var(--bg-card)', borderRadius: 20, padding: 32,
              border: '1px solid var(--border)',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={20} color="#a78bfa" />
                Upload Your Resume
              </h2>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 16, padding: '48px 32px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  background: dragOver ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                  marginBottom: 20,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
                <div style={{
                  width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(168,85,247,0.08))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(139,92,246,0.15)',
                }}>
                  <Upload size={28} color="#a78bfa" />
                </div>
                {fileName ? (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#6ee7b7', marginBottom: 4 }}>
                      <CheckCircle2 size={16} style={{ verticalAlign: -2 }} /> {fileName}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Click or drop to replace</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                      Drag & drop your resume here, or click to browse
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                      Supports PDF, TXT, and DOCX files
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OR PASTE TEXT</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Text input */}
              <textarea
                value={resumeText === '__FILE_UPLOAD__' ? '' : resumeText}
                onChange={(e) => { setResumeText(e.target.value); setFileName(''); }}
                placeholder="Paste your resume content here..."
                rows={8}
                style={{
                  width: '100%', padding: '16px 18px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, color: '#fff', fontSize: 14, fontFamily: 'inherit',
                  resize: 'vertical', lineHeight: 1.6,
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
                  color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <XCircle size={16} /> {error}
                </div>
              )}

              {/* Analyze button */}
              <button
                onClick={analyzeResume}
                disabled={analyzing || (!resumeText && !fileName)}
                style={{
                  width: '100%', marginTop: 20, padding: '14px 24px',
                  borderRadius: 14, border: 'none', cursor: analyzing ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
                  color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: analyzing || (!resumeText && !fileName) ? 0.5 : 1,
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 24px rgba(139,92,246,0.25)',
                }}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Analyze Resume
                  </>
                )}
              </button>

              {/* Features grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 24 }}>
                {[
                  { icon: Target, label: 'ATS Score', desc: 'Comprehensive compatibility rating', color: '#6ee7b7' },
                  { icon: Tag, label: 'Keyword Analysis', desc: 'Technical & soft skill scanning', color: '#60a5fa' },
                  { icon: Sparkles, label: 'AI Suggestions', desc: 'Personalized improvement tips', color: '#c084fc' },
                  { icon: Mic, label: 'Interview Prep', desc: 'Resume-based question areas', color: '#fbbf24' },
                ].map((feat, i) => {
                  const Icon = feat.icon;
                  return (
                    <div key={i} style={{
                      padding: '14px 16px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${feat.color}12`, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${feat.color}20`,
                      }}>
                        <Icon size={16} color={feat.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{feat.label}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{feat.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Results Section ── */
            <div>
              {/* Top results bar */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: 28,
                border: '1px solid var(--border)', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <Award size={20} color="#fbbf24" /> Analysis Results
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={resetAnalysis} style={{
                      padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <RefreshCw size={13} /> New Analysis
                    </button>
                  </div>
                </div>

                {/* Score + quick stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                  <ATSGauge score={analysis.atsScore} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Strengths', value: analysis.strengths?.length || 0, icon: CheckCircle2, color: '#6ee7b7' },
                        { label: 'Issues', value: analysis.weaknesses?.length || 0, icon: AlertTriangle, color: '#fb923c' },
                        { label: 'Tech Skills', value: analysis.keywordMatch?.technical?.length || 0, icon: Tag, color: '#60a5fa' },
                        { label: 'Missing', value: analysis.keywordMatch?.missing?.length || 0, icon: XCircle, color: '#f87171' },
                      ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                          <div key={i} style={{
                            padding: '14px 16px', borderRadius: 14,
                            background: `${stat.color}08`,
                            border: `1px solid ${stat.color}15`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <Icon size={14} color={stat.color} />
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</span>
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex', gap: 4, padding: 4, borderRadius: 14,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 20,
              }}>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                      color: active ? '#c084fc' : 'rgba(255,255,255,0.4)',
                      fontWeight: active ? 700 : 500, fontSize: 13, fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}>
                      <Icon size={15} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: 28,
                border: '1px solid var(--border)',
              }}>
                {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Strengths */}
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#6ee7b7', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} /> Strengths
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.strengths?.map((s, i) => (
                          <div key={i} style={{
                            padding: '12px 16px', borderRadius: 12,
                            background: 'rgba(110,231,183,0.05)',
                            border: '1px solid rgba(110,231,183,0.1)',
                            fontSize: 13, color: 'rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                          }}>
                            <CheckCircle2 size={14} color="#6ee7b7" style={{ flexShrink: 0, marginTop: 2 }} />
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weaknesses */}
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fb923c', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} /> Areas to Improve
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.weaknesses?.map((w, i) => (
                          <div key={i} style={{
                            padding: '12px 16px', borderRadius: 12,
                            background: 'rgba(251,146,60,0.05)',
                            border: '1px solid rgba(251,146,60,0.1)',
                            fontSize: 13, color: 'rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                          }}>
                            <AlertTriangle size={14} color="#fb923c" style={{ flexShrink: 0, marginTop: 2 }} />
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'keywords' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#c084fc', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={15} /> Technical Skills Found
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {analysis.keywordMatch?.technical?.map((k, i) => (
                          <KeywordTag key={i} label={k} type="technical" />
                        ))}
                        {(!analysis.keywordMatch?.technical || analysis.keywordMatch.technical.length === 0) && (
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No technical keywords detected</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={15} /> Soft Skills Found
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {analysis.keywordMatch?.soft?.map((k, i) => (
                          <KeywordTag key={i} label={k} type="soft" />
                        ))}
                        {(!analysis.keywordMatch?.soft || analysis.keywordMatch.soft.length === 0) && (
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No soft skills detected</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={15} /> Missing Keywords (Add These!)
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {analysis.keywordMatch?.missing?.map((k, i) => (
                          <KeywordTag key={i} label={k} type="missing" />
                        ))}
                        {(!analysis.keywordMatch?.missing || analysis.keywordMatch.missing.length === 0) && (
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No missing keywords — great coverage!</span>
                        )}
                      </div>
                    </div>

                    {/* Keyword stats bar */}
                    <div style={{
                      padding: '16px 20px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>KEYWORD COVERAGE</div>
                      <div style={{ height: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                        {(() => {
                          const tech = analysis.keywordMatch?.technical?.length || 0;
                          const soft = analysis.keywordMatch?.soft?.length || 0;
                          const miss = analysis.keywordMatch?.missing?.length || 0;
                          const total = tech + soft + miss || 1;
                          return (
                            <>
                              <div style={{ width: `${(tech / total) * 100}%`, background: '#c084fc', transition: 'width 0.5s' }} />
                              <div style={{ width: `${(soft / total) * 100}%`, background: '#60a5fa', transition: 'width 0.5s' }} />
                              <div style={{ width: `${(miss / total) * 100}%`, background: '#f87171', transition: 'width 0.5s' }} />
                            </>
                          );
                        })()}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        {[
                          { label: 'Technical', color: '#c084fc', count: analysis.keywordMatch?.technical?.length || 0 },
                          { label: 'Soft Skills', color: '#60a5fa', count: analysis.keywordMatch?.soft?.length || 0 },
                          { label: 'Missing', color: '#f87171', count: analysis.keywordMatch?.missing?.length || 0 },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: item.color }} />
                            {item.label} ({item.count})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c084fc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={16} /> AI-Powered Suggestions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.suggestions?.map((s, i) => (
                        <div key={i} style={{
                          padding: '14px 18px', borderRadius: 14,
                          background: 'rgba(139,92,246,0.04)',
                          border: '1px solid rgba(139,92,246,0.08)',
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.04)'}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: '#c084fc',
                          }}>
                            {i + 1}
                          </div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                            {s}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'interview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {result?.resumeProfile ? (
                      <>
                        <div style={{
                          padding: '18px 20px', borderRadius: 14,
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(168,85,247,0.04))',
                          border: '1px solid rgba(139,92,246,0.12)',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Candidate Headline</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{result.resumeProfile.candidateHeadline}</div>
                        </div>

                        {result.resumeProfile.coreSkills?.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Star size={14} /> Core Skills
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {result.resumeProfile.coreSkills.map((skill, i) => (
                                <span key={i} style={{
                                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                  background: 'rgba(110,231,183,0.08)', color: '#6ee7b7',
                                  border: '1px solid rgba(110,231,183,0.15)',
                                }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.resumeProfile.projectHighlights?.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <BookOpen size={14} /> Project Highlights
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {result.resumeProfile.projectHighlights.map((p, i) => (
                                <div key={i} style={{
                                  padding: '10px 14px', borderRadius: 10,
                                  background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.08)',
                                  fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
                                }}>
                                  {p}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.resumeProfile.likelyQuestionAreas?.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Mic size={14} /> Likely Interview Question Areas
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {result.resumeProfile.likelyQuestionAreas.map((q, i) => (
                                <div key={i} style={{
                                  padding: '10px 14px', borderRadius: 10,
                                  background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.08)',
                                  fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
                                  display: 'flex', alignItems: 'center', gap: 10,
                                }}>
                                  <ChevronRight size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
                                  {q}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* CTA: Start Interview */}
                        <Link to="/company-interview" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '14px 24px', borderRadius: 14, textDecoration: 'none',
                          background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
                          color: '#fff', fontSize: 14, fontWeight: 700,
                          boxShadow: '0 4px 24px rgba(139,92,246,0.25)',
                          transition: 'all 0.3s',
                        }}>
                          <Mic size={18} />
                          Start Mock Interview Based on Resume
                          <ArrowRight size={16} />
                        </Link>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                        <Info size={24} style={{ marginBottom: 8 }} />
                        <p>Interview profile not available for this analysis.</p>
                        <p style={{ fontSize: 12 }}>Try running a new analysis to generate interview prep insights.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar: History ── */}
        {result && (
          <div>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 20, padding: 20,
              border: '1px solid var(--border)', position: 'sticky', top: 20,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={15} color="rgba(255,255,255,0.4)" />
                Analysis History
              </h3>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                  No previous analyses
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.map((h, i) => {
                    const scoreColor = h.ats_score >= 80 ? '#6ee7b7' : h.ats_score >= 60 ? '#fbbf24' : '#f87171';
                    const isActive = result?.id === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => loadAnalysis(h.id)}
                        style={{
                          padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: isActive ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          borderLeft: isActive ? '3px solid #a78bfa' : '3px solid transparent',
                          transition: 'all 0.2s', fontFamily: 'inherit', width: '100%', textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                            {new Date(h.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                            {new Date(h.analyzed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 10px', borderRadius: 8,
                          background: `${scoreColor}12`, color: scoreColor,
                          fontSize: 13, fontWeight: 800,
                        }}>
                          {h.ats_score}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── CREATE MODE ── */}
      {mode === 'create' && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Back button */}
          <button onClick={() => { setMode('landing'); setSelectedTemplate(null); setCreateFormData({ fullName: '', email: '', phone: '', summary: '', experience: '', education: '', skills: '' }); }} style={{
            marginBottom: 20, padding: '8px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            width: 'fit-content',
          }}>
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Back to Templates
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            {/* Form Section */}
            <div>
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: 32,
                border: '1px solid var(--border)', marginBottom: 24,
              }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={22} color="#d8b4fe" />
                  Create Your Resume
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
                  Fill in your information and we'll generate a professional resume
                </p>

                {/* Form Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Full Name *</label>
                    <input
                      type="text"
                      value={createFormData.fullName}
                      onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                      placeholder="John Doe"
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {/* Email & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Email *</label>
                      <input
                        type="email"
                        value={createFormData.email}
                        onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                        placeholder="john@example.com"
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Phone</label>
                      <input
                        type="tel"
                        value={createFormData.phone}
                        onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                        placeholder="(123) 456-7890"
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Professional Summary</label>
                    <textarea
                      value={createFormData.summary}
                      onChange={(e) => setCreateFormData({ ...createFormData, summary: e.target.value })}
                      placeholder="Brief overview of your professional background and career goals..."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                        transition: 'all 0.2s', resize: 'vertical',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {/* Experience */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Work Experience</label>
                    <textarea
                      value={createFormData.experience}
                      onChange={(e) => setCreateFormData({ ...createFormData, experience: e.target.value })}
                      placeholder="Job titles, companies, dates, and key achievements. Separate multiple positions with line breaks."
                      rows={4}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                        transition: 'all 0.2s', resize: 'vertical',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {/* Education */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Education</label>
                    <textarea
                      value={createFormData.education}
                      onChange={(e) => setCreateFormData({ ...createFormData, education: e.target.value })}
                      placeholder="Degrees, universities, graduation dates, and relevant coursework..."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                        transition: 'all 0.2s', resize: 'vertical',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Skills</label>
                    <textarea
                      value={createFormData.skills}
                      onChange={(e) => setCreateFormData({ ...createFormData, skills: e.target.value })}
                      placeholder="Technical skills, tools, languages. Separate with commas or line breaks."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                        transition: 'all 0.2s', resize: 'vertical',
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {/* Generate Button */}
                  <button style={{
                    width: '100%', marginTop: 20, padding: '14px 24px',
                    borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #a855f7, #d946ef)',
                    color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 24px rgba(168,85,247,0.25)',
                  }}>
                    <Sparkles size={18} />
                    Generate Resume
                  </button>
                </div>
              </div>
            </div>

            {/* Template Selection Sidebar */}
            <div>
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: 20,
                border: '1px solid var(--border)', position: 'sticky', top: 20,
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#fff' }}>
                  Resume Template
                </h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                  Choose your preferred template format
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      style={{
                        padding: '12px 14px', borderRadius: 12,
                        background: selectedTemplate === template.id ? `${template.color}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedTemplate === template.id ? template.color : 'rgba(255,255,255,0.08)'}`,
                        color: selectedTemplate === template.id ? template.color : '#fff',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTemplate !== template.id) {
                          e.currentTarget.style.background = `${template.color}08`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTemplate !== template.id) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }
                      }}
                    >
                      <span>{template.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.6 }}>{template.atsScore}%</span>
                    </button>
                  ))}
                </div>

                {selectedTemplate && (
                  <div style={{
                    marginTop: 16, padding: 12, borderRadius: 12,
                    background: `${templates.find(t => t.id === selectedTemplate)?.color}12`,
                    border: `1px solid ${templates.find(t => t.id === selectedTemplate)?.color}20`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: templates.find(t => t.id === selectedTemplate)?.color, marginBottom: 4 }}>
                      ✓ Selected Template
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      {templates.find(t => t.id === selectedTemplate)?.desc}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spin animation keyframes */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
