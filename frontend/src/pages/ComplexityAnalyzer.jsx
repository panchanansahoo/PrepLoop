import React, { useState } from 'react';
import { Zap, Send, Clock, Database, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go'];

const EXAMPLES = {
  javascript: `function twoSum(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map[complement] !== undefined) return [map[complement], i];
    map[nums[i]] = i;
  }
}`,
  python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr`,
};

const complexityColor = c => {
  if (!c) return '#94a3b8';
  if (c.includes('1)') || c.includes('log')) return '#22c55e';
  if (c.includes('n)') && !c.includes('²') && !c.includes('2)')) return '#6366f1';
  if (c.includes('n log') || c.includes('n²') || c.includes('n^2')) return '#f59e0b';
  return '#ef4444';
};

export default function ComplexityAnalyzer() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  const codeBg = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)';

  const analyze = async () => {
    if (!code.trim() || code.trim().length < 10) { setError('Please enter some code first.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch.post('/api/complexity/analyze', { code, language });
      setResult(data);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'grid', placeItems: 'center' }}>
            <Zap size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Complexity Analyzer</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Paste your code → get Big-O time & space analysis</p>
          </div>
        </div>

        {/* Language + Example */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {LANGUAGES.map(l => (
            <button key={l} onClick={() => setLanguage(l)}
              style={{ padding: '6px 14px', borderRadius: 10, border, background: language === l ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : card, color: language === l ? 'white' : text, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              {l}
            </button>
          ))}
          {EXAMPLES[language] && (
            <button onClick={() => setCode(EXAMPLES[language])}
              style={{ padding: '6px 14px', borderRadius: 10, border, background: card, color: muted, fontWeight: 600, fontSize: 12, cursor: 'pointer', marginLeft: 'auto' }}>
              Load Example
            </button>
          )}
        </div>

        {/* Code input */}
        <div style={{ background: card, border, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={`Paste your ${language} code here...`}
            rows={12}
            style={{ width: '100%', background: codeBg, border, borderRadius: 12, padding: '14px 16px', color: text, fontSize: 13, fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={analyze} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                <Send size={15} /> {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Big-O badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
              {[
                { label: 'Time Complexity', value: result.timeComplexity, icon: <Clock size={18} />, color: complexityColor(result.timeComplexity) },
                { label: 'Space Complexity', value: result.spaceComplexity, icon: <Database size={18} />, color: complexityColor(result.spaceComplexity) },
                { label: 'Worst Case', value: result.worstCase || result.timeComplexity, icon: <TrendingUp size={18} />, color: '#ef4444' },
                { label: 'Best Case', value: result.bestCase || result.timeComplexity, icon: <TrendingUp size={18} />, color: '#22c55e' },
              ].map(item => (
                <div key={item.label} style={{ background: card, border, borderRadius: 16, padding: 20, textAlign: 'center' }}>
                  <div style={{ color: item.color, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: item.color, fontFamily: 'monospace' }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: muted, fontWeight: 600, marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>EXPLANATION</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{result.explanation}</p>
            </div>

            {/* Loop breakdown */}
            {result.loops?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 12 }}>LOOP / RECURSION BREAKDOWN</p>
                {result.loops.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', minWidth: 24 }}>#{i + 1}</span>
                    <p style={{ margin: 0, fontSize: 13, color: muted }}>{l}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions?.length > 0 && (
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 12 }}>💡 OPTIMIZATION SUGGESTIONS</p>
                {result.suggestions.map((s, i) => (
                  <p key={i} style={{ margin: '0 0 6px', fontSize: 13, color: text }}>• {s}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
