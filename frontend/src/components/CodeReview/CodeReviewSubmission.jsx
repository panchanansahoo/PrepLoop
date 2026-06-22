import { useState } from 'react';
import Editor from '@monaco-editor/react';
import {Code2, AlertTriangle, Send} from 'lucide-react';
import { submitCodeReview } from '../../api/aiService';
import CodeReviewDisplay from './CodeReviewDisplay';
import './CodeReview.css';

const MOCK_PROBLEMS = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy' },
  { id: 2, title: 'LRU Cache', difficulty: 'Medium' },
  { id: 3, title: 'Median of Two Sorted Arrays', difficulty: 'Hard' }
];

const FORM_LABELS = {
  problem: 'Select Problem',
  language: 'Language',
};

export default function CodeReviewSubmission() {
  const [code, setCode] = useState('// Write your solution here\n');
  const [language, setLanguage] = useState('javascript');
  const [problemId, setProblemId] = useState(MOCK_PROBLEMS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);

  const handleSubmit = async () => {
    if (!code.trim() || code.trim() === '// Write your solution here') {
      setError('Please write some code before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      const result = await submitCodeReview(problemId, code, language);
      setReviewResult(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cr-submission-container">
      <div className="cr-submission-header">
        <div className="cr-header-title">
          <Code2 className="text-blue" size={24} />
          <h2>AI Code Reviewer</h2>
        </div>
        <p className="cr-subtitle">
          Submit your solution to receive instant, senior-level feedback on time complexity, readability, and best practices.
        </p>
      </div>

      <div className="cr-workspace">
        {/* Settings Panel */}
        <div className="cr-settings">
          <div className="cr-form-group">
            <label>{FORM_LABELS.problem}</label>
            <select 
              value={problemId} 
              onChange={e => setProblemId(Number(e.target.value))}
              className="cr-select"
            >
              {MOCK_PROBLEMS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div className="cr-form-group">
            <label>{FORM_LABELS.language}</label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="cr-select"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>

        {/* Editor Area */}
        <div className="cr-editor-section">
          <div className="cr-editor-wrapper">
            <Editor
              height="400px"
              language={language}
              value={code}
              onChange={val => setCode(val || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 }
              }}
            />
          </div>
          
          <div className="cr-action-bar">
            {error && (
              <div className="cr-error-message">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <button 
              className="btn btn-primary cr-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="cr-spinner" /> Analyzing Code...
                </>
              ) : (
                <>
                  <Send size={16} /> Get AI Feedback
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Area */}
      {reviewResult && (
        <div className="cr-results-wrapper">
          <CodeReviewDisplay reviewData={reviewResult} />
        </div>
      )}
    </div>
  );
}
