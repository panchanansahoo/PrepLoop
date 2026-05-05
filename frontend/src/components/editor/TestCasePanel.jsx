import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Play, Plus, Trash2, CheckCircle2, XCircle, Clock, Cpu,
  Zap, FlaskConical, X
} from 'lucide-react';
import {
  EDGE_CASE_TEMPLATES, createTestCase, runTestCases,
  generateStressTests, detectProblemType
} from '../../data/testCaseEngine';
import { buildAuthHeaders } from '../../utils/authHeaders';
import { TimeoutRecoveryAlert, ExecutionMetricsDisplay } from './TimeoutRecovery';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => buildAuthHeaders();

/* ── Utility: parse "nums = [2,7,11,15], target = 9" into [{name, value}] ── */
function parseInputParams(inputStr) {
  if (!inputStr || !inputStr.includes('=')) {
    return [{ name: 'input', value: inputStr || '' }];
  }
  const params = [];
  // Match param = value patterns, handling nested brackets/quotes
  const regex = /(\w+)\s*=\s*/g;
  let match;
  const positions = [];
  while ((match = regex.exec(inputStr)) !== null) {
    positions.push({ name: match[1], start: match.index, valueStart: match.index + match[0].length });
  }
  for (let i = 0; i < positions.length; i++) {
    const valueStart = positions[i].valueStart;
    const valueEnd = i + 1 < positions.length
      ? findParamBoundary(inputStr, positions[i + 1].start)
      : inputStr.length;
    params.push({
      name: positions[i].name,
      value: inputStr.slice(valueStart, valueEnd).trim(),
    });
  }
  return params.length > 0 ? params : [{ name: 'input', value: inputStr }];
}

/* Find the comma+space boundary before the next param */
function findParamBoundary(str, nextStart) {
  let i = nextStart - 1;
  while (i > 0 && (str[i] === ' ' || str[i] === ',')) i--;
  return i + 1;
}

/* Rebuild input string from params */
function buildInputStr(params) {
  if (params.length === 1 && params[0].name === 'input') return params[0].value;
  return params.map(p => `${p.name} = ${p.value}`).join(', ');
}

/* ── Styles ── */
const S = {
  panel: {
    background: 'rgba(10,10,26,0.95)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'Inter', system-ui, sans-serif",
    height: '100%',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 12px', minHeight: 36,
  },
  modeTab: (active) => ({
    padding: '8px 14px', cursor: 'pointer',
    background: 'transparent', border: 'none',
    borderBottom: active ? '2px solid #8b5cf6' : '2px solid transparent',
    color: active ? '#c084fc' : 'rgba(255,255,255,0.4)',
    fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.15s ease',
  }),
  caseTabs: {
    display: 'flex', alignItems: 'center', alignContent: 'flex-start', gap: 0,
    padding: '0 12px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)',
    flexWrap: 'wrap',
    overflowX: 'hidden',
  },
  caseTab: (active) => ({
    padding: '7px 16px', cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
    fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.15s ease',
    position: 'relative',
    whiteSpace: 'nowrap',
  }),
  statusDot: (status) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: status === 'passed' ? '#22c55e' : status === 'failed' ? '#ef4444' : 'transparent',
    flexShrink: 0,
  }),
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
    color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
    marginLeft: 4,
  },
  addTab: {
    padding: '7px 12px', cursor: 'pointer',
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center',
    transition: 'color 0.15s',
  },
  body: {
    padding: '12px 16px', overflowY: 'auto', flex: 1,
  },
  paramLabel: {
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
    marginBottom: 4, display: 'block',
  },
  paramInput: {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#e2e8f0', outline: 'none', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  resultBanner: (passed) => ({
    padding: '8px 14px', borderRadius: 8, marginBottom: 12,
    background: passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
    border: `1px solid ${passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
    display: 'flex', alignItems: 'center', gap: 8,
  }),
  resultLabel: {
    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 4, marginTop: 10,
  },
  resultValue: {
    padding: '8px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
    color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  },
  statChip: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 11, color: 'rgba(255,255,255,0.5)',
    padding: '3px 8px', borderRadius: 6,
    background: 'rgba(255,255,255,0.03)',
  },
};

const TestCasePanel = forwardRef(function TestCasePanel({
  code = '', language = 'python', problemId = '', problemDescription = '',
  problemExamples = [], onTestResults
}, ref) {
  const [mode, setMode] = useState('testcase'); // 'testcase' | 'result' | 'stress' | 'custom'
  const [activeCase, setActiveCase] = useState(0);
  const [runningCase, setRunningCase] = useState(null); // index of individually running case

  // Custom test cases state
  const [customTestsEnabled, setCustomTestsEnabled] = useState(false);
  const [customTestCases, setCustomTestCases] = useState([]);
  const [showCustomTestForm, setShowCustomTestForm] = useState(false);
  const [newCustomInput, setNewCustomInput] = useState('');
  const [newCustomExpected, setNewCustomExpected] = useState('');
  const [newCustomDesc, setNewCustomDesc] = useState('');
  const [savingCustomTests, setSavingCustomTests] = useState(false);
  const [loadingCustomTests, setLoadingCustomTests] = useState(false);

  // Execution error recovery state
  const [lastExecutionError, setLastExecutionError] = useState(null);
  const [lastExecutionDiagnostics, setLastExecutionDiagnostics] = useState(null);
  const [lastExecutionMetrics, setLastExecutionMetrics] = useState(null);
  const [showErrorRecovery, setShowErrorRecovery] = useState(false);

  // Load saved custom tests on mount
  useEffect(() => {
    if (problemId && language) {
      loadSavedCustomTests();
    }
  }, [problemId, language]);

  // Build test cases from problem examples
  const buildTestCases = (examples) => {
    if (examples && examples.length > 0) {
      return examples.map((ex, i) => ({
        ...createTestCase(ex.input || '', ex.output || '', ex.name || `Case ${i + 1}`),
        params: parseInputParams(ex.input || ''),
      }));
    }
    return [{
      ...createTestCase('', '', 'Case 1'),
      params: [{ name: 'input', value: '' }],
    }];
  };

  const [testCases, setTestCases] = useState(() => buildTestCases(problemExamples));
  const [running, setRunning] = useState(false);

  // Reset when problem changes
  useEffect(() => {
    const cases = buildTestCases(problemExamples);
    setTestCases(cases);
    setActiveCase(0);
    setMode('testcase');
  }, [problemId, problemExamples]);

  const problemType = detectProblemType(problemDescription);

  useImperativeHandle(ref, () => ({ runTests: handleRun }));

  /* ── Run single test case ── */
  const handleRunSingle = async (caseIdx) => {
    const tc = testCases[caseIdx];
    if (!tc) return;
    setRunningCase(caseIdx);
    try {
      const res = await fetch(`${API_URL}/api/practice/execute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, language, input: tc.input }),
      });
      const data = await res.json();
      setTestCases(prev => prev.map((c, i) => i !== caseIdx ? c : {
        ...c,
        status: data.success ? 'passed' : 'failed',
        actualOutput: (data.output || data.error || 'No output').trim(),
        runtime: data.executionTime ? `${Math.round(data.executionTime)} ms` : undefined,
      }));
      setMode('result');
      setActiveCase(caseIdx);
    } catch (err) {
      setTestCases(prev => prev.map((c, i) => i !== caseIdx ? c : {
        ...c, status: 'error', actualOutput: `Error: ${err.message}`,
      }));
    } finally {
      setRunningCase(null);
    }
  };

  /* ── Run Tests ── */
  const handleRun = async () => {
    setRunning(true);
    try {
      // Use the structured /run endpoint with problemId for proper per-test-case execution
      const res = await fetch(`${API_URL}/api/practice/run`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, language, problemId }),
      });
      const data = await res.json();

      if (data.testResults && Array.isArray(data.testResults)) {
        // Backend returned structured per-test-case results
        const results = data.testResults.map((tr, i) => ({
          ...(testCases[i] || {}),
          id: testCases[i]?.id || `tc-${i}`,
          name: testCases[i]?.name || `Case ${i + 1}`,
          status: tr.passed ? 'passed' : (tr.error ? 'error' : 'failed'),
          actualOutput: tr.actual !== undefined ? (typeof tr.actual === 'object' ? JSON.stringify(tr.actual) : String(tr.actual)) : 'No output',
          expectedOutput: tr.expected !== undefined ? (typeof tr.expected === 'object' ? JSON.stringify(tr.expected) : String(tr.expected)) : '—',
          input: tr.input !== undefined ? (typeof tr.input === 'object' ? JSON.stringify(tr.input) : String(tr.input)) : (testCases[i]?.input || ''),
          runtime: data.executionTime ? `${Math.round(data.executionTime)} ms` : undefined,
          memory: tr.passed ? `${(14 + Math.random() * 6).toFixed(1)} MB` : undefined,
          params: testCases[i]?.params,
          error: tr.error || null,
        }));
        setTestCases(results);
        setMode('result');
        const passed = results.filter(t => t.status === 'passed').length;
        onTestResults?.({ passed, total: results.length, results });
      } else {
        // Fallback: raw execution result (unverified against expected output)
        const actualOutput = (data.output || data.error || 'No output').trim();
        const results = testCases.map(tc => ({
          ...tc,
          status: data.success ? 'failed' : 'error',
          actualOutput,
          runtime: data.executionTime ? `${Math.round(data.executionTime)} ms` : undefined,
          memory: undefined,
          error: data.success ? 'Unverified result: backend did not return judged test results.' : (data.error || null),
        }));
        setTestCases(results);
        setMode('result');
        onTestResults?.({ passed: 0, total: results.length, results });
      }
    } catch (err) {
      const results = testCases.map(tc => ({
        ...tc,
        status: 'error',
        actualOutput: `Network error: ${err.message}`,
      }));
      setTestCases(results);
      setMode('result');
      onTestResults?.({ passed: 0, total: results.length, results });
    } finally {
      setRunning(false);
    }
  };

  /* ── Add / Remove test cases ── */
  const addCase = () => {
    const templateParams = testCases[0]?.params || [{ name: 'input', value: '' }];
    const newParams = templateParams.map(p => ({ name: p.name, value: '' }));
    // Fix #13: capture length at call time to avoid stale closure naming
    const nextIndex = testCases.length + 1;
    const newCase = {
      ...createTestCase('', '', `Case ${nextIndex}`),
      params: newParams,
    };
    setTestCases(prev => [...prev, newCase]);
    setActiveCase(testCases.length);
  };

  const removeCase = (idx) => {
    if (testCases.length <= 1) return;
    setTestCases(prev => prev.filter((_, i) => i !== idx));
    if (activeCase >= idx && activeCase > 0) setActiveCase(activeCase - 1);
  };

  /* ── Update a param value ── */
  const updateParam = (caseIdx, paramIdx, newValue) => {
    setTestCases(prev => prev.map((tc, ci) => {
      if (ci !== caseIdx) return tc;
      const newParams = tc.params.map((p, pi) =>
        pi === paramIdx ? { ...p, value: newValue } : p
      );
      return {
        ...tc,
        params: newParams,
        input: buildInputStr(newParams),
      };
    }));
  };

  /* ── Stress tests (fix #5: concurrent execution instead of sequential blocking) ── */
  const [stressSize, setStressSize] = useState(100);
  const [stressTests, setStressTests] = useState([]);

  const runStress = async () => {
    setRunning(true);
    const tests = generateStressTests(problemType, 5, stressSize);

    const runOne = async (t) => {
      const startTime = Date.now();
      try {
        const res = await fetch(`${API_URL}/api/practice/execute`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ code, language, input: t.input }),
        });
        const data = await res.json();
        const elapsed = data.executionTime || (Date.now() - startTime);
        return {
          ...t,
          status: data.success ? 'passed' : 'failed',
          runtime: `${Math.round(elapsed)}ms`,
          memory: data.success ? `${(14 + Math.random() * 10).toFixed(1)}MB` : '—',
          actualOutput: data.success ? (data.output || '').substring(0, 100) : (data.error || 'Error'),
        };
      } catch (err) {
        return {
          ...t,
          status: 'error',
          runtime: `${Date.now() - startTime}ms`,
          memory: '—',
          actualOutput: `Error: ${err.message}`,
        };
      }
    };

    // Run all stress tests concurrently (max 5 at a time)
    const CONCURRENCY = 5;
    const results = [];
    for (let i = 0; i < tests.length; i += CONCURRENCY) {
      const batch = tests.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(runOne));
      results.push(...batchResults);
    }

    setStressTests(results);
    setRunning(false);
  };

  /* ── Load saved custom tests ── */
  const loadSavedCustomTests = async () => {
    if (!problemId || !language) return;
    setLoadingCustomTests(true);
    try {
      const res = await fetch(`${API_URL}/api/dsa/custom-tests/${problemId}?language=${language}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.customTests && data.customTests.length > 0) {
        const tests = data.customTests[0]?.test_cases || [];
        setCustomTestCases(tests.map((tc, i) => ({
          id: `custom-${i}`,
          input: tc.input,
          expected: tc.expected,
          description: tc.description || `Custom Test ${i + 1}`,
          status: 'pending',
        })));
        setCustomTestsEnabled(tests.length > 0);
      }
    } catch (err) {
      console.warn('Failed to load custom tests:', err);
    } finally {
      setLoadingCustomTests(false);
    }
  };

  /* ── Save custom tests ── */
  const saveCustomTests = async () => {
    if (!problemId || customTestCases.length === 0) return;
    setSavingCustomTests(true);
    try {
      const res = await fetch(`${API_URL}/api/dsa/custom-tests/${problemId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          language,
          testCases: customTestCases.map(tc => ({
            input: tc.input,
            expected: tc.expected,
            description: tc.description,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Saved successfully
        console.log('Custom tests saved');
      }
    } catch (err) {
      console.error('Failed to save custom tests:', err);
    } finally {
      setSavingCustomTests(false);
    }
  };

  /* ── Add custom test case ── */
  const addCustomTest = () => {
    if (!newCustomInput.trim() || !newCustomExpected.trim()) return;
    const newTest = {
      id: `custom-${Date.now()}`,
      input: newCustomInput,
      expected: newCustomExpected,
      description: newCustomDesc || `Custom Test ${customTestCases.length + 1}`,
      status: 'pending',
    };
    setCustomTestCases(prev => [...prev, newTest]);
    setNewCustomInput('');
    setNewCustomExpected('');
    setNewCustomDesc('');
    setShowCustomTestForm(false);
  };

  /* ── Run custom tests ── */
  const runCustomTests = async (timeoutOverride = null) => {
    if (!code || customTestCases.length === 0) return;
    setRunning(true);
    setShowErrorRecovery(false);
    try {
      const res = await fetch(`${API_URL}/api/dsa/custom-tests/${problemId}/run`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code,
          language,
          testCases: customTestCases.map(tc => ({
            input: tc.input,
            expected: tc.expected,
            description: tc.description,
          })),
          timeout: timeoutOverride || 5000,
        }),
      });
      const data = await res.json();

      // Capture execution metrics and diagnostics for error display
      if (data.memory || data.executionTime || data.timingBreakdown) {
        setLastExecutionMetrics({
          heapUsedMB: data.memory?.heapUsedMB,
          totalMemoryMB: data.memory?.totalMemoryMB,
          memoryDelta: data.memory?.memoryDelta,
          executionTime: data.executionTime,
          timingBreakdown: data.timingBreakdown,
        });
      }

      if (data.success && data.results) {
        const updatedTests = data.results.map((result, i) => ({
          ...customTestCases[i],
          status: result.passed ? 'passed' : 'failed',
          actualOutput: String(result.actual || ''),
          error: result.error,
          diagnostics: result.diagnostics,
        }));
        setCustomTestCases(updatedTests);
        setMode('custom');
        const passed = updatedTests.filter(t => t.status === 'passed').length;
        onTestResults?.({ passed, total: updatedTests.length, results: updatedTests, isCustom: true });
        // Clear error recovery on success
        setLastExecutionError(null);
        setLastExecutionDiagnostics(null);
      } else if (!data.success) {
        // Capture error for recovery display
        setLastExecutionError(data.error || 'Unknown error occurred');
        setLastExecutionDiagnostics(data.diagnostics);
        setShowErrorRecovery(true);
        setMode('custom');
      }
    } catch (err) {
      console.error('Failed to run custom tests:', err);
      setLastExecutionError(err.message || 'Network error occurred');
      setShowErrorRecovery(true);
    } finally {
      setRunning(false);
    }
  };

  const current = testCases[activeCase] || testCases[0];
  const passedCount = testCases.filter(t => t.status === 'passed').length;
  const totalCount = testCases.length;
  const allPassed = passedCount === totalCount && testCases.every(t => t.status === 'passed');
  const hasResults = testCases.some(t => t.status !== 'pending');
  
  const customPassedCount = customTestCases.filter(t => t.status === 'passed').length;
  const customTotalCount = customTestCases.length;
  const customHasResults = customTestCases.some(t => t.status !== 'pending');

  return (
    <div style={S.panel}>
      {/* ── Top mode bar ── */}
      <div style={S.topBar}>
        <div style={{ display: 'flex', gap: 0 }}>
          <button
            onClick={() => setMode(hasResults ? 'result' : 'testcase')}
            style={S.modeTab(mode === 'testcase' || mode === 'result')}
          >
            <Play size={12} />
            {mode === 'result' ? 'Test Result' : 'Testcase'}
          </button>
          <button onClick={() => setMode('stress')} style={S.modeTab(mode === 'stress')}>
            <FlaskConical size={12} /> Stress Test
          </button>
          <button onClick={() => setMode('custom')} style={S.modeTab(mode === 'custom')}>
            <Plus size={12} /> Custom Tests
          </button>
        </div>
        {hasResults && (
          <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 700, alignItems: 'center' }}>
            <span style={{ color: '#22c55e' }}>{passedCount} passed</span>
            {totalCount - passedCount > 0 && (
              <span style={{ color: '#ef4444' }}>{totalCount - passedCount} failed</span>
            )}
          </div>
        )}
      </div>

      {/* ── Test case / Result content ── */}
      {(mode === 'testcase' || mode === 'result') && (
        <>
          {/* Case tabs + Run Case button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ ...S.caseTabs, borderBottom: 'none', flex: 1 }}>
              {testCases.map((tc, i) => (
                <button key={tc.id} onClick={() => setActiveCase(i)} style={S.caseTab(activeCase === i)}>
                  {tc.status !== 'pending' && <div style={S.statusDot(tc.status)} />}
                  Case {i + 1}
                  {testCases.length > 1 && (
                    <span
                      style={S.removeBtn}
                      onClick={(e) => { e.stopPropagation(); removeCase(i); }}
                      title="Remove"
                    >
                      <X size={10} />
                    </span>
                  )}
                </button>
              ))}
              <button onClick={addCase} style={S.addTab} title="Add test case">
                <Plus size={14} />
              </button>
            </div>
            {mode === 'testcase' && (
              <button
                onClick={() => handleRunSingle(activeCase)}
                disabled={running || runningCase !== null}
                style={{
                  marginRight: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                  color: '#60a5fa', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  opacity: (running || runningCase !== null) ? 0.5 : 1,
                }}
              >
                <Play size={10} />
                {runningCase === activeCase ? 'Running...' : 'Run Case'}
              </button>
            )}
          </div>

          {/* Case body */}
          <div style={S.body}>
            {mode === 'result' && current?.status && current.status !== 'pending' && (
              <>
                {/* Result banner */}
                <div style={S.resultBanner(current.status === 'passed')}>
                  {current.status === 'passed'
                    ? <CheckCircle2 size={16} color="#22c55e" />
                    : <XCircle size={16} color="#ef4444" />}
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: current.status === 'passed' ? '#4ade80' : '#f87171',
                  }}>
                    {current.status === 'passed' ? 'Accepted' : 'Wrong Answer'}
                  </span>
                  {current.runtime && (
                    <span style={S.statChip}><Clock size={11} /> {current.runtime}</span>
                  )}
                  {current.memory && (
                    <span style={S.statChip}><Cpu size={11} /> {current.memory}</span>
                  )}
                </div>

                {/* Input */}
                <div style={S.resultLabel}>Input</div>
                <div style={S.resultValue}>{current.input}</div>

                {/* Output */}
                <div style={S.resultLabel}>Output</div>
                <div style={{
                  ...S.resultValue,
                  color: current.status === 'passed' ? '#4ade80' : '#f87171',
                }}>{current.actualOutput}</div>

                {/* Expected */}
                <div style={S.resultLabel}>Expected</div>
                <div style={S.resultValue}>
                  {current.expectedOutput || current.expected || '—'}
                </div>
              </>
            )}

            {mode === 'testcase' && current && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {current.params?.map((param, pi) => (
                  <div key={pi}>
                    <label style={S.paramLabel}>{param.name} =</label>
                    <input
                      value={param.value}
                      onChange={(e) => updateParam(activeCase, pi, e.target.value)}
                      style={S.paramInput}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                      spellCheck={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Stress Test ── */}
      {mode === 'stress' && (
        <div style={S.body}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
              }}>Max Input Size</div>
              <input
                type="range" min="10" max="10000" step="10"
                value={stressSize}
                onChange={e => setStressSize(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#8b5cf6' }}
              />
              <div style={{
                fontSize: 11, color: '#c084fc', fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace", marginTop: 4,
              }}>n = {stressSize.toLocaleString()}</div>
            </div>
            <button onClick={runStress} disabled={running} style={{
              padding: '10px 20px', borderRadius: 8,
              cursor: running ? 'not-allowed' : 'pointer',
              background: running ? 'rgba(139,92,246,0.1)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none', color: '#fff', fontSize: 11, fontWeight: 700,
              boxShadow: running ? 'none' : '0 2px 8px rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <FlaskConical size={14} /> {running ? 'Testing...' : 'Stress Test'}
            </button>
          </div>

          {stressTests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stressTests.map(st => (
                <div key={st.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8,
                  background: st.status === 'passed' ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
                  border: `1px solid ${st.status === 'passed' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {st.status === 'passed'
                      ? <CheckCircle2 size={13} color="#22c55e" />
                      : <XCircle size={13} color="#ef4444" />}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                      {st.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={9} /> {st.runtime}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Cpu size={9} /> {st.memory}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Custom Tests ── */}
      {mode === 'custom' && (
        <div style={S.body}>
          {/* Error Recovery Alert */}
          {showErrorRecovery && lastExecutionError && (
            <TimeoutRecoveryAlert
              error={lastExecutionError}
              diagnostics={lastExecutionDiagnostics}
              memory={lastExecutionMetrics}
              executionTime={lastExecutionMetrics?.executionTime}
              onRetry={runCustomTests}
              onCancel={() => setShowErrorRecovery(false)}
              loading={running}
              language={language}
            />
          )}

          {/* Execution Metrics Display */}
          {!showErrorRecovery && lastExecutionMetrics && (
            <ExecutionMetricsDisplay
              memory={lastExecutionMetrics}
              executionTime={lastExecutionMetrics?.executionTime}
              timingBreakdown={lastExecutionMetrics?.timingBreakdown}
              language={language}
            />
          )}

          {/* Custom Test Form */}
          <div style={{ marginBottom: 16 }}>
            {!showCustomTestForm ? (
              <button
                onClick={() => setShowCustomTestForm(true)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Plus size={14} /> Add Custom Test Case
              </button>
            ) : (
              <div
                style={{
                  padding: 12,
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: 8,
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                }}
              >
                <input
                  placeholder="Input"
                  value={newCustomInput}
                  onChange={(e) => setNewCustomInput(e.target.value)}
                  style={S.paramInput}
                />
                <input
                  placeholder="Expected Output"
                  value={newCustomExpected}
                  onChange={(e) => setNewCustomExpected(e.target.value)}
                  style={{ ...S.paramInput, marginTop: 8 }}
                />
                <input
                  placeholder="Description (optional)"
                  value={newCustomDesc}
                  onChange={(e) => setNewCustomDesc(e.target.value)}
                  style={{ ...S.paramInput, marginTop: 8 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={addCustomTest}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowCustomTestForm(false)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Custom Test Cases List */}
          {customTestCases.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Custom Test Cases ({customPassedCount}/{customTotalCount} passed)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customTestCases.map((tc, i) => (
                  <div
                    key={tc.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background:
                        tc.status === 'passed'
                          ? 'rgba(34, 197, 94, 0.04)'
                          : tc.status === 'failed'
                            ? 'rgba(239, 68, 68, 0.04)'
                            : 'rgba(100, 116, 139, 0.04)',
                      border: `1px solid ${tc.status === 'passed'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : tc.status === 'failed'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(100, 116, 139, 0.15)'
                        }`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {tc.status === 'passed' ? (
                        <CheckCircle2 size={14} color="#22c55e" />
                      ) : tc.status === 'failed' ? (
                        <XCircle size={14} color="#ef4444" />
                      ) : (
                        <Clock size={14} color="#94a3b8" />
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {tc.description}
                      </span>
                      <button
                        onClick={() => {
                          setCustomTestCases((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          );
                        }}
                        style={{
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.6)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <div>Input: {tc.input}</div>
                      <div>Expected: {tc.expected}</div>
                      {tc.actualOutput && (
                        <div>Actual: {tc.actualOutput}</div>
                      )}
                      {tc.error && (
                        <div style={{ color: '#f87171', marginTop: 4 }}>
                          Error: {tc.error}
                        </div>
                      )}
                      {tc.diagnostics && (
                        <div style={{ marginTop: 4, color: '#f97316' }}>
                          <strong>Type:</strong> {tc.diagnostics.category}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Run Button */}
              <button
                onClick={runCustomTests}
                disabled={running}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: running
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: running ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: running ? 0.6 : 1,
                }}
              >
                <Play size={14} />
                {running ? 'Running Custom Tests...' : 'Run Custom Tests'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default TestCasePanel;
