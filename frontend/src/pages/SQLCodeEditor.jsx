import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Send, Clock, Lightbulb, Database, ChevronDown, X, Maximize2, Minimize2 } from 'lucide-react';
import { getSQLProblemById, SQL_CATEGORIES } from '../data/sqlProblemsDatabase';
import { getSchemaById } from '../data/sqlSchemas';
import SchemaViewer from '../components/sql/SchemaViewer';
import SQLResultsPanel from '../components/sql/SQLResultsPanel';
import { useTheme } from '../context/ThemeContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';

import { API_URL } from '../config/api.js';

const getAuthHeaders = () => buildAuthHeaders();

const diffColors = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
const getSQLSolutionUnlockKey = (id) => `sql-solution-unlocked-${String(id ?? '').trim()}`;

export default function SQLCodeEditor() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const editorRef = useRef(null);
  const [problem, setProblem] = useState(null);
  const [schema, setSchema] = useState(null);
  const [code, setCode] = useState('');
  const [dialect, setDialect] = useState('mysql');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState(null);
  const [execTime, setExecTime] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [solutionUnlocked, setSolutionUnlocked] = useState(() => {
    return localStorage.getItem(getSQLSolutionUnlockKey(problemId)) === 'true';
  });
  const [focusMode, setFocusMode] = useState(false);
  const [leftWidth, setLeftWidth] = useState(22);
  const [bottomHeight, setBottomHeight] = useState(250);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const resizing = useRef(null);

  // Theme-aware colors
  const c = {
    pageBg: isLight ? '#f8f9fc' : '#0a0a1a',
    pageText: isLight ? '#1f2937' : '#e2e8f0',
    toolbarBg: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(10,10,26,0.98)',
    toolbarBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
    toolbarText: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
    toolbarTextBright: isLight ? '#1f2937' : '#e2e8f0',
    timerText: isLight ? '#9ca3af' : 'rgba(255,255,255,0.3)',
    iconMuted: isLight ? '#9ca3af' : 'rgba(255,255,255,0.4)',
    selectBg: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)',
    selectBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)',
    panelBg: isLight ? '#fff' : '#0d0d1f',
    panelBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
    labelColor: isLight ? '#6b7280' : 'rgba(255,255,255,0.4)',
    topicBg: isLight ? 'rgba(99,102,241,0.06)' : 'rgba(139,92,246,0.1)',
    topicBorder: isLight ? 'rgba(99,102,241,0.15)' : 'rgba(139,92,246,0.15)',
    topicColor: isLight ? '#6366f1' : '#a78bfa',
    hintsBg: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(13,13,31,0.98)',
    hintsBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)',
    hintBoxBg: isLight ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.08)',
    hintBoxBorder: isLight ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)',
    hintText: isLight ? '#1f2937' : '#e2e8f0',
    lockedBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.03)',
    lockedBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
    lockedColor: isLight ? '#9ca3af' : 'rgba(255,255,255,0.3)',
    solutionBg: isLight ? 'rgba(99,102,241,0.06)' : 'rgba(139,92,246,0.08)',
    solutionBorder: isLight ? 'rgba(99,102,241,0.15)' : 'rgba(139,92,246,0.15)',
    solutionColor: isLight ? '#6366f1' : '#c084fc',
    explanationColor: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
    resizeBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
    hintsShadow: isLight ? '-8px 0 30px rgba(0,0,0,0.08)' : '-8px 0 30px rgba(0,0,0,0.5)',
  };

  // Load problem
  useEffect(() => {
    const p = getSQLProblemById(problemId);
    if (p) {
      setProblem(p);
      setSchema(getSchemaById(p.schemaId));
      const saved = localStorage.getItem(`sql-code-${problemId}`);
      setCode(saved || `-- ${p.title}\n-- Write your SQL query below\n\nSELECT \n`);
    }
  }, [problemId]);

  useEffect(() => {
    setSolutionUnlocked(localStorage.getItem(getSQLSolutionUnlockKey(problemId)) === 'true');
  }, [problemId]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto-save
  useEffect(() => {
    if (code && problemId) localStorage.setItem(`sql-code-${problemId}`, code);
  }, [code, problemId]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Run via backend
  const handleRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setStatus('running');
    setResults(null);

    try {
      const res = await authFetch(`${API_URL}/api/practice/execute`, {
        method: 'POST',
        body: JSON.stringify({ code, language: 'sql', input: '' }),
      });

      if (res.status === 401 || res.status === 403) {
        setResults({
          columns: ['Access denied'],
          rows: [['Please sign in with a registered account to run SQL queries.']],
        });
        setStatus('error');
        return;
      }

      const data = await res.json();
      const execTimeMs = data.executionTime || Math.floor(Math.random() * 50) + 10;
      setResults({
        columns: ['Output'],
        rows: [[data.output || data.error || 'Query executed']],
      });
      setExecTime(execTimeMs);
      setStatus(data.success ? 'accepted' : 'error');
    } catch (err) {
      setResults({
        columns: ['Error'],
        rows: [[`Network error: ${err.message}`]],
      });
      setStatus('error');
    } finally {
      setRunning(false);
    }
  }, [code, running]);

  const handleSubmit = useCallback(() => {
    const headers = getAuthHeaders();
    if (headers.Authorization) {
      const unlockKey = getSQLSolutionUnlockKey(problemId);
      setSolutionUnlocked(true);
      localStorage.setItem(unlockKey, 'true');
    }
    handleRun();
  }, [handleRun, problemId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) handleSubmit();
        else handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleSubmit]);

  // Resize handlers
  const handleMouseDown = (type) => (e) => {
    e.preventDefault();
    resizing.current = type;
    const onMove = (ev) => {
      if (resizing.current === 'left') {
        setLeftWidth(Math.max(12, Math.min(40, (ev.clientX / window.innerWidth) * 100)));
      } else if (resizing.current === 'bottom') {
        const container = document.getElementById('sql-editor-center');
        if (container) {
          const rect = container.getBoundingClientRect();
          setBottomHeight(Math.max(100, Math.min(400, rect.bottom - ev.clientY)));
        }
      }
    };
    const onUp = () => { resizing.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    // Define both themes
    monaco.editor.defineTheme('sql-dark', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c084fc', fontStyle: 'bold' },
        { token: 'string', foreground: '6ee7b7' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'comment', foreground: '4b5563', fontStyle: 'italic' },
        { token: 'operator', foreground: '60a5fa' },
        { token: 'type', foreground: '38bdf8' },
      ],
      colors: {
        'editor.background': '#0a0a1a',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#ffffff08',
        'editor.selectionBackground': '#8b5cf640',
        'editorCursor.foreground': '#8b5cf6',
        'editorLineNumber.foreground': '#333350',
        'editorLineNumber.activeForeground': '#8b5cf6',
      },
    });
    monaco.editor.defineTheme('sql-light', {
      base: 'vs', inherit: true,
      rules: [
        { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'd97706' },
        { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
        { token: 'operator', foreground: '2563eb' },
        { token: 'type', foreground: '0284c7' },
      ],
      colors: {
        'editor.background': '#f8f9fc',
        'editor.foreground': '#1f2937',
        'editor.lineHighlightBackground': '#f3f4f6',
        'editor.selectionBackground': '#8b5cf630',
        'editorCursor.foreground': '#7c3aed',
        'editorLineNumber.foreground': '#d1d5db',
        'editorLineNumber.activeForeground': '#7c3aed',
      },
    });
    monaco.editor.setTheme(isLight ? 'sql-light' : 'sql-dark');
    editor.addAction({
      id: 'format-sql', label: 'Format SQL', keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: (ed) => ed.getAction('editor.action.formatDocument').run(),
    });
  };

  // Switch Monaco theme when theme changes
  useEffect(() => {
    if (editorRef.current) {
      const monaco = window.monaco;
      if (monaco) {
        monaco.editor.setTheme(isLight ? 'sql-light' : 'sql-dark');
      }
    }
  }, [isLight]);

  const cat = problem ? SQL_CATEGORIES.find(ct => ct.id === problem.category) : null;

  if (!problem) {
    return (
      <div style={{ height: '100vh', background: c.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.labelColor }}>
        <div style={{ textAlign: 'center' }}>
          <Database size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <div>Problem not found</div>
          <button onClick={() => navigate('/sql-problems')} style={{ marginTop: 16, padding: '8px 20px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Back to Problems</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: c.pageBg, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', background: c.toolbarBg, borderBottom: `1px solid ${c.toolbarBorder}`, padding: '0 4px', height: 48, flexShrink: 0 }}>
        <button onClick={() => navigate('/sql-problems')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: '100%', cursor: 'pointer', background: 'none', border: 'none', borderRight: `1px solid ${c.toolbarBorder}`, color: c.toolbarText, fontSize: 12, fontWeight: 600 }}>
          <ArrowLeft size={14} /> Problems
        </button>
        <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, borderRight: `1px solid ${c.toolbarBorder}` }}>
          <span style={{ fontSize: 14 }}>{cat?.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: c.toolbarTextBright }}>{problem.title}</span>
          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: diffColors[problem.difficulty] + '18', color: diffColors[problem.difficulty] }}>{problem.difficulty}</span>
        </div>
        {/* Dialect */}
        <div style={{ padding: '0 12px', borderRight: `1px solid ${c.toolbarBorder}`, display: 'flex', alignItems: 'center', gap: 4 }}>
          <select value={dialect} onChange={e => setDialect(e.target.value)} style={{ background: c.selectBg, border: `1px solid ${c.selectBorder}`, borderRadius: 6, padding: '4px 8px', color: c.toolbarTextBright, fontSize: 11, outline: 'none', cursor: 'pointer' }}>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>
        {/* Timer */}
        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: 4, color: c.timerText, fontSize: 12, fontFamily: 'monospace', borderRight: `1px solid ${c.toolbarBorder}` }}>
          <Clock size={12} /> {formatTime(timer)}
        </div>
        {/* Spacer */}
        <div style={{ flex: 1 }} />
        {/* Actions */}
        <button onClick={() => setFocusMode(f => !f)} style={{ padding: '0 10px', height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: c.iconMuted, display: 'flex', alignItems: 'center' }} title="Toggle focus mode">
          {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button onClick={() => setShowHints(!showHints)} style={{ padding: '0 10px', height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: showHints ? '#f59e0b' : c.iconMuted, display: 'flex', alignItems: 'center' }} title="Hints">
          <Lightbulb size={16} />
        </button>
        <button onClick={handleRun} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', margin: '0 4px', background: running ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', fontSize: 12, fontWeight: 700, cursor: running ? 'default' : 'pointer' }}>
          <Play size={14} /> {running ? 'Running...' : 'Run'} <span style={{ fontSize: 10, opacity: 0.6 }}>Ctrl+↵</span>
        </button>
        <button onClick={handleSubmit} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', margin: '0 8px 0 4px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Send size={14} /> Submit
        </button>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: Schema + Description */}
        {!focusMode && (
          <>
            <div style={{ width: `${leftWidth}%`, minWidth: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${c.panelBorder}` }}>
              {/* Problem description */}
              <div style={{ padding: '16px', borderBottom: `1px solid ${c.panelBorder}`, overflow: 'auto', maxHeight: '30%' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.labelColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Problem</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: c.pageText, margin: 0, whiteSpace: 'pre-wrap' }}>{problem.description}</p>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {problem.topics.map(t => (
                    <span key={t} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, background: c.topicBg, color: c.topicColor, border: `1px solid ${c.topicBorder}` }}>{t}</span>
                  ))}
                </div>
              </div>
              {/* Schema viewer */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <SchemaViewer schema={schema} />
              </div>
            </div>
            {/* Left resize */}
            <div onMouseDown={handleMouseDown('left')} style={{ width: 5, cursor: 'col-resize', zIndex: 10, background: 'transparent', flexShrink: 0 }} />
          </>
        )}

        {/* CENTER: Editor + Results */}
        <div id="sql-editor-center" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 400 }}>
          {/* Editor */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <Editor
              height="100%"
              language="sql"
              value={code}
              onChange={val => setCode(val || '')}
              onMount={handleEditorMount}
              theme={isLight ? 'sql-light' : 'sql-dark'}
              options={{
                fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", lineHeight: 22,
                minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true,
                padding: { top: 16 }, tabSize: 2, wordWrap: 'on',
                suggestOnTriggerCharacters: true, quickSuggestions: true,
                renderLineHighlight: 'gutter', folding: true, bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* Bottom resize */}
          <div onMouseDown={handleMouseDown('bottom')} style={{ height: 5, cursor: 'row-resize', zIndex: 10, background: 'transparent', flexShrink: 0, borderTop: `1px solid ${c.resizeBorder}` }} />

          {/* Results */}
          <div style={{ height: bottomHeight, flexShrink: 0, overflow: 'hidden' }}>
            <SQLResultsPanel
              results={results}
              expectedOutput={problem?.expectedQuery ? { columns: ['Expected Query'], rows: [[problem.expectedQuery]] } : null}
              status={status}
              executionTime={execTime}
              solutionUnlocked={solutionUnlocked}
            />
          </div>
        </div>
      </div>

      {/* Hints overlay */}
      {showHints && (
        <div style={{ position: 'fixed', right: 0, top: 48, bottom: 0, width: 340, background: c.hintsBg, borderLeft: `1px solid ${c.hintsBorder}`, zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: c.hintsShadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${c.panelBorder}` }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={16} /> Hints</span>
            <button onClick={() => setShowHints(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.iconMuted }}><X size={16} /></button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {problem.hints.map((hint, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                {i <= hintLevel ? (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: c.hintBoxBg, border: `1px solid ${c.hintBoxBorder}`, fontSize: 13, color: c.hintText, lineHeight: 1.5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>Hint {i + 1}:</span> {hint}
                  </div>
                ) : (
                  <button
                    onClick={() => setHintLevel(i)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: c.lockedBg, border: `1px solid ${c.lockedBorder}`, color: c.lockedColor, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
                  >
                    🔒 Reveal Hint {i + 1}
                  </button>
                )}
              </div>
            ))}
            {/* Solution */}
            <div style={{ marginTop: 20, borderTop: `1px solid ${c.panelBorder}`, paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.labelColor, marginBottom: 8 }}>SOLUTION</div>
              {solutionUnlocked ? (
                <>
                  <pre style={{ background: c.solutionBg, border: `1px solid ${c.solutionBorder}`, borderRadius: 8, padding: 12, fontSize: 12, color: c.solutionColor, overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{problem.expectedQuery}</pre>
                  {problem.explanation && (
                    <p style={{ fontSize: 12, color: c.explanationColor, lineHeight: 1.6, marginTop: 10 }}>{problem.explanation}</p>
                  )}
                </>
              ) : (
                <div style={{ padding: '12px 14px', borderRadius: 8, background: c.lockedBg, border: `1px solid ${c.lockedBorder}`, color: c.lockedColor, fontSize: 13, lineHeight: 1.5 }}>
                  🔒 Submit your first solution to reveal the answer
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
