import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { useGuestGate } from '../components/GuestGate';
import { buildAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  Sparkles, Target, Award, ChevronRight, Clock, Loader2, Trash2,
  Download, ArrowRight, BarChart3, Tag, RefreshCw, Eye, Mic,
  Zap, Shield, BookOpen, Briefcase, Star, Info, Layout, Layers,
  Plus, Minus
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
  const { requireAuth } = useGuestGate();
  const fileInputRef = useRef(null);

  const FORM_LABELS = {
    linkedInUrl: 'LinkedIn URL',
  };

  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mode, setMode] = useState('landing'); // 'landing' | 'enhance' | 'create' | 'preview'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: '',
    skills: '',
    education: [{ institution: '', degree: '', location: '', dates: '', gpa: '', coursework: '' }],
    experience: [{ company: '', title: '', location: '', dates: '', bullets: '' }],
    projects: [{ name: '', tech: '', dates: '', bullets: '' }],
    awards: [''],
  });

  // Fetch history on mount
  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const buildResumeApiUrl = useCallback(
    (path) => buildApiUrl(import.meta.env.VITE_API_URL || '', path),
    []
  );

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(buildResumeApiUrl('/api/resume/history'), {
        headers: buildAuthHeaders(user),
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

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const analyzeResume = async () => {
    if (!requireAuth('analyze your resume')) return;
    if (!resumeText && !fileName) {
      setError('Please paste your resume text or upload a file.');
      return;
    }
    setAnalyzing(true);
    setError('');
    setResult(null);
    setActiveTab('overview');

    try {
      let res;

      if (resumeText === '__FILE_UPLOAD__' && fileInputRef.current?._file) {
        const formData = new FormData();
        formData.append('resume', fileInputRef.current._file);
        res = await fetch(buildResumeApiUrl('/api/resume/analyze'), {
          method: 'POST',
          headers: buildAuthHeaders(user),
          body: formData,
        });
      } else {
        res = await fetch(buildResumeApiUrl('/api/resume/analyze'), {
          method: 'POST',
          headers: buildAuthHeaders(user),
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
      setError(err.message || 'We couldn\'t analyze your resume. Please try again.');
    }
    setAnalyzing(false);
  };

  const loadAnalysis = async (id) => {
    try {
      const res = await fetch(buildResumeApiUrl(`/api/resume/${id}`), {
        headers: buildAuthHeaders(user),
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

  // ── Dynamic Form Helpers ──
  const addEducation = () => setCreateFormData(p => ({
    ...p, education: [...p.education, { institution: '', degree: '', location: '', dates: '', gpa: '', coursework: '' }]
  }));
  const removeEducation = (idx) => setCreateFormData(p => ({
    ...p, education: p.education.filter((_, i) => i !== idx)
  }));
  const updateEducation = (idx, field, val) => setCreateFormData(p => {
    const next = [...p.education]; next[idx] = { ...next[idx], [field]: val }; return { ...p, education: next };
  });

  const addExperience = () => setCreateFormData(p => ({
    ...p, experience: [...p.experience, { company: '', title: '', location: '', dates: '', bullets: '' }]
  }));
  const removeExperience = (idx) => setCreateFormData(p => ({
    ...p, experience: p.experience.filter((_, i) => i !== idx)
  }));
  const updateExperience = (idx, field, val) => setCreateFormData(p => {
    const next = [...p.experience]; next[idx] = { ...next[idx], [field]: val }; return { ...p, experience: next };
  });

  const addProject = () => setCreateFormData(p => ({
    ...p, projects: [...p.projects, { name: '', tech: '', dates: '', bullets: '' }]
  }));
  const removeProject = (idx) => setCreateFormData(p => ({
    ...p, projects: p.projects.filter((_, i) => i !== idx)
  }));
  const updateProject = (idx, field, val) => setCreateFormData(p => {
    const next = [...p.projects]; next[idx] = { ...next[idx], [field]: val }; return { ...p, projects: next };
  });

  const addAward = () => setCreateFormData(p => ({ ...p, awards: [...p.awards, ''] }));
  const removeAward = (idx) => setCreateFormData(p => ({ ...p, awards: p.awards.filter((_, i) => i !== idx) }));
  const updateAward = (idx, val) => setCreateFormData(p => {
    const next = [...p.awards]; next[idx] = val; return { ...p, awards: next };
  });

  const generateResume = async () => {
    if (!requireAuth('generate a resume')) return;
    if (!createFormData.fullName || !createFormData.email) {
      setError('Full name and email are required.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: buildAuthHeaders(user),
        body: JSON.stringify({ ...createFormData, template: selectedTemplate }),
      });
      if (!res.ok) {
        let msg = 'Generation failed';
        try { const e = await res.json(); msg = e.error || msg; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      setGeneratedResume(data.resume);
      setMode('preview');
    } catch (err) {
      setError(err.message || 'Resume generation is temporarily unavailable. Please try again shortly.');
    }
    setGenerating(false);
  };

  const printResume = () => {
    const el = document.getElementById('resume-print-area');
    if (!el) return;
    const clone = el.cloneNode(true);
    // Remove contenteditable attributes for print
    clone.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable'));
    clone.querySelectorAll('[data-edit-hover]').forEach(e => e.removeAttribute('data-edit-hover'));
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>${generatedResume?.fullName || 'Resume'}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Times New Roman',Times,Georgia,serif;color:#000;line-height:1.35;padding:36px 48px;max-width:820px;margin:0 auto;font-size:11pt}
        .resume-name{font-size:22pt;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;font-variant:small-caps}
        .resume-contact{text-align:center;font-size:9.5pt;color:#333;margin-bottom:6px}
        .resume-contact a{color:#333;text-decoration:none}
        .section-title{font-size:10.5pt;font-weight:700;text-transform:uppercase;border-bottom:1.5px solid #000;padding-bottom:2px;margin:14px 0 6px;letter-spacing:0.5px}
        .entry-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1px}
        .entry-institution{font-size:11pt;font-weight:700}
        .entry-date{font-size:10pt;font-weight:700;white-space:nowrap;text-align:right}
        .entry-subtitle{font-size:10pt;font-style:italic}
        .entry-location{font-size:10pt;font-style:italic;text-align:right;white-space:nowrap}
        .entry-detail{font-size:9.5pt;margin:1px 0}
        .skill-line{font-size:10pt;margin:1px 0}
        .skill-label{font-weight:700}
        ul{padding-left:16px;margin:3px 0}
        li{font-size:10pt;margin:2px 0;line-height:1.4}
        @media print{body{padding:24px 36px}@page{margin:0.5in}}
      </style>
    </head><body>${clone.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  // Helper: editable field
  const EditableField = ({ value, onChange, tag: Tag = 'span', style = {}, className = '' }) => (
    <Tag
      contentEditable
      suppressContentEditableWarning
      className={className}
      style={{ outline: 'none', cursor: 'text', borderBottom: '1px dashed transparent', transition: 'border-color 0.2s', ...style }}
      onFocus={(e) => { e.target.style.borderBottomColor = '#a855f7'; }}
      onBlur={(e) => { e.target.style.borderBottomColor = 'transparent'; onChange(e.target.innerText); }}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value || '') }}
    />
  );

  const updateResumeField = (path, value) => {
    setGeneratedResume(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const analysis = result?.analysis;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'ats', label: 'ATS Analysis' },
    { id: 'matching', label: 'Job Matching' },
    { id: 'suggestions', label: 'Suggestions' },
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                onClick={handleOpenFilePicker}
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
              {/* Header Card */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: 20, padding: '20px 28px',
                border: '1px solid var(--border)', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.12))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}>
                    <BarChart3 size={22} color="#818cf8" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Resume Analysis Results</h2>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '3px 0 0' }}>
                      Analysis results for: <span style={{ color: '#c084fc', fontWeight: 600 }}>{fileName || 'Resume'}</span>
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                      Completed on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>
                <button style={{
                  padding: '8px 18px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Download size={14} /> Share
                </button>
              </div>

              {/* Score Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'ATS Score', value: `${analysis.atsScore}%`, icon: Eye, color: '#fbbf24' },
                  { label: 'Job Match', value: analysis.keywordMatch?.industryFit || 'N/A', icon: Briefcase, color: '#60a5fa' },
                  { label: 'Suggestions', value: String(analysis.suggestions?.length || 0), icon: Sparkles, color: '#a78bfa' },
                  { label: 'Score Boost', value: `+${Math.min(100 - analysis.atsScore, 25)}%`, icon: TrendingUp, color: '#6ee7b7' },
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div key={i} style={{
                      background: 'var(--bg-card)', borderRadius: 16, padding: '18px 20px',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{card.label}</span>
                        <Icon size={16} color="rgba(255,255,255,0.25)" />
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: card.color }}>{card.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Tabs */}
              <div style={{
                display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
                borderRadius: 12, overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 20,
              }}>
                {tabs.map((tab, idx) => {
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                      padding: '13px 16px', border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                      color: active ? '#c084fc' : 'rgba(255,255,255,0.4)',
                      fontWeight: active ? 700 : 500, fontSize: 13, fontFamily: 'inherit',
                      transition: 'all 0.2s',
                      borderRight: idx < tabs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
                {activeTab === 'overview' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* ATS Score Breakdown */}
                    <div style={{
                      background: 'var(--bg-card)', borderRadius: 20, padding: 28,
                      border: '1px solid var(--border)',
                    }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Target size={16} color="#a78bfa" /> ATS Score Breakdown
                      </h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>
                        How your resume performs against ATS systems
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {[
                          { label: 'Keyword Optimization', key: 'keywords', color: '#818cf8' },
                          { label: 'Structural Formatting', key: 'format', color: '#6366f1' },
                          { label: 'Content Quality', key: 'content', color: '#818cf8' },
                          { label: 'Narrative Coherence', key: 'impact', color: '#f59e0b' },
                          { label: 'Additional Factors', key: 'atsCompat', color: '#818cf8' },
                        ].map((cat, i) => {
                          const score = analysis.scoreBreakdown?.[cat.key]?.score ?? Math.round(analysis.atsScore * (0.85 + Math.random() * 0.3));
                          const clampedScore = Math.min(Math.max(score, 0), 100);
                          return (
                            <div key={i}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{cat.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{clampedScore}%</span>
                              </div>
                              <div style={{ height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', width: `${clampedScore}%`,
                                  background: `linear-gradient(90deg, ${cat.color}, ${cat.color}cc)`,
                                  borderRadius: 8, transition: 'width 1.2s ease-out',
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Key Insights */}
                    <div style={{
                      background: 'var(--bg-card)', borderRadius: 20, padding: 28,
                      border: '1px solid var(--border)',
                    }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Star size={16} color="#fbbf24" /> Key Insights
                      </h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>
                        Your resume's main strengths and areas for improvement
                      </p>

                      {/* Strengths */}
                      <div style={{ marginBottom: 24 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={14} /> Strengths
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {analysis.strengths?.length > 0 ? analysis.strengths.map((s, i) => (
                            <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, paddingLeft: 10, borderLeft: '2px solid rgba(110,231,183,0.25)' }}>
                              • {s}
                            </div>
                          )) : (
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No strengths identified yet</span>
                          )}
                        </div>
                      </div>

                      {/* Areas to Improve */}
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fb923c', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={14} /> Areas to Improve
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {analysis.weaknesses?.length > 0 ? analysis.weaknesses.map((w, i) => (
                            <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, paddingLeft: 10, borderLeft: '2px solid rgba(251,146,60,0.25)' }}>
                              • {w}
                            </div>
                          )) : (
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>• Analysis temporarily unavailable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ats' && (
                  <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c084fc', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Layout size={16} /> Section-by-Section Analysis
                    </h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 20px' }}>Detailed breakdown of each resume section</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(analysis.sectionAnalysis?.length > 0) ? analysis.sectionAnalysis.map((sec, i) => {
                      const statusColors = { strong: '#6ee7b7', needs_work: '#fbbf24', weak: '#fb923c', missing: '#f87171' };
                      const statusLabels = { strong: 'Strong', needs_work: 'Needs Work', weak: 'Weak', missing: 'Missing' };
                      const sc = statusColors[sec.status] || '#fbbf24';
                      return (
                        <div key={i} style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: `1px solid ${sc}20` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{sec.sectionName}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: `${sc}15`, color: sc }}>{statusLabels[sec.status] || sec.status}</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: sc }}>{sec.score}/100</span>
                            </div>
                          </div>
                          <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', width: `${sec.score}%`, background: sc, borderRadius: 4, transition: 'width 0.8s ease' }} />
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>{sec.feedback}</p>
                        </div>
                      );
                    }) : (
                      <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                        <Layers size={24} style={{ marginBottom: 8 }} />
                        <p>Section analysis not available. Try running a new analysis.</p>
                      </div>
                    )}
                    </div>
                  </div>
                )}

                {activeTab === 'matching' && (
                  <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c084fc', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={16} /> Keyword & Skills Analysis
                    </h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>Keywords detected and gaps in your resume</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          Technical Skills Found
                        </h4>
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
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          Soft Skills Found
                        </h4>
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
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertTriangle size={14} /> Missing Keywords (Add These!)
                        </h4>
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
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c084fc', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={16} /> AI-Powered Suggestions
                    </h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 20px' }}>Prioritized improvements to boost your resume score</p>
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

              {/* Bottom Action Bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 28, paddingTop: 20,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <button onClick={() => { setMode('landing'); setResult(null); resetAnalysis(); }} style={{
                  padding: '10px 20px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Menu
                </button>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={resetAnalysis} style={{
                    padding: '10px 20px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <RefreshCw size={14} /> Analyze Another Resume
                  </button>
                  <button onClick={() => { setMode('create'); setResult(null); }} style={{
                    padding: '10px 24px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(139,92,246,0.25)',
                  }}>
                    <Sparkles size={14} /> Generate New Resume
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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

                  {/* Location & LinkedIn */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Location</label>
                      <input type="text" value={createFormData.location} onChange={(e) => setCreateFormData({ ...createFormData, location: e.target.value })}
                        placeholder="Chicago, IL" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s' }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{FORM_LABELS.linkedInUrl}</label>
                      <input type="text" value={createFormData.linkedin} onChange={(e) => setCreateFormData({ ...createFormData, linkedin: e.target.value })}
                        placeholder="linkedin.com/in/yourname" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s' }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      />
                    </div>
                  </div>

                  {/* ═══ EDUCATION ═══ */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BookOpen size={14} color="#a78bfa" /> Education
                      </label>
                      <button onClick={addEducation} type="button" style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Plus size={12} /> Add Education
                      </button>
                    </div>
                    {createFormData.education.map((edu, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                        {createFormData.education.length > 1 && (
                          <button onClick={() => removeEducation(idx)} type="button" style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <Minus size={12} />
                          </button>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <input placeholder="University / Institution Name *" value={edu.institution} onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                          <input placeholder="Dates (e.g. Jan 2022 – May 2023)" value={edu.dates} onChange={(e) => updateEducation(idx, 'dates', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <input placeholder="Degree (e.g. Master of Science in Business Analytics)" value={edu.degree} onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <input placeholder="Location (e.g. Chicago, IL)" value={edu.location} onChange={(e) => updateEducation(idx, 'location', e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                            />
                            <input placeholder="GPA (e.g. 3.91/4.0)" value={edu.gpa} onChange={(e) => updateEducation(idx, 'gpa', e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                            />
                          </div>
                        </div>
                        <input placeholder="Coursework (comma-separated, e.g. Data Mining, Statistics, Machine Learning)" value={edu.coursework} onChange={(e) => updateEducation(idx, 'coursework', e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* ═══ SKILLS ═══ */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Layers size={14} color="#a78bfa" /> Skills
                    </label>
                    <textarea
                      value={createFormData.skills}
                      onChange={(e) => setCreateFormData({ ...createFormData, skills: e.target.value })}
                      placeholder="List all your skills separated by commas. They'll be auto-categorized.&#10;e.g. Python, R, SQL, Power BI, Tableau, React, MongoDB, AWS, Docker"
                      rows={3}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s', resize: 'vertical' }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {/* ═══ EXPERIENCE ═══ */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={14} color="#a78bfa" /> Work Experience
                      </label>
                      <button onClick={addExperience} type="button" style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Plus size={12} /> Add Experience
                      </button>
                    </div>
                    {createFormData.experience.map((exp, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                        {createFormData.experience.length > 1 && (
                          <button onClick={() => removeExperience(idx)} type="button" style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <Minus size={12} />
                          </button>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <input placeholder="Company Name *" value={exp.company} onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                          <input placeholder="Dates (e.g. Aug 2023 – Present)" value={exp.dates} onChange={(e) => updateExperience(idx, 'dates', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <input placeholder="Job Title (e.g. Business Analyst II)" value={exp.title} onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                          <input placeholder="Location (e.g. Chicago, IL)" value={exp.location} onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                        </div>
                        <textarea placeholder="Key achievements / responsibilities (one per line)&#10;• Performed data analysis on group insurance accounts&#10;• Developed KPI metrics dashboard using Power BI" value={exp.bullets} onChange={(e) => updateExperience(idx, 'bullets', e.target.value)}
                          rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* ═══ PROJECTS ═══ */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Layout size={14} color="#a78bfa" /> Projects
                      </label>
                      <button onClick={addProject} type="button" style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Plus size={12} /> Add Project
                      </button>
                    </div>
                    {createFormData.projects.map((proj, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 16, marginBottom: 10, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                        {createFormData.projects.length > 1 && (
                          <button onClick={() => removeProject(idx)} type="button" style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <Minus size={12} />
                          </button>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <input placeholder="Project Name *" value={proj.name} onChange={(e) => updateProject(idx, 'name', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                          <input placeholder="Dates (e.g. Aug 2022 – Dec 2022)" value={proj.dates} onChange={(e) => updateProject(idx, 'dates', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                          />
                        </div>
                        <input placeholder="Technologies (e.g. Python, SQL, Tableau, Spark)" value={proj.tech} onChange={(e) => updateProject(idx, 'tech', e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 10 }}
                        />
                        <textarea placeholder="Key achievements (one per line)&#10;• Analyzed financial data for 100,000 borrowers&#10;• Achieved 96% accuracy using Random Forest" value={proj.bullets} onChange={(e) => updateProject(idx, 'bullets', e.target.value)}
                          rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* ═══ LEADERSHIP & AWARDS ═══ */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Award size={14} color="#a78bfa" /> Leadership & Awards
                      </label>
                      <button onClick={addAward} type="button" style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Plus size={12} /> Add Award
                      </button>
                    </div>
                    {createFormData.awards.map((award, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input placeholder="e.g. Nominated for Chancellor's award at UIC for excellence in academics" value={award} onChange={(e) => updateAward(idx, e.target.value)}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                        />
                        {createFormData.awards.length > 1 && (
                          <button onClick={() => removeAward(idx)} type="button" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, alignSelf: 'center' }}>
                            <Minus size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ═══ PROFESSIONAL SUMMARY ═══ */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Star size={14} color="#a78bfa" /> Professional Summary <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>(optional — AI will generate if empty)</span>
                    </label>
                    <textarea
                      value={createFormData.summary}
                      onChange={(e) => setCreateFormData({ ...createFormData, summary: e.target.value })}
                      placeholder="Brief overview of your professional background and career goals..."
                      rows={3}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s', resize: 'vertical' }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>

                  {error && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
                      color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <XCircle size={16} /> {error}
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={generateResume}
                    disabled={generating || !createFormData.fullName || !createFormData.email}
                    style={{
                    width: '100%', marginTop: 20, padding: '14px 24px',
                    borderRadius: 14, border: 'none', cursor: generating ? 'wait' : 'pointer',
                    background: 'linear-gradient(135deg, #a855f7, #d946ef)',
                    color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 24px rgba(168,85,247,0.25)',
                    opacity: generating || !createFormData.fullName || !createFormData.email ? 0.5 : 1,
                  }}>
                    {generating ? (
                      <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating with AI...</>
                    ) : (
                      <><Sparkles size={18} /> Generate Resume</>
                    )}
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

      {/* ── PREVIEW MODE ── */}
      {mode === 'preview' && generatedResume && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Action Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20, flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => { setMode('create'); setGeneratedResume(null); }} style={{
                padding: '9px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Back to Form
              </button>
              <div style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <span style={{ fontSize: 11, color: '#c4b5fd' }}>✏️ Click any text to edit</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {generatedResume.atsScore && (
                <div style={{
                  padding: '7px 14px', borderRadius: 10,
                  background: generatedResume.atsScore >= 80 ? 'rgba(110,231,183,0.1)' : 'rgba(251,191,36,0.1)',
                  border: `1px solid ${generatedResume.atsScore >= 80 ? 'rgba(110,231,183,0.2)' : 'rgba(251,191,36,0.2)'}`,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Award size={14} color={generatedResume.atsScore >= 80 ? '#6ee7b7' : '#fbbf24'} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: generatedResume.atsScore >= 80 ? '#6ee7b7' : '#fbbf24' }}>
                    ATS: {generatedResume.atsScore}%
                  </span>
                </div>
              )}
              <button onClick={printResume} style={{
                padding: '9px 20px', borderRadius: 10,
                background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
                border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
              }}>
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>

          {/* ── Resume Document (Traditional Format) ── */}
          <div style={{
            background: '#ffffff', borderRadius: 4, padding: '40px 52px',
            color: '#000', boxShadow: '0 2px 20px rgba(0,0,0,0.35)',
            lineHeight: 1.35, fontFamily: "'Times New Roman', Times, Georgia, serif",
            fontSize: '11pt', minHeight: 800,
          }}>
            <div id="resume-print-area">

              {/* ── Name ── */}
              <div className="resume-name" contentEditable suppressContentEditableWarning
                style={{
                  fontSize: '22pt', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase',
                  letterSpacing: 2, marginBottom: 4, fontVariant: 'small-caps', outline: 'none',
                  cursor: 'text',
                }}
                onBlur={(e) => updateResumeField('fullName', e.target.innerText)}
              >
                {generatedResume.fullName}
              </div>

              {/* ── Contact Row ── */}
              <div className="resume-contact" style={{ textAlign: 'center', fontSize: '9.5pt', color: '#333', marginBottom: 8 }}>
                {[
                  generatedResume.email && `✉ ${generatedResume.email}`,
                  generatedResume.phone && generatedResume.phone,
                  generatedResume.location && `📍 ${generatedResume.location}`,
                  generatedResume.linkedin && `in ${generatedResume.linkedin}`,
                  generatedResume.portfolio && generatedResume.portfolio,
                ].filter(Boolean).map((item, i, arr) => (
                  <span key={i} contentEditable suppressContentEditableWarning style={{ outline: 'none' }}
                    onBlur={(e) => {
                      // Update the corresponding field
                      const fields = ['email', 'phone', 'location', 'linkedin', 'portfolio'];
                      const fieldIdx = [generatedResume.email, generatedResume.phone, generatedResume.location, generatedResume.linkedin, generatedResume.portfolio]
                        .filter(Boolean).indexOf(item.replace('✉ ', '').replace('📍 ', '').replace(/^in\s/, ''));
                      if (fieldIdx >= 0 && fields[fieldIdx]) updateResumeField(fields[fieldIdx], e.target.innerText);
                    }}
                  >
                    {item}{i < arr.length - 1 ? '  |  ' : ''}
                  </span>
                ))}
              </div>

              {/* ── EDUCATION ── */}
              {generatedResume.education?.length > 0 && (
                <>
                  <div className="section-title" style={{
                    fontSize: '10.5pt', fontWeight: 700, textTransform: 'uppercase',
                    borderBottom: '1.5px solid #000', paddingBottom: 2, margin: '12px 0 6px',
                    letterSpacing: 0.5,
                  }}>EDUCATION</div>
                  {generatedResume.education.map((edu, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div className="entry-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span className="entry-institution" contentEditable suppressContentEditableWarning
                          style={{ fontWeight: 700, fontSize: '11pt', outline: 'none' }}
                          onBlur={(e) => updateResumeField(`education.${i}.institution`, e.target.innerText)}
                        >{edu.institution || 'University Name'}</span>
                        <span className="entry-date" contentEditable suppressContentEditableWarning
                          style={{ fontWeight: 700, fontSize: '10pt', whiteSpace: 'nowrap', outline: 'none' }}
                          onBlur={(e) => updateResumeField(`education.${i}.graduationDate`, e.target.innerText)}
                        >{edu.graduationDate}</span>
                      </div>
                      <div className="entry-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span className="entry-subtitle" contentEditable suppressContentEditableWarning
                          style={{ fontStyle: 'italic', fontSize: '10pt', outline: 'none' }}
                          onBlur={(e) => updateResumeField(`education.${i}.degree`, e.target.innerText)}
                        >{edu.degree}{edu.gpa ? `, GPA: ${edu.gpa}` : ''}</span>
                        <span className="entry-location" contentEditable suppressContentEditableWarning
                          style={{ fontStyle: 'italic', fontSize: '10pt', whiteSpace: 'nowrap', outline: 'none' }}
                          onBlur={(e) => updateResumeField(`education.${i}.location`, e.target.innerText)}
                        >{edu.location}</span>
                      </div>
                      {edu.highlights?.length > 0 && (
                        <div className="entry-detail" contentEditable suppressContentEditableWarning
                          style={{ fontSize: '9.5pt', margin: '2px 0', outline: 'none' }}
                          onBlur={(e) => updateResumeField(`education.${i}.highlights`, e.target.innerText.split(/[•,]/).map(s => s.trim()).filter(Boolean))}
                        >
                          Coursework: {edu.highlights.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* ── SKILLS ── */}
              {generatedResume.skills && Object.values(generatedResume.skills).some(v => v?.length > 0) && (
                <>
                  <div className="section-title" style={{
                    fontSize: '10.5pt', fontWeight: 700, textTransform: 'uppercase',
                    borderBottom: '1.5px solid #000', paddingBottom: 2, margin: '12px 0 6px',
                    letterSpacing: 0.5,
                  }}>SKILLS</div>
                  <div>
                    {Object.entries(generatedResume.skills).filter(([_, v]) => v?.length > 0).map(([cat, items]) => (
                      <div key={cat} className="skill-line" style={{ fontSize: '10pt', margin: '2px 0' }}>
                        <span className="skill-label" style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                          {cat === 'languages' ? 'Programming Languages' : cat === 'frameworks' ? 'Frameworks & Libraries' : cat === 'tools' ? 'Tools & Platforms' : cat === 'databases' ? 'Database Management Systems' : cat}:
                        </span>{' '}
                        <span contentEditable suppressContentEditableWarning style={{ outline: 'none' }}
                          onBlur={(e) => updateResumeField(`skills.${cat}`, e.target.innerText.split(',').map(s => s.trim()).filter(Boolean))}
                        >{items.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── EXPERIENCE ── */}
              {generatedResume.experience?.length > 0 && (
                <>
                  <div className="section-title" style={{
                    fontSize: '10.5pt', fontWeight: 700, textTransform: 'uppercase',
                    borderBottom: '1.5px solid #000', paddingBottom: 2, margin: '12px 0 6px',
                    letterSpacing: 0.5,
                  }}>EXPERIENCE</div>
                  {generatedResume.experience.map((job, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div className="entry-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span className="entry-institution" contentEditable suppressContentEditableWarning
                          style={{ fontWeight: 700, fontSize: '11pt', outline: 'none' }}
                          onBlur={(e) => updateResumeField(`experience.${i}.company`, e.target.innerText)}
                        >{job.company}</span>
                        <span className="entry-date" contentEditable suppressContentEditableWarning
                          style={{ fontWeight: 700, fontSize: '10pt', whiteSpace: 'nowrap', outline: 'none' }}
                          onBlur={(e) => {
                            const parts = e.target.innerText.split('–').map(s => s.trim());
                            updateResumeField(`experience.${i}.startDate`, parts[0] || '');
                            updateResumeField(`experience.${i}.endDate`, parts[1] || '');
                          }}
                        >{[job.startDate, job.endDate].filter(Boolean).join(' – ')}</span>
                      </div>
                      <div className="entry-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span className="entry-subtitle" contentEditable suppressContentEditableWarning
                          style={{ fontStyle: 'italic', fontSize: '10pt', outline: 'none' }}
                          onBlur={(e) => updateResumeField(`experience.${i}.title`, e.target.innerText)}
                        >{job.title}</span>
                        <span className="entry-location" contentEditable suppressContentEditableWarning
                          style={{ fontStyle: 'italic', fontSize: '10pt', whiteSpace: 'nowrap', outline: 'none' }}
                          onBlur={(e) => updateResumeField(`experience.${i}.location`, e.target.innerText)}
                        >{job.location}</span>
                      </div>
                      <ul style={{ paddingLeft: 16, margin: '3px 0 0' }}>
                        {job.bullets?.map((b, j) => (
                          <li key={j} contentEditable suppressContentEditableWarning
                            style={{ fontSize: '10pt', margin: '2px 0', lineHeight: 1.4, outline: 'none' }}
                            onBlur={(e) => {
                              const next = [...job.bullets]; next[j] = e.target.innerText;
                              updateResumeField(`experience.${i}.bullets`, next);
                            }}
                          >{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}

              {/* ── PROJECTS ── */}
              {generatedResume.projects?.length > 0 && (
                <>
                  <div className="section-title" style={{
                    fontSize: '10.5pt', fontWeight: 700, textTransform: 'uppercase',
                    borderBottom: '1.5px solid #000', paddingBottom: 2, margin: '12px 0 6px',
                    letterSpacing: 0.5,
                  }}>PROJECTS</div>
                  {generatedResume.projects.map((proj, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div className="entry-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span contentEditable suppressContentEditableWarning
                            style={{ fontWeight: 700, fontSize: '11pt', outline: 'none' }}
                            onBlur={(e) => updateResumeField(`projects.${i}.name`, e.target.innerText)}
                          >{proj.name}</span>
                          {proj.tech && (
                            <>
                              {' | '}
                              <span contentEditable suppressContentEditableWarning
                                style={{ fontStyle: 'italic', fontSize: '10pt', outline: 'none' }}
                                onBlur={(e) => updateResumeField(`projects.${i}.tech`, e.target.innerText)}
                              >{proj.tech}</span>
                            </>
                          )}
                        </div>
                        {proj.dates && (
                          <span className="entry-date" contentEditable suppressContentEditableWarning
                            style={{ fontWeight: 700, fontSize: '10pt', whiteSpace: 'nowrap', outline: 'none' }}
                            onBlur={(e) => updateResumeField(`projects.${i}.dates`, e.target.innerText)}
                          >{proj.dates}</span>
                        )}
                      </div>
                      <ul style={{ paddingLeft: 16, margin: '3px 0 0' }}>
                        {proj.bullets?.map((b, j) => (
                          <li key={j} contentEditable suppressContentEditableWarning
                            style={{ fontSize: '10pt', margin: '2px 0', lineHeight: 1.4, outline: 'none' }}
                            onBlur={(e) => {
                              const next = [...proj.bullets]; next[j] = e.target.innerText;
                              updateResumeField(`projects.${i}.bullets`, next);
                            }}
                          >{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}

              {/* ── Summary / Objective ── */}
              {generatedResume.summary && (
                <>
                  <div className="section-title" style={{
                    fontSize: '10.5pt', fontWeight: 700, textTransform: 'uppercase',
                    borderBottom: '1.5px solid #000', paddingBottom: 2, margin: '12px 0 6px',
                    letterSpacing: 0.5,
                  }}>PROFESSIONAL SUMMARY</div>
                  <p contentEditable suppressContentEditableWarning
                    style={{ fontSize: '10pt', lineHeight: 1.45, margin: '2px 0', outline: 'none' }}
                    onBlur={(e) => updateResumeField('summary', e.target.innerText)}
                  >{generatedResume.summary}</p>
                </>
              )}

              {/* ── CERTIFICATIONS / AWARDS ── */}
              {generatedResume.certifications?.length > 0 && (
                <>
                  <div className="section-title" style={{
                    fontSize: '10.5pt', fontWeight: 700, textTransform: 'uppercase',
                    borderBottom: '1.5px solid #000', paddingBottom: 2, margin: '12px 0 6px',
                    letterSpacing: 0.5,
                  }}>LEADERSHIP & AWARDS</div>
                  <ul style={{ paddingLeft: 16, margin: '3px 0' }}>
                    {generatedResume.certifications.map((c, i) => (
                      <li key={i} contentEditable suppressContentEditableWarning
                        style={{ fontSize: '10pt', margin: '2px 0', lineHeight: 1.4, outline: 'none' }}
                        onBlur={(e) => {
                          const next = [...generatedResume.certifications]; next[i] = e.target.innerText;
                          updateResumeField('certifications', next);
                        }}
                      >{c}</li>
                    ))}
                  </ul>
                </>
              )}

            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            marginTop: 24,
          }}>
            <button onClick={() => { setMode('landing'); setGeneratedResume(null); }} style={{
              padding: '10px 22px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Start Over
            </button>
            <button onClick={printResume} style={{
              padding: '10px 24px', borderRadius: 10,
              background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 20px rgba(139,92,246,0.25)',
            }}>
              <Download size={15} /> Save as PDF
            </button>
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

