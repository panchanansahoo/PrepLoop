import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Send, Lightbulb, CheckCircle, XCircle, Loader, Code2, Clock, Cpu, Award } from 'lucide-react';
import HintsPanel from '../components/solver/HintsPanel';
import { useTheme } from '../context/ThemeContext';

export default function ProblemSolver() {
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    fetchProblem();
  }, [id]);

  useEffect(() => {
    if (problem?.starter_code) {
      setCode(problem.starter_code[language] || '');
    }
  }, [language, problem]);

  const fetchProblem = async () => {
    try {
      const response = await axios.get(`/api/dsa/problems/${id}`);
      setProblem(response.data.problem);
      if (response.data.problem.starter_code) {
        setCode(response.data.problem.starter_code.python || '');
      }
    } catch (error) {
      // Fallback for demo
      setProblem({
        id: id,
        title: "Two Sum",
        difficulty: "Easy",
        pattern_name: "Hash Map",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        examples: [
          { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
          { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
        ],
        constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists."
      });
      setCode("class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your code here\n        pass");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await axios.post('/api/practice/run', {
        code, language, problemId: id
      }, { headers });

      const data = response.data;
      if (data.testResults) {
        const passed = data.testResults.filter(r => r.passed).length;
        setOutput({
          success: passed === data.testResults.length,
          message: data.message || `${passed}/${data.testResults.length} test cases passed`,
          testResults: data.testResults,
          executionTime: data.executionTime
        });
      } else {
        setOutput({
          success: data.success,
          message: data.output || data.error || 'Execution completed',
          executionTime: data.executionTime
        });
      }
    } catch (error) {
      setOutput({ success: false, message: error.response?.data?.error || 'Error executing code' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await axios.post('/api/practice/submit', {
        problemId: id, code, language
      }, { headers });

      const data = response.data;
      setOutput({
        success: data.success,
        message: data.message || (data.success ? 'Accepted' : 'Wrong Answer'),
        testResults: data.testResults,
        submission: data.submission
      });

      if (data.testResults) {
        const passed = data.testResults.filter(r => r.passed).length;
        setFeedback({
          testsPassed: passed,
          totalTests: data.totalTests || data.testResults.length,
          status: data.success ? 'Accepted' : 'Wrong Answer',
          results: data.testResults
        });
      }
    } catch (error) {
      setOutput({ success: false, message: error.response?.data?.error || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isLight ? 'bg-slate-50' : 'bg-[#020617]'}`}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020617] text-white'}`}>
        <h2 className="text-2xl font-bold mb-4">Problem not found</h2>
        <Link to="/dsa-patterns" className="btn btn-primary">Back to Patterns</Link>
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-64px)] ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020617] text-white'} overflow-hidden animate-fade-in`}>
      {/* Left Panel: Problem Description */}
      <div className={`w-[40%] flex flex-col border-r ${isLight ? 'border-slate-200 bg-white/60' : 'border-white/10 bg-black/20'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200 bg-white/80' : 'border-white/10 bg-black/40'}`}>
          <Link
            to={`/patterns/${problem.pattern_id || '1'}`}
            className={`flex items-center gap-2 text-sm transition-colors ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'}`}
          >
            <ArrowLeft size={16} /> Back to Pattern
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="flex items-start justify-between mb-4">
            <h1 className={`text-2xl font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{problem.title}</h1>
          </div>

          <div className="flex gap-2 mb-6">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
              {problem.difficulty}
            </span>
            {problem.pattern_name && (
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border bg-purple-500/10 text-purple-400 border-purple-500/20">
                {problem.pattern_name}
              </span>
            )}
          </div>

          <div className={`prose max-w-none text-sm leading-relaxed mb-8 ${isLight ? 'prose-slate text-slate-600' : 'prose-invert text-gray-300'}`}>
            <p className="whitespace-pre-wrap">{problem.description}</p>
          </div>

          {problem.examples && (
            <div className="space-y-4 mb-8">
              <h3 className={`font-bold text-sm uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>Examples</h3>
              {problem.examples.map((ex, i) => (
                <div key={i} className={`rounded-xl p-4 font-mono text-xs ${isLight ? 'bg-slate-100 border border-slate-200' : 'bg-white/5 border border-white/5'}`}>
                  <div className="mb-2"><span className="text-gray-500">Input:</span> <span className="text-gray-300">{ex.input}</span></div>
                  <div className="mb-2"><span className="text-gray-500">Output:</span> <span className="text-gray-300">{ex.output}</span></div>
                  {ex.explanation && (
                    <div><span className="text-gray-500">Explanation:</span> <span className="text-gray-400">{ex.explanation}</span></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {problem.constraints && (
            <div className="mb-8">
              <h3 className={`font-bold text-sm uppercase tracking-wider mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Constraints</h3>
              <div className={`rounded-xl p-4 font-mono text-xs whitespace-pre-wrap ${isLight ? 'bg-slate-100 border border-slate-200 text-slate-600' : 'bg-white/5 border border-white/5 text-gray-300'}`}>
                {problem.constraints}
              </div>
            </div>
          )}

          {/* AI Hints Panel */}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowHints(prev => !prev)}
              className={`w-full py-3 rounded-xl border transition-all text-sm font-medium flex items-center justify-center gap-2 ${isLight ? 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'border-white/10 hover:bg-white/5 text-gray-400 hover:text-white'}`}
            >
              <Lightbulb size={16} />
              {showHints ? 'Hide AI Assistant' : 'Show AI Assistant'}
            </button>
          </div>

          {showHints && (
            <div className="animate-fade-up" style={{ marginTop: 12 }}>
              <HintsPanel
                problemId={id}
                code={code}
                language={language}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Code Editor */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        {/* Editor Toolbar */}
        <div className="h-14 border-b border-black/40 bg-[#1e1e1e] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isLight ? 'text-slate-500 bg-slate-100 border border-slate-200' : 'text-gray-400 bg-white/5 border border-white/5'}`}>
              <Code2 size={14} />
              <span>Editor</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`bg-transparent text-xs font-medium border-none outline-none cursor-pointer ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-300 hover:text-white'}`}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={submitting}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${isLight ? 'bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'}`}
            >
              <Play size={14} className={submitting ? 'opacity-50' : ''} /> Run
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/20"
            >
              {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
              Submit
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 20, bottom: 20 },
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
            }}
          />
        </div>

        {/* Output / Feedback Panel */}
        {(output || feedback) && (
          <div className="h-1/3 border-t border-black/40 bg-[#1e1e1e] flex flex-col">
            <div className="flex border-b border-white/5">
              <button className="px-4 py-2 text-xs font-medium border-b-2 border-accent text-white">
                {feedback ? 'AI Feedback' : 'Console Output'}
              </button>
              <button onClick={() => { setOutput(null); setFeedback(null); }} className="ml-auto px-4 text-gray-500 hover:text-white">
                <XCircle size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
              {output && !feedback && (
                <div className={output.success ? 'text-green-400' : 'text-red-400'}>
                  <div className="flex items-center gap-2 mb-2 font-bold">
                    {output.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {output.success ? 'Success' : 'Error'}
                  </div>
                  <pre className="whitespace-pre-wrap text-gray-300">{output.message || output.output}</pre>
                </div>
              )}

              {feedback && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`flex items-center gap-2 text-sm font-bold ${feedback.status === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}>
                      {feedback.status === 'Accepted' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      {feedback.status}
                    </div>
                    <span className="text-gray-500 text-xs">{feedback.testsPassed}/{feedback.totalTests} tests passed</span>
                  </div>
                  {feedback.results && feedback.results.map((r, i) => (
                    <div key={i} className={`p-3 rounded-lg border text-xs font-mono ${r.passed ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {r.passed ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-red-400" />}
                        <span className={r.passed ? 'text-green-400' : 'text-red-400'}>Test {i + 1}: {r.passed ? 'Passed' : 'Failed'}</span>
                      </div>
                      {!r.passed && (
                        <div className="mt-2 space-y-1 text-gray-400">
                          <div>Input: <span className="text-gray-300">{JSON.stringify(r.input)}</span></div>
                          <div>Expected: <span className="text-green-400">{JSON.stringify(r.expected)}</span></div>
                          <div>Got: <span className="text-red-400">{JSON.stringify(r.actual)}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
