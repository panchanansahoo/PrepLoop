import React, { useState, useEffect, useRef } from 'react';
import { Code2, Play, History, ChevronRight, AlertTriangle, CheckCircle, Zap, Clock, Target, TrendingUp } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const api = (path) => buildApiUrl(path, { rawBaseUrl: API_URL, apiPrefix: '/api' });

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'typescript', label: 'TypeScript' },
];

const SAMPLE = `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`;

function ScoreGauge({ score, label, color }) {
  const r = 28, c = 2 * Math.PI * r, o = c - (score / 100) * c;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={o}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }} />
        <text x="36" y="40" textAnchor="middle" fill="var(--text-primary)" fontWeight="800" fontSize="16">{score}</text>
      </svg>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function ReviewResult({ review }) {
  if (!review) return null;
  const g = (a, b) => review[a] || review[b] || 0;
  const ga = (a, b) => review[a] || review[b] || [];
  const gs = (a, b) => review[a] || review[b] || '';
  const ec = review.edge_cases_covered || review.edgeCasesCovered || {};

  return (
    <div className="cr-result">
      <div className="cr-scores-grid">
        <ScoreGauge score={g('overall_score','overallScore')} label="Overall" color="#8b5cf6" />
        <ScoreGauge score={g('correctness_score','correctnessScore')} label="Correctness" color="#10b981" />
        <ScoreGauge score={g('efficiency_score','efficiencyScore')} label="Efficiency" color="#f59e0b" />
        <ScoreGauge score={g('communication_score','communicationScore')} label="Style" color="#3b82f6" />
      </div>
      <div className="cr-section">
        <h3><Clock size={16} /> Complexity</h3>
        <div className="cr-complexity-badges">
          <span className="cr-badge time">⏱ Time: {gs('time_complexity','timeComplexity') || 'N/A'}</span>
          <span className="cr-badge space">💾 Space: {gs('space_complexity','spaceComplexity') || 'N/A'}</span>
        </div>
        <p className="cr-analysis">{gs('complexity_analysis','complexityAnalysis')}</p>
      </div>
      {ga('optimization_suggestions','optimizationSuggestions').length > 0 && (
        <div className="cr-section">
          <h3><Zap size={16} /> Optimizations</h3>
          {ga('optimization_suggestions','optimizationSuggestions').map((s, i) => (
            <div key={i} className={`cr-suggestion cr-sev-${s.severity || 'medium'}`}>
              <div className="cr-suggestion-header"><span className={`cr-sev-badge ${s.severity}`}>{s.severity}</span><strong>{s.title}</strong></div>
              <p>{s.description}</p>
              {s.codeExample && <pre className="cr-code-example"><code>{s.codeExample}</code></pre>}
            </div>
          ))}
        </div>
      )}
      <div className="cr-section">
        <h3><Target size={16} /> Edge Cases</h3>
        <div className="cr-edge-cases">
          <div className="cr-ec-col"><h4><CheckCircle size={14} color="#10b981" /> Covered</h4>
            {(ec.found || []).map((e, i) => <span key={i} className="cr-ec-tag covered">{e}</span>)}
            {(ec.found || []).length === 0 && <span className="cr-ec-empty">None</span>}
          </div>
          <div className="cr-ec-col"><h4><AlertTriangle size={14} color="#f59e0b" /> Missing</h4>
            {(ec.missed || []).map((e, i) => <span key={i} className="cr-ec-tag missed">{e}</span>)}
          </div>
        </div>
      </div>
      {ga('patterns_identified','patternsIdentified').length > 0 && (
        <div className="cr-section"><h3><TrendingUp size={16} /> Patterns</h3>
          <div className="cr-patterns">{ga('patterns_identified','patternsIdentified').map((p, i) => <span key={i} className="cr-pattern-tag">{p}</span>)}</div>
        </div>
      )}
      {gs('refactoring_hints','refactoringHints') && (
        <div className="cr-section"><h3>🔧 Refactoring</h3><p className="cr-analysis">{gs('refactoring_hints','refactoringHints')}</p></div>
      )}
    </div>
  );
}

export default function AICodeReviewer() {
  const { theme } = useTheme();
  const [code, setCode] = useState(SAMPLE);
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const r = await fetch(api('/code-review/history'), { headers: buildAuthHeaders() });
      if (r.ok) setHistory(await r.json());
    } catch (e) { console.error(e); }
  };

  const submit = async () => {
    if (!code.trim()) return;
    setLoading(true); setError(''); setReview(null);
    try {
      const r = await fetch(api('/code-review/analyze'), {
        method: 'POST', headers: buildAuthHeaders(),
        body: JSON.stringify({ code, language }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Failed');
      setReview(await r.json());
      fetchHistory();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadItem = async (id) => {
    try {
      const r = await fetch(api(`/code-review/${id}`), { headers: buildAuthHeaders() });
      if (r.ok) { const d = await r.json(); setReview(d); setCode(d.submitted_code || ''); setLanguage(d.language || 'javascript'); setShowHistory(false); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="cr-container">
      <div className="cr-header">
        <div className="cr-header-left">
          <div className="cr-icon-wrap"><Code2 size={24} /></div>
          <div><h1 className="cr-title">AI Code Reviewer</h1><p className="cr-subtitle">AI feedback on complexity, style & edge cases</p></div>
        </div>
        <button className="cr-history-btn" onClick={() => setShowHistory(!showHistory)}><History size={18} /> History ({history.length})</button>
      </div>
      {showHistory && (
        <div className="cr-history-panel"><h3>Review History</h3>
          {history.length === 0 ? <p className="cr-empty">No reviews yet</p> : history.map(it => (
            <div key={it.id} className="cr-history-item" onClick={() => loadItem(it.id)}>
              <div className="cr-hi-left"><span className="cr-hi-lang">{it.language}</span><span className="cr-hi-problem">{it.problem_id || 'Freeform'}</span></div>
              <div className="cr-hi-right"><span className="cr-hi-score">{it.overall_score}/100</span><span className="cr-hi-date">{new Date(it.created_at).toLocaleDateString()}</span><ChevronRight size={14} /></div>
            </div>
          ))}
        </div>
      )}
      <div className="cr-main">
        <div className="cr-editor-panel">
          <div className="cr-editor-toolbar">
            <select value={language} onChange={e => setLanguage(e.target.value)} className="cr-lang-select">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <textarea ref={ref} className="cr-code-editor" value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); const s = e.target.selectionStart; setCode(code.substring(0, s) + '  ' + code.substring(e.target.selectionEnd)); setTimeout(() => { ref.current.selectionStart = ref.current.selectionEnd = s + 2; }, 0); }}}
            placeholder="Paste your code here..." spellCheck={false} />
          <div className="cr-editor-footer">
            <span className="cr-line-count">{code.split('\n').length} lines</span>
            <button className="cr-submit-btn" onClick={submit} disabled={loading || !code.trim()}>
              {loading ? <><div className="cr-spinner" /> Analyzing...</> : <><Play size={18} /> Analyze Code</>}
            </button>
          </div>
        </div>
        <div className="cr-results-panel">
          {error && <div className="cr-error"><AlertTriangle size={18} /> {error}</div>}
          {loading && <div className="cr-loading"><div className="cr-loading-pulse" /><p>AI is reviewing your code...</p></div>}
          {!loading && !review && !error && (
            <div className="cr-empty-state"><Code2 size={48} strokeWidth={1} /><h3>Ready to Review</h3><p>Paste your DSA solution and click "Analyze Code"</p></div>
          )}
          <ReviewResult review={review} />
        </div>
      </div>
    </div>
  );
}
