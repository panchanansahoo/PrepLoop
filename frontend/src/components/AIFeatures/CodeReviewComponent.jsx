import React, { useState, useRef } from 'react';
import { submitCodeReview } from '../../api/aiService';
import { AlertCircle, CheckCircle, TrendingUp, Code, Loader } from 'lucide-react';

const CodeReviewComponent = ({ problemId, onReviewSubmitted }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const codeEditorRef = useRef(null);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter some code to review');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const reviewResult = await submitCodeReview(problemId, code, language);
      setResult(reviewResult);
      onReviewSubmitted?.(reviewResult);
    } catch (err) {
      setError(err.message || 'Failed to submit code for review');
      console.error('Code review error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-500" />
            AI Code Review Results
          </h2>
          
          {/* Scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Correctness', value: result.scores?.correctness, icon: '✓' },
              { label: 'Efficiency', value: result.scores?.efficiency, icon: '⚡' },
              { label: 'Readability', value: result.scores?.readability, icon: '👁' },
              { label: 'Best Practices', value: result.scores?.best_practices, icon: '⭐' }
            ].map((item) => (
              <div key={item.label} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">{item.label}</div>
                <div className="text-2xl font-bold text-blue-600">
                  {item.value}/10
                </div>
                <div className="text-lg mt-1">{item.icon}</div>
              </div>
            ))}
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Overall Score</h3>
                <p className="text-gray-600 text-sm">Performance level: {result.performance_level}</p>
              </div>
              <div className="text-4xl font-bold text-green-600">
                {result.overall_score}/10
              </div>
            </div>
          </div>

          {/* Feedback Sections */}
          <div className="space-y-4">
            {result.feedback?.strengths && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
                  {result.feedback.strengths.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.feedback?.improvements && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Areas for Improvement
                </h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
                  {result.feedback.improvements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.feedback?.suggestions && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Suggestions
                </h4>
                <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                  {result.feedback.suggestions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.feedback?.code_snippets && Object.keys(result.feedback.code_snippets).length > 0 && (
              <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code Improvements
                </h4>
                <div className="space-y-3">
                  {Object.entries(result.feedback.code_snippets).map(([type, snippet]) => (
                    <div key={type} className="bg-white rounded p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2 capitalize">
                        {type.replace(/_/g, ' ')}
                      </p>
                      <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                        <code>{snippet}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p>
              <strong>Language:</strong> {languages.find(l => l.value === language)?.label}
            </p>
            <p>
              <strong>Analysis Time:</strong> {new Date(result.created_at).toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={handleClear}
            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Submit Another Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Code className="text-blue-600" />
        AI Code Review
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-1 flex-shrink-0" />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Programming Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Code Editor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Code
          </label>
          <textarea
            ref={codeEditorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            className="w-full h-64 px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="mt-2 text-xs text-gray-500">
            Tip: Add comments to help the AI understand your approach
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Analyzing Code...
            </>
          ) : (
            <>
              <Code className="w-4 h-4" />
              Submit for Review
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> The AI will analyze your code for correctness, efficiency, 
          readability, and best practices. You'll receive detailed feedback and improvement suggestions.
        </p>
      </div>
    </div>
  );
};

export default CodeReviewComponent;
