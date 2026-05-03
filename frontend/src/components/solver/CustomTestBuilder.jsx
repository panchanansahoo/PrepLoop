/**
 * Custom Test Case Creator - Phase 1.2
 * Allows users to create, validate, and run custom test cases
 */

import { useState, useRef, useEffect } from 'react';
import {
  Plus, Trash2, Play, Check, AlertCircle, Copy, Save
} from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch';

const SAMPLE_TEMPLATES = {
  python: {
    simple_input: 'input_value = [1, 2, 3]',
    array_edge: 'nums = []\nexpected = []',
    string: 'text = "hello"\nexpected = "olleh"',
    dict: 'data = {"a": 1, "b": 2}\nexpected = {"b": 2, "a": 1}',
  },
  javascript: {
    simple_input: 'const inputValue = [1, 2, 3];',
    array_edge: 'const nums = [];\nconst expected = [];',
    string: 'const text = "hello";\nconst expected = "olleh";',
    dict: 'const data = {a: 1, b: 2};\nconst expected = {b: 2, a: 1};',
  },
  java: {
    simple_input: 'int[] input = {1, 2, 3};',
    array_edge: 'int[] nums = {};\nint[] expected = {};',
    string: 'String text = "hello";\nString expected = "olleh";',
  },
  cpp: {
    simple_input: 'vector<int> input = {1, 2, 3};',
    array_edge: 'vector<int> nums = {};\nvector<int> expected = {};',
  },
};

export default function CustomTestBuilder({ problemId, language = 'python', onTestsUpdate }) {
  const [testCases, setTestCases] = useState([
    { id: 1, input: '', expected: '', description: 'Test case 1' },
  ]);
  const [nextId, setNextId] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { id: nextId, input: '', expected: '', description: `Test case ${nextId}` },
    ]);
    setNextId(nextId + 1);
  };

  const removeTestCase = (id) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter(tc => tc.id !== id));
    }
  };

  const updateTestCase = (id, field, value) => {
    setTestCases(testCases.map(tc =>
      tc.id === id ? { ...tc, [field]: value } : tc
    ));
  };

  const insertTemplate = (template) => {
    if (testCases.length > 0) {
      updateTestCase(testCases[0].id, 'input', template);
    }
  };

  const validateTestCases = () => {
    for (const tc of testCases) {
      if (!tc.input.trim()) {
        setError(`Test case "${tc.description}": input cannot be empty`);
        return false;
      }
      if (!tc.expected.trim()) {
        setError(`Test case "${tc.description}": expected output cannot be empty`);
        return false;
      }
    }
    return true;
  };

  const saveTestCases = async () => {
    if (!validateTestCases()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/dsa/custom-tests/${problemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          testCases: testCases.map(({ id, ...rest }) => rest),
        }),
      });

      setSuccessMessage('Test cases saved successfully');
      if (onTestsUpdate) onTestsUpdate(response.testCases);
    } catch (err) {
      setError(err.message || 'Failed to save test cases');
    } finally {
      setLoading(false);
    }
  };

  const runTestCases = async () => {
    if (!validateTestCases()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/dsa/custom-tests/${problemId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          testCases: testCases.map(({ id, ...rest }) => rest),
        }),
      });

      setSuccessMessage(`${response.passedCount}/${response.totalCount} tests passed`);
      if (onTestsUpdate) onTestsUpdate(response);
    } catch (err) {
      setError(err.message || 'Failed to run test cases');
    } finally {
      setLoading(false);
    }
  };

  const copyTestCaseFormat = (index) => {
    const tc = testCases[index];
    const text = `Input: ${tc.input}\nExpected: ${tc.expected}`;
    navigator.clipboard.writeText(text).then(() => {
      setSuccessMessage('Copied to clipboard');
    });
  };

  return (
    <div style={{
      padding: '12px',
      background: 'rgba(10,10,26,0.95)',
      borderRadius: '6px',
      color: 'rgba(255,255,255,0.9)',
      fontSize: '13px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontWeight: 700, color: '#fbbf24' }}>
          Custom Test Cases
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          {testCases.length} case{testCases.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '4px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '4px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#86efac',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
        }}>
          <Check size={14} /> {successMessage}
        </div>
      )}

      {/* Template Selector */}
      {SAMPLE_TEMPLATES[language] && (
        <div style={{
          marginBottom: '12px',
          padding: '8px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            marginBottom: '6px',
            color: 'rgba(255,255,255,0.6)',
          }}>
            Templates:
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '4px',
          }}>
            {Object.entries(SAMPLE_TEMPLATES[language]).map(([key, template]) => (
              <button
                key={key}
                onClick={() => insertTemplate(template)}
                style={{
                  padding: '6px 8px',
                  fontSize: '11px',
                  background: 'rgba(251, 146, 60, 0.1)',
                  border: '1px solid rgba(251, 146, 60, 0.3)',
                  color: '#fb923c',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {key.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test Cases List */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '12px',
      }}>
        {testCases.map((tc, index) => (
          <div key={tc.id} style={{
            padding: '10px',
            marginBottom: '8px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '4px',
          }}>
            {/* Description & Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              <input
                type="text"
                placeholder="Description"
                value={tc.description}
                onChange={(e) => updateTestCase(tc.id, 'description', e.target.value)}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => copyTestCaseFormat(index)}
                title="Copy"
                style={{
                  padding: '4px 6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Copy size={12} />
              </button>
              {testCases.length > 1 && (
                <button
                  onClick={() => removeTestCase(tc.id)}
                  title="Remove"
                  style={{
                    padding: '4px 6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Input */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                marginBottom: '4px',
                color: 'rgba(255,255,255,0.5)',
              }}>
                Input:
              </label>
              <textarea
                placeholder="Enter input"
                value={tc.input}
                onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '50px',
                  padding: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Expected */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                marginBottom: '4px',
                color: 'rgba(255,255,255,0.5)',
              }}>
                Expected Output:
              </label>
              <textarea
                placeholder="Enter expected output"
                value={tc.expected}
                onChange={(e) => updateTestCase(tc.id, 'expected', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '50px',
                  padding: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}>
        <button
          onClick={addTestCase}
          disabled={loading}
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3b82f6',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Plus size={14} /> Add
        </button>

        <button
          onClick={saveTestCases}
          disabled={loading}
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22c55e',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Save size={14} /> Save
        </button>

        <button
          onClick={runTestCases}
          disabled={loading}
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 600,
            background: 'rgba(251, 146, 60, 0.15)',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            color: '#fb923c',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Play size={14} /> Run
        </button>
      </div>
    </div>
  );
}
