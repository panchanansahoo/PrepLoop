import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonacoWrapper } from '../components/CodeEditor/MonacoWrapper';
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
import { buildAuthHeaders } from '../utils/authHeaders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => buildAuthHeaders();

const getSolutionUnlockKey = (id) => `dsa-solution-unlocked-${String(id ?? '').trim()}`;

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
  const [solutionUnlocked, setSolutionUnlocked] = useState(() => {
    return localStorage.getItem(getSolutionUnlockKey(problemId)) === 'true';
  });

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
        description: `Given the input for ${titleFromSlug}, write a solution that computes the required result.\n\nReturn the answer in the format shown in the examples.\n\nYour solution should handle edge cases and be efficient for large inputs.`,
        explanation: `Approach this problem step by step: define the core state, handle edge cases, and validate time-space tradeoffs before finalizing the implementation.`,
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

  useEffect(() => {
    setSolutionUnlocked(localStorage.getItem(getSolutionUnlockKey(problemId)) === 'true');
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

  // ─── Merge DB data into problem (examples, description, explanation, constraints) ───
  useEffect(() => {
    if (!dbProblem || !problem) return;
    const buildLeetCodeStyleDescription = () => {
      const title = String(problem.title || 'the problem').trim();
      const topic = Array.isArray(problem.topics) && problem.topics.length > 0
        ? String(problem.topics[0]).trim().toLowerCase()
        : 'algorithm';
      return [
        `Given the input for ${title}, write a ${topic} solution that computes the required result.`,
        'Return the answer in the format shown in the examples.',
        'Your solution should handle edge cases and be efficient for large inputs.',
      ].join('\n\n');
    };

    const hasPlaceholderText = (value) => {
      const text = String(value || '').toLowerCase();
      return text.includes('see problem') || text.includes('see expected') || text.includes('see constraints') || text.includes('sample input') || text.includes('sample output');
    };

    const isGenericDescription = (value) => {
      const text = String(value || '').trim().toLowerCase();
      return !text || text.startsWith('solve the ') || (text.includes('using the ') && text.includes(' pattern.'));
    };

    const buildDefaultExamples = () => {
      const topicSet = new Set((problem.topics || []).map((t) => String(t).toLowerCase()));

      if (topicSet.has('linked list')) return [{ input: 'head = [1,2,3,4]', output: '[1,2,3,4]' }, { input: 'head = [5,1,8]', output: '[5,1,8]' }];
      if (topicSet.has('trees') || topicSet.has('tree')) return [{ input: 'root = [1,2,3,null,4]', output: 'true' }, { input: 'root = [3,9,20,null,null,15,7]', output: '3' }];
      if (topicSet.has('strings') || topicSet.has('string')) return [{ input: 's = "abcabcbb"', output: '3' }, { input: 's = "bbbbb"', output: '1' }];
      if (topicSet.has('graphs') || topicSet.has('graph')) return [{ input: 'n = 4, edges = [[0,1],[1,2],[2,3]]', output: 'true' }, { input: 'n = 4, edges = [[0,1],[2,3]]', output: 'false' }];
      if (topicSet.has('matrix')) return [{ input: 'matrix = [[1,2],[3,4]]', output: '[[1,3],[2,4]]' }, { input: 'matrix = [[1,0],[0,1]]', output: '2' }];

      return [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }, { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }];
    };

    const stringifyValue = (value) => {
      if (typeof value === 'string') return value;
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };

    const normalizeExamples = (examples) => {
      const list = Array.isArray(examples) ? examples : [];
      const defaultExamples = buildDefaultExamples();
      const cleaned = list.map((example) => ({
        input: (() => {
          const value = String(example?.input || '').trim();
          return value && !hasPlaceholderText(value) ? value : defaultExamples[0].input;
        })(),
        output: (() => {
          const value = String(example?.output || '').trim();
          return value && !hasPlaceholderText(value) ? value : defaultExamples[0].output;
        })(),
        ...(example?.explanation ? { explanation: String(example.explanation).trim() } : {}),
      }));

      const deduped = [];
      const seen = new Set();
      [...cleaned, ...defaultExamples].forEach((example) => {
        const input = String(example.input || '').trim();
        const output = String(example.output || '').trim();
        const key = `${input}::${output}`;
        if (!input || !output || seen.has(key)) return;
        seen.add(key);
        deduped.push({
          input,
          output,
          ...(example.explanation ? { explanation: String(example.explanation).trim() } : {}),
        });
      });

      return deduped.length >= 2 ? deduped : defaultExamples;
    };

    const examplesFromTestCases = (testCases) => {
      if (!Array.isArray(testCases) || testCases.length === 0) return [];
      return testCases
        .slice(0, 3)
        .map((tc, index) => {
          const rawInput = tc?.input ?? tc?.i;
          const rawOutput = tc?.output ?? tc?.o;
          if (rawInput === undefined && rawOutput === undefined) return null;

          const input = Array.isArray(rawInput)
            ? rawInput.map((arg) => stringifyValue(arg)).join(', ')
            : stringifyValue(rawInput);
          const output = stringifyValue(rawOutput);

          return {
            input: String(input || '').trim() || `test_case_${index + 1}_input`,
            output: String(output || '').trim() || `test_case_${index + 1}_output`,
          };
        })
        .filter(Boolean);
    };

    const normalizeConstraints = (constraintsValue) => {
      if (Array.isArray(constraintsValue)) {
        const lines = constraintsValue.map((item) => String(item || '').trim()).filter(Boolean);
        return lines.length > 0 ? lines.join('\n') : '';
      }

      if (constraintsValue && typeof constraintsValue === 'object') {
        const lines = Object.entries(constraintsValue)
          .map(([key, value]) => `${key}: ${String(value || '').trim()}`)
          .filter((line) => !line.endsWith(':'));
        return lines.length > 0 ? lines.join('\n') : '';
      }

      const text = String(constraintsValue || '').trim();
      return text;
    };

    const updates = {};

    // Build best-available example set in priority order:
    // DB examples, DB test_cases-derived examples, local test-case mapped examples, then defaults.
    const rawSlug = (problemId && isNaN(parseInt(problemId))) ? problemId : (problem.title || '');
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const localExamples = getExamplesForProblem(slug);
    const dbExamples = Array.isArray(dbProblem.examples) ? dbProblem.examples : [];
    const dbExamplesFromTestCases = examplesFromTestCases(dbProblem.test_cases);

    updates.examples = normalizeExamples([
      ...dbExamples,
      ...dbExamplesFromTestCases,
      ...(Array.isArray(localExamples) ? localExamples : []),
    ]);

    if (dbProblem.description && !isGenericDescription(dbProblem.description)) {
      updates.description = dbProblem.description;
    } else if (!problem.description || isGenericDescription(problem.description)) {
      updates.description = buildLeetCodeStyleDescription();
    }

    if (dbProblem.explanation && String(dbProblem.explanation).trim()) {
      updates.explanation = String(dbProblem.explanation).trim();
    }
    
    const normalizedConstraints = normalizeConstraints(dbProblem.constraints);
    if (normalizedConstraints && !hasPlaceholderText(normalizedConstraints)) {
      updates.constraints = normalizedConstraints;
    } else if (!normalizedConstraints || hasPlaceholderText(normalizedConstraints)) {
      updates.constraints = '1 <= n <= 10^4\nAim for an efficient time and space complexity.';
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
      const resolvedProblemId = problem?.id || problemId;
      // Use /run endpoint with problemId for structured test case execution
      const res = await fetch(`${API_URL}/api/practice/run`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, language, problemId: resolvedProblemId }),
      });

      if (res.status === 401 || res.status === 403) {
        setOutput({
          success: false,
          output: '',
          message: 'Please sign in with a registered account to run code.',
        });
        return;
      }

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
        // Fallback: raw execution result (not judged against test cases)
        const actualOutput = (data.output || '').trim();
        const errorMsg = (data.error || '').trim();
        setOutput({
          success: false,
          output: actualOutput || errorMsg || '',
          message: errorMsg
            ? `Error: ${errorMsg}`
            : 'Execution completed but no judged test results were returned.',
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
  }, [code, language, problem, problemId]);

  // ─── Submit code ───
  const handleSubmit = useCallback(async () => {
    setRunning(true);
    setOutput(null);
    setFeedback(null);

    try {
      const resolvedProblemId = problem?.id || problemId;

      const res = await fetch(`${API_URL}/api/practice/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ problemId: resolvedProblemId, code, language }),
      });

      if (res.status === 401 || res.status === 403) {
        setOutput({
          success: false,
          output: '',
          message: 'Please sign in with a registered account to submit solutions.',
        });
        setRunning(false);
        return;
      }

      const data = await res.json();
      const unlockKey = getSolutionUnlockKey(resolvedProblemId);
      setSolutionUnlocked(true);
      localStorage.setItem(unlockKey, 'true');

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
  }, [code, language, problem, problemId]);

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
                language={language}
                hasSubmitted={solutionUnlocked}
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
            <MonacoWrapper
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
              problemId={problem?.id || problemId}
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
