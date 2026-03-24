import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Lightbulb, X, GripVertical } from 'lucide-react';
import DSAToolbar from '../components/editor/DSAToolbar';
import ProblemDescriptionPanel from '../components/editor/ProblemDescriptionPanel';
import VisualizationPanel from '../components/editor/VisualizationPanel';
import TestCasePanel from '../components/editor/TestCasePanel';
import HintsPanel from '../components/solver/HintsPanel';
import { LANGUAGES, ALGORITHM_TEMPLATES, DATA_STRUCTURE_TEMPLATES, PATTERN_HINTS } from '../data/dsaTemplates';
import { getExamplesForProblem } from '../data/testCaseEngine';
import { PROBLEMS } from '../data/problemsDatabase';
import { registerAllThemes, getSavedTheme, saveTheme, EDITOR_THEMES } from '../data/editorThemes';
import { markProblemAsAttempted } from '../data/dsaLearningProgress';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// ─── Starter code per language ───
const STARTER_CODE = {
  python: (name) => `class Solution:
    def ${name || 'solve'}(self, nums):
        # Write your solution here
        pass`,
  javascript: (name) => `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function ${name || 'solve'}(nums) {
  // Write your solution here

}`,
  cpp: (name) => `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> ${name || 'solve'}(vector<int>& nums) {
        // Write your solution here

    }
};`,
  java: (name) => `import java.util.*;

class Solution {
    public int[] ${name || 'solve'}(int[] nums) {
        // Write your solution here

    }
}`,
  go: (name) => `package main

func ${name || 'solve'}(nums []int) []int {
    // Write your solution here

    return nil
}`,
};

// ─── Timer ───
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function DSACodeEditor() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const testCaseRef = useRef(null);

  // Problem state
  const [problem, setProblem] = useState(null);
  const [dbProblem, setDbProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('dsa-editor-lang') || 'python';
  });
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // UI state
  const [showHints, setShowHints] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [leftWidth, setLeftWidth] = useState(28);
  const [rightWidth, setRightWidth] = useState(30);
  const [bottomHeight, setBottomHeight] = useState(220);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [testResults, setTestResults] = useState(null);
  const [editorTheme, setEditorTheme] = useState(() => getSavedTheme('dsa-editor-theme'));
  const monacoRef = useRef(null);

  // ─── Resizing ───
  const draggingRef = useRef(null);

  const handleMouseDown = (panel) => (e) => {
    e.preventDefault();
    draggingRef.current = { panel, startX: e.clientX, startY: e.clientY, leftWidth, rightWidth, bottomHeight };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    const d = draggingRef.current;
    if (!d) return;
    const totalWidth = window.innerWidth;

    if (d.panel === 'left') {
      const dx = e.clientX - d.startX;
      const pct = (dx / totalWidth) * 100;
      setLeftWidth(Math.max(15, Math.min(45, d.leftWidth + pct)));
    } else if (d.panel === 'right') {
      const dx = d.startX - e.clientX;
      const pct = (dx / totalWidth) * 100;
      setRightWidth(Math.max(15, Math.min(45, d.rightWidth + pct)));
    } else if (d.panel === 'bottom') {
      const dy = d.startY - e.clientY;
      setBottomHeight(Math.max(100, Math.min(500, d.bottomHeight + dy)));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // ─── Timer ───
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  // ─── Fetch local problem defaults ───
  useEffect(() => {
    setLoading(true);
    // Try to find from local data first (supports numeric or string IDs)
    const numId = parseInt(problemId);
    const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const localProblem = PROBLEMS.find(p =>
      p && p.id != null && p.title && (
        p.id === numId ||
        p.id === problemId ||
        p.title.toLowerCase().replace(/\s+/g, '-') === problemId ||
        slugify(p.title) === problemId ||
        p.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') === problemId
      )
    );
    if (localProblem) {
      setProblem({
        ...localProblem,
        pattern_name: localProblem.pattern || localProblem.patterns?.[0]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '',
      });
      setLoading(false);
    } else {
      // Fallback: generate a stub problem from the URL slug
      const titleFromSlug = (problemId || 'two-sum')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setProblem({
        id: problemId || 'two-sum',
        title: titleFromSlug,
        difficulty: 'Medium',
        pattern_name: '',
        topics: [],
        patterns: [],
        description: `Solve the "${titleFromSlug}" problem.\n\nWrite an efficient solution and analyze its time and space complexity.`,
        examples: [
          { input: 'See problem description', output: 'Expected output' },
        ],
        constraints: 'See problem description for constraints.',
        companies: [],
        hints: ['Think about the most efficient approach', 'Consider edge cases'],
      });
      setLoading(false);
    }
  }, [problemId]);

  // ─── Fetch DB problem for examples/constraints ───
  useEffect(() => {
    if (problem && problem.id && !isNaN(parseInt(problem.id))) {
      fetch(`${API_URL}/api/dsa/problems/${problem.id}`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(data => { if (data.problem) setDbProblem(data.problem); })
        .catch(() => { });
    }
  }, [problem?.id]);

  // ─── Merge DB data into problem (examples, description, constraints) ───
  useEffect(() => {
    if (!dbProblem || !problem) return;
    const hasRealExamples = (ex) =>
      ex && Array.isArray(ex) && ex.length > 0 && ex[0].input &&
      !String(ex[0].input).toLowerCase().includes('see problem') &&
      !String(ex[0].input).toLowerCase().includes('see expected');

    const updates = {};
    if (hasRealExamples(dbProblem.examples)) {
      updates.examples = dbProblem.examples;
    } else {
      // Fallback: try comprehensive test cases from problemTestCases.js
      const rawSlug = (problemId && isNaN(parseInt(problemId))) ? problemId : (problem.title || '');
      const slug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const localExamples = getExamplesForProblem(slug);
      if (localExamples && localExamples.length > 0) {
        updates.examples = localExamples;
      } else {
        // Clear boilerplate examples if none exist in DB or local fallback
        updates.examples = [];
      }
    }
    if (dbProblem.description && !dbProblem.description.startsWith('Solve the ')) {
      updates.description = dbProblem.description;
    }
    
    if (dbProblem.constraints && dbProblem.constraints !== 'See problem description for constraints.' && dbProblem.constraints !== 'See problem constraints') {
      updates.constraints = dbProblem.constraints;
    } else if (!dbProblem.constraints) {
      updates.constraints = ''; // Clear boilerplate constraints if DB has none
    }

    if (Object.keys(updates).length > 0) {
      setProblem(prev => ({ ...prev, ...updates }));
    }
  }, [dbProblem]);

  // ─── Load saved code or starter code ───
  useEffect(() => {
    if (!problem) return;
    const saved = localStorage.getItem(`dsa-code-${problem.id}-${language}`);
    if (saved) {
      setCode(saved);
    } else {
      // Prefer DB starter code (has proper function signatures and params)
      const dbStarter = dbProblem?.starter_code?.[language];
      if (dbStarter) {
        setCode(dbStarter);
      } else {
        const funcName = problem.title
          ? problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
          : 'solve';
        setCode(STARTER_CODE[language]?.(funcName) || '');
      }
    }
  }, [problem, dbProblem, language]);

  // ─── Auto-save code ───
  useEffect(() => {
    if (!problem || !code) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(`dsa-code-${problem.id}-${language}`, code);
    }, 500);
    return () => clearTimeout(timeout);
  }, [code, problem, language]);

  // ─── Save language preference ───
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('dsa-editor-lang', lang);
  };

  // ─── Insert template ───
  const handleInsertTemplate = (template) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };
      editor.executeEdits('insert-template', [{
        range,
        text: '\n' + template + '\n',
      }]);
      editor.focus();
    } else {
      setCode(prev => prev + '\n\n' + template);
    }
  };

  // ─── Run code ───
  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutput(null);
    setFeedback(null);

    try {
      // Use /run endpoint with problemId for structured test case execution
      const res = await fetch(`${API_URL}/api/practice/run`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, language, problemId: problem?.id }),
      });
      const data = await res.json();

      if (data.testResults && Array.isArray(data.testResults)) {
        // Structured test results from backend
        const passed = data.passed || data.testResults.filter(r => r.passed).length;
        const total = data.total || data.testResults.length;
        setOutput({
          success: passed === total,
          output: data.testResults.map((r, i) =>
            `Test ${i + 1}: ${r.passed ? '✅ PASS' : '❌ FAIL'}${!r.passed ? `\n  Expected: ${JSON.stringify(r.expected)}\n  Got: ${JSON.stringify(r.actual)}` : ''}`
          ).join('\n'),
          message: passed === total ? `All ${total} test cases passed!` : `${passed}/${total} test cases passed`,
          executionTime: data.executionTime ? `${Math.round(data.executionTime)}ms` : undefined,
        });
      } else {
        // Fallback: raw execution result
        const actualOutput = (data.output || '').trim();
        const errorMsg = (data.error || '').trim();
        setOutput({
          success: data.success,
          output: actualOutput || errorMsg || '',
          message: data.success
            ? (actualOutput ? 'Executed Successfully' : 'No output produced')
            : `Error: ${errorMsg || 'Unknown error'}`,
          executionTime: data.executionTime ? `${Math.round(data.executionTime)}ms` : undefined,
        });
      }
      // Also trigger test case panel execution
      testCaseRef.current?.runTests?.();
    } catch (err) {
      setOutput({
        success: false,
        output: '',
        message: `Network error: ${err.message}`,
      });
    } finally {
      setRunning(false);
    }
  }, [code, language, problem]);

  // ─── Submit code ───
  const handleSubmit = useCallback(async () => {
    setRunning(true);
    setOutput(null);
    setFeedback(null);

    try {
      const res = await fetch(`${API_URL}/api/practice/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ problemId: problem?.id, code, language }),
      });

      if (res.status === 401) {
        // Fall back to execute for guests who can't fully submit
        const execRes = await fetch(`${API_URL}/api/practice/execute`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ code, language, input: '' }),
        });
        const execData = await execRes.json();
        const execOutput = (execData.output || '').trim();
        const execError = (execData.error || '').trim();
        setOutput({
          success: execData.success,
          output: execOutput || execError || '',
          message: execData.success
            ? 'Code executed (sign in to submit and track progress)'
            : `Error: ${execError || 'Unknown error'}`,
        });
        setRunning(false);
        return;
      }

      const data = await res.json();
      const accepted = data.submission?.status === 'accepted';
      setOutput({
        success: accepted,
        submission: data.submission ? {
          status: data.submission.status,
          runtime: `${data.submission.test_cases_passed}/${data.submission.total_test_cases} passed`,
        } : undefined,
        message: data.message || (accepted ? 'Accepted!' : 'Wrong Answer'),
      });

      if (accepted) {
        setFeedback({
          timeComplexity: 'Submitted',
          spaceComplexity: 'Submitted',
          suggestions: 'Solution accepted! All test cases passed.',
        });
        setTimerActive(false);
        if (problem?.id) markProblemAsAttempted(problem.id, true);
      }
    } catch (err) {
      setOutput({
        success: false,
        output: '',
        message: `Network error: ${err.message}`,
      });
    } finally {
      setRunning(false);
    }
  }, [code, language, problem]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleRun();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setShowHints(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleSubmit]);

  // ─── Detect pattern from problem ───
  const detectedPattern = problem?.pattern_name || null;

  // ─── Monaco editor setup ───
  const handleBeforeMount = (monaco) => {
    registerAllThemes(monaco);
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleRun(),
    });
  };

  // ─── Theme change handler ───
  const handleThemeChange = (themeId) => {
    setEditorTheme(themeId);
    saveTheme(themeId, 'dsa-editor-theme');
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(themeId);
    }
  };

  const langInfo = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a1a', color: '#c084fc',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(139,92,246,0.2)',
            borderTopColor: '#8b5cf6', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: 13, fontWeight: 600 }}>Loading editor...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0a0a1a', overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Top Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'rgba(10,10,26,0.98)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {/* Back button */}
        <button onClick={() => navigate('/problems')} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px',
          height: 48, cursor: 'pointer',
          background: 'none', border: 'none', borderRight: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          <ArrowLeft size={14} /> Problems
        </button>

        <div style={{ flex: 1 }}>
          <DSAToolbar
            language={language}
            onLanguageChange={handleLanguageChange}
            onRun={handleRun}
            onSubmit={handleSubmit}
            onInsertTemplate={handleInsertTemplate}
            running={running}
            timer={formatTime(timer)}
            onToggleFocus={() => setFocusMode(f => !f)}
            focusMode={focusMode}
            editorTheme={editorTheme}
            onThemeChange={handleThemeChange}
          />
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left: Problem Description */}
        {!focusMode && (
          <>
            <div style={{
              width: `${leftWidth}%`, minWidth: 200, overflow: 'hidden',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
            }}>
              <ProblemDescriptionPanel
                problem={problem}
                problemId={problemId}
                onShowHints={() => setShowHints(s => !s)}
                showHints={showHints}
                allProblems={PROBLEMS}
                navigate={navigate}
              />
            </div>

            {/* Left resize handle */}
            <div
              onMouseDown={handleMouseDown('left')}
              style={{
                width: 5, cursor: 'col-resize', zIndex: 10,
                background: 'transparent', flexShrink: 0,
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 3, height: 30, borderRadius: 2,
                background: 'rgba(255,255,255,0.06)',
                transition: 'background 0.2s',
              }} />
            </div>
          </>
        )}

        {/* Center: Code Editor + Test Cases */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', minWidth: 300,
        }}>
          {/* Editor */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <Editor
              height="100%"
              language={langInfo.monacoId}
              value={code}
              onChange={val => setCode(val || '')}
              beforeMount={handleBeforeMount}
              onMount={handleEditorMount}
              theme={editorTheme}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                padding: { top: 16 },
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                folding: true,
                wordWrap: 'on',
                suggestOnTriggerCharacters: true,
                tabSize: 4,
                detectIndentation: true,
              }}
            />


          </div>

          {/* Bottom: Test Cases */}
          <div
            style={{
              height: bottomHeight, flexShrink: 0,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
            }}
          >
            {/* Bottom resize handle */}
            <div
              onMouseDown={handleMouseDown('bottom')}
              style={{
                position: 'absolute', top: -3, left: 0, right: 0,
                height: 6, cursor: 'row-resize', zIndex: 10,
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: '50%',
                transform: 'translateX(-50%)',
                width: 30, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.06)',
              }} />
            </div>
            <TestCasePanel
              ref={testCaseRef}
              code={code}
              language={language}
              problemId={problemId}
              problemDescription={problem?.description}
              problemExamples={problem?.examples}
              onTestResults={setTestResults}
            />
          </div>
        </div>

        {/* Right resize handle */}
        {!focusMode && (
          <div
            onMouseDown={handleMouseDown('right')}
            style={{
              width: 5, cursor: 'col-resize', zIndex: 10,
              background: 'transparent', flexShrink: 0,
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 3, height: 30, borderRadius: 2,
              background: 'rgba(255,255,255,0.06)',
            }} />
          </div>
        )}

        {/* Right: Visualization / Output Panel */}
        {!focusMode && (
          <div style={{
            width: `${rightWidth}%`, minWidth: 200, overflow: 'hidden',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}>
            <VisualizationPanel
              output={output}
              feedback={feedback}
            />
          </div>
        )}

        {/* AI Hints Overlay */}
        {showHints && (
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 380, zIndex: 50,
            background: 'rgba(10,10,26,0.98)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.25s ease-out',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{
                fontSize: 13, fontWeight: 800, color: '#fbbf24',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Lightbulb size={15} /> AI Assistant
              </span>
              <button onClick={() => setShowHints(false)} style={{
                width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <HintsPanel
                problemId={problemId}
                code={code}
                language={language}
                patternName={detectedPattern}
                onInsertTemplate={handleInsertTemplate}
              />
            </div>
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
