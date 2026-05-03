import React, { useState } from 'react';
import { ArrowRightLeft, Send, Copy, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const LANGS = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust', 'kotlin'];

const SAMPLE = `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`;

export default function CodeTranslator() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [code, setCode] = useState('');
  const [fromLang, setFromLang] = useState('javascript');
  const [toLang, setToLang] = useState('python');
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

  const swap = () => { setFromLang(toLang); setToLang(fromLang); setResult(null); };

  const translate = async () => {
    if (!code.trim()) { setError('Paste some code first.'); return; }
    if (fromLang === toLang) { setError('Source and target must differ.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const data = await apiFetch.post('/api/code-translator/translate', { code, fromLang, toLang });
      setResult(data);
    } catch { setError('Translation failed. Try again.'); }
    finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(result?.translatedCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const LangSelect = ({ value, onChange, label }) => (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6 }}>{label}</p>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', background: codeBg, border, borderRadius: 10, padding: '10px 12px', color: text, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#06b6d4,#a855f7)', display: 'grid', placeItems: 'center' }}>
            <ArrowRightLeft size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Code Translator</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Convert solutions between programming languages instantly</p>
          </div>
        </div>

        {/* Language selector row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
          <LangSelect value={fromLang} onChange={v => { setFromLang(v); setResult(null); }} label="FROM" />
          <button onClick={swap} style={{ padding: '10px 14px', borderRadius: 10, border, background: card, color: text, cursor: 'pointer', marginBottom: 0, flexShrink: 0 }}>
            <ArrowRightLeft size={16} />
          </button>
          <LangSelect value={toLang} onChange={v => { setToLang(v); setResult(null); }} label="TO" />
        </div>

        {/* Editor row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: card, border, borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: muted }}>{fromLang.toUpperCase()}</span>
              <button onClick={() => setCode(SAMPLE)} style={{ fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Load Example</button>
            </div>
            <textarea value={code} onChange={e => setCode(e.target.value)} placeholder={`Paste your ${fromLang} code here...`} rows={14}
              style={{ width: '100%', background: codeBg, border, borderRadius: 10, padding: '12px', color: text, fontSize: 12, fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
          </div>

          <div style={{ background: card, border, borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: muted }}>{toLang.toUpperCase()}</span>
              {result?.translatedCode && (
                <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: copied ? '#22c55e' : '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div style={{ background: codeBg, border, borderRadius: 10, padding: '12px', minHeight: 240, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, color: result ? text : muted, whiteSpace: 'pre-wrap', overflowY: 'auto' }}>
              {loading ? 'Translating...' : result?.translatedCode || `Translated ${toLang} code will appear here...`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
          <button onClick={translate} disabled={loading} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#06b6d4,#a855f7)', color: 'white', border: 'none', borderRadius: 12, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            <Send size={15} /> {loading ? 'Translating...' : 'Translate'}
          </button>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.notes?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 14, padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>📝 TRANSLATION NOTES</p>
                {result.notes.map((n, i) => <p key={i} style={{ margin: '0 0 4px', fontSize: 13, color: muted }}>• {n}</p>)}
              </div>
            )}
            {result.warnings?.length > 0 && (
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>⚠️ WARNINGS</p>
                {result.warnings.map((w, i) => <p key={i} style={{ margin: '0 0 4px', fontSize: 13, color: muted }}>• {w}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
