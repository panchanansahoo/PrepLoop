import React, { useState } from 'react';
import { Bug, Send, Copy, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const LANGS = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go'];

const SAMPLE_CODE = `function findMax(arr) {
  let max = 0;
  for (let i = 1; i <= arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}`;
const SAMPLE_ERROR = `Returns undefined for the last element`;

export default function BugDebugger() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  const codeBg = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)';

  const debug = async () => {
    if (!code.trim()) { setError('Paste your code first.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const data = await apiFetch.post('/api/bug-debugger/debug', { code, errorMessage: errorMsg, language });
      setResult(data);
    } catch { setError('Debug failed. Try again.'); }
    finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(result?.fixedCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#ef4444,#f97316)', display: 'grid', placeItems: 'center' }}>
            <Bug size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Bug Debugger</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Paste failing code → get plain English explanation + fix</p>
          </div>
        </div>

        <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 16 }}>
          {/* Language */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {LANGS.map(l => (
              <button key={l} onClick={() => setLanguage(l)} style={{ padding: '6px 14px', borderRadius: 10, border, background: language === l ? 'linear-gradient(135deg,#ef4444,#f97316)' : card, color: language === l ? 'white' : text, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{l}</button>
            ))}
            <button onClick={() => { setCode(SAMPLE_CODE); setErrorMsg(SAMPLE_ERROR); }} style={{ marginLeft: 'auto', fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Load Example</button>
          </div>

          {/* Code input */}
          <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 6 }}>BUGGY CODE</p>
          <textarea value={code} onChange={e => setCode(e.target.value)} placeholder={`Paste your ${language} code with the bug...`} rows={10}
            style={{ width: '100%', background: codeBg, border, borderRadius: 12, padding: '12px 16px', color: text, fontSize: 12, fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 14 }} />

          {/* Error message */}
          <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 6 }}>ERROR MESSAGE <span style={{ fontWeight: 400 }}>(optional)</span></p>
          <input value={errorMsg} onChange={e => setErrorMsg(e.target.value)} placeholder="e.g. TypeError: Cannot read property 'x' of undefined, or describe the wrong behavior..."
            style={{ width: '100%', background: codeBg, border, borderRadius: 12, padding: '12px 16px', color: text, fontSize: 13, boxSizing: 'border-box', marginBottom: 14 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
            <button onClick={debug} disabled={loading} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#ef4444,#f97316)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              <Send size={15} /> {loading ? 'Debugging...' : 'Debug It'}
            </button>
          </div>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Bug summary */}
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>🐛 THE BUG</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{result.bugSummary}</p>
            </div>

            {/* Root cause */}
            <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>ROOT CAUSE</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{result.rootCause}</p>
            </div>

            {/* Fixed code */}
            {result.fixedCode && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', margin: 0 }}>✅ FIXED CODE</p>
                  <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: copied ? '#22c55e' : '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre style={{ margin: 0, background: codeBg, borderRadius: 10, padding: '14px', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6, overflowX: 'auto', color: text }}>{result.fixedCode}</pre>
              </div>
            )}

            {/* Explanation */}
            {result.explanation && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>WHAT CHANGED & WHY</p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{result.explanation}</p>
              </div>
            )}

            {/* Lesson */}
            {result.lesson && (
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#818cf8' }}>📚 <strong>Lesson:</strong> {result.lesson}</p>
              </div>
            )}

            {/* Similar bugs */}
            {result.similarBugs?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 14, padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>SIMILAR BUGS TO WATCH FOR</p>
                {result.similarBugs.map((b, i) => <p key={i} style={{ margin: '0 0 4px', fontSize: 13, color: muted }}>• {b}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
