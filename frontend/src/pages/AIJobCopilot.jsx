import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Linkedin,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Twitter,
  Upload,
  Wand2,
  MessageCircle,
  XCircle,
  Send,
  Bot,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../utils/safeApiUrl';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import './AIJobCopilot.css';

const TARGET_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Development Engineer',
  'Data Analyst',
  'DevOps Engineer',
  'Machine Learning Engineer',
  'Product Manager',
];

function roleKeywordDefaults(role) {
  const roleMap = {
    'Frontend Developer': ['React', 'TypeScript', 'Accessibility', 'Performance'],
    'Backend Developer': ['Node.js', 'API Design', 'PostgreSQL', 'System Design'],
    'Full Stack Developer': ['React', 'Node.js', 'Database Design', 'Testing'],
    'Software Development Engineer': ['Data Structures', 'Algorithms', 'Distributed Systems', 'OOP'],
    'Data Analyst': ['SQL', 'Python', 'A/B Testing', 'Dashboarding'],
    'DevOps Engineer': ['CI/CD', 'Docker', 'Kubernetes', 'Monitoring'],
    'Machine Learning Engineer': ['Python', 'Model Deployment', 'MLOps', 'Feature Engineering'],
    'Product Manager': ['Roadmapping', 'Stakeholder Management', 'Prioritization', 'Metrics'],
  };

  return roleMap[role] || [];
}

export default function AIJobCopilot() {
  const { user } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const initialJobDetails = location.state?.jobDetails || {};
  const initialQuery = location.state?.initialQuery || '';
  
  const [targetRole, setTargetRole] = useState(initialJobDetails.title || initialJobDetails.role || '');
  const [jobDescription, setJobDescription] = useState(initialJobDetails.description || '');
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  
  // Conversational AI state
  const [query, setQuery] = useState(initialQuery);
  const [asking, setAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    if (initialQuery) {
      handleAskCopilot();
    }
  }, []);

  const suggestedKeywords = useMemo(() => {
    if (analysis?.analysis?.keywordMatch?.technical?.length) {
      return analysis.analysis.keywordMatch.technical.slice(0, 6);
    }
    return roleKeywordDefaults(targetRole);
  }, [analysis, targetRole]);

  const canAnalyze = Boolean(targetRole && resumeFile && !analyzing);

  const onSelectFile = (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setError('Only PDF files are supported for this flow.');
      return;
    }

    setError('');
    setResumeFile(file);
  };

  const handleAskCopilot = async () => {
    if (!query.trim() || asking) return;

    setAsking(true);
    setChatError('');
    setAiResponse(null);

    try {
      const response = await authFetch(buildApiUrl('/copilot/ask', {
        rawBaseUrl: import.meta.env.VITE_API_URL || '',
      }), {
        method: 'POST',
        body: JSON.stringify({ 
          query,
          context: targetRole ? `Target role: ${targetRole}` : undefined
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to get AI response.');
      }

      setAiResponse(payload.response);
    } catch (requestError) {
      setChatError(requestError.message || 'Failed to get AI response.');
    } finally {
      setAsking(false);
    }
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const headers = buildAuthHeaders(user);
      delete headers['Content-Type'];

      const response = await fetch(buildApiUrl('/resume/analyze', {
        rawBaseUrl: import.meta.env.VITE_API_URL || '',
      }), {
        method: 'POST',
        headers,
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to analyze resume right now.');
      }

      setAnalysis(payload);
    } catch (requestError) {
      setError(requestError.message || 'Failed to analyze CV.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="copilot-page-wrap">

      <section className="copilot-hero">
        <div className="copilot-hero-content">
          <h1>AI Job Copilot</h1>
          <p>
            Your personal career strategist. Get instant answers to interview questions, resume optimization tips, and job fit analysis.
          </p>

          <div className="copilot-hero-pills" aria-label="Copilot highlights">
            <span><TrendingUp size={16} /> 3x Interview Rate</span>
            <span><Target size={16} /> Beat ATS Systems</span>
            <span><Star size={16} /> STAR Method Prep</span>
          </div>
        </div>
      </section>

      {/* AI Chat Section */}
      <section className="copilot-card" aria-label="Ask AI Copilot">
        <header className="copilot-card-head">
          <h2><Bot size={20} /> Ask AI Copilot</h2>
          <p>Get instant career advice, interview prep, and job search strategies.</p>
        </header>

        <div className="copilot-chat-container">
          <div className="copilot-field">
            <label htmlFor="copilotQuery">
              <MessageCircle size={14} /> Your Question
            </label>
            <textarea
              id="copilotQuery"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Help me answer 'Why Google?' or 'How do I negotiate salary?'"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleAskCopilot();
                }
              }}
            />
          </div>

          <button 
            type="button" 
            className="copilot-cta primary" 
            disabled={!query.trim() || asking}
            onClick={handleAskCopilot}
          >
            {asking ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {asking ? 'Thinking...' : 'Ask Copilot'}
          </button>

          {chatError && (
            <div className="copilot-status error" role="alert">
              <XCircle size={16} /> {chatError}
            </div>
          )}

          {aiResponse && (
            <div className="copilot-ai-response">
              <div className="copilot-response-header">
                <Bot size={18} />
                <strong>AI Copilot Response</strong>
              </div>
              <div className="copilot-response-content">
                {aiResponse.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Resume Analysis Section */}
      <section className="copilot-card" aria-label="Resume Analysis">
        <header className="copilot-card-head">
          <h2>Configuration</h2>
          <p>Set your target role and provide a job description for precise AI analysis.</p>
        </header>

        <div className="copilot-form-grid">
          <div className="copilot-field">
            <label htmlFor="targetRole">
              <Briefcase size={14} /> 1. Target Role
            </label>
            <input
              id="targetRole"
              list="copilotTargetRoles"
              type="text"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              className="copilot-select"
              placeholder="Search target role..."
            />
            <datalist id="copilotTargetRoles">
              {TARGET_ROLES.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>
          </div>

          <div className="copilot-field">
            <label htmlFor="jobDescription">
              <FileText size={14} /> 2. Job Description <span>(Optional)</span>
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the target job description here for highly accurate match scoring..."
              rows={5}
            />
          </div>

          <div className="copilot-field">
            <label>
              <Upload size={14} /> 3. Active Resume
            </label>
            <button
              type="button"
              className={`copilot-upload ${dragOver ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                onSelectFile(event.dataTransfer.files?.[0]);
              }}
            >
              <Upload size={18} />
              <div>
                <strong>{resumeFile ? resumeFile.name : 'Upload New Resume'}</strong>
                <span>{resumeFile ? 'Ready for analysis' : 'Drag and drop a new PDF'}</span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(event) => onSelectFile(event.target.files?.[0])}
            />
          </div>
        </div>

        <div className="copilot-actions">
          <button type="button" className="copilot-cta primary" disabled={!canAnalyze} onClick={handleAnalyze}>
            {analyzing ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            Analyse CV
          </button>

          <button type="button" className="copilot-cta pro" disabled>
            <Wand2 size={16} /> Cover Letter
            <span>Pro</span>
          </button>

          <button type="button" className="copilot-cta pro" disabled>
            <FileText size={16} /> Mock Interview
            <span>Pro</span>
          </button>
        </div>

        {error && (
          <div className="copilot-status error" role="alert">
            <XCircle size={16} /> {error}
          </div>
        )}

        {analysis?.analysis && (
          <div className="copilot-results" aria-live="polite">
            <div className="copilot-score">
              <p>ATS Score</p>
              <strong>{analysis.analysis.atsScore ?? '--'}</strong>
            </div>

            <div className="copilot-outcomes">
              <div>
                <h3><CheckCircle2 size={15} /> Top Strengths</h3>
                <ul>
                  {(analysis.analysis.strengths || []).slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3><ArrowUpRight size={15} /> Priority Improvements</h3>
                <ul>
                  {(analysis.analysis.quickWins || analysis.analysis.suggestions || []).slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {suggestedKeywords.length > 0 && (
          <div className="copilot-keywords">
            <h3>Keyword Targets</h3>
            <div>
              {suggestedKeywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
