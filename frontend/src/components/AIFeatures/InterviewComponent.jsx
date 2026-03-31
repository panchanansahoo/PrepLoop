import React, { useState, useEffect, useRef } from 'react';
import {
  startInterview,
  submitInterviewResponse,
  completeInterview,
  getInterviewSession
} from '../../api/aiService';
import {
  AlertCircle,
  Loader,
  Send,
  CheckCircle,
  Clock,
  TrendingUp,
  Volume2,
  Copy,
  RefreshCw
} from 'lucide-react';

const InterviewComponent = ({ userId, onInterviewCompleted }) => {
  const [step, setStep] = useState('setup'); // setup, in-progress, completed
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState(null);
  const [interviewer, setInterviewer] = useState(null);
  const [interviewStart, setInterviewStart] = useState(null);
  const messagesEndRef = useRef(null);

  // Setup form state
  const [setupForm, setSetupForm] = useState({
    interviewType: 'dsa',
    difficulty: 'medium',
    companyFocus: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await startInterview(
        setupForm.interviewType,
        setupForm.difficulty,
        setupForm.companyFocus || null
      );

      setSessionId(result.session_id);
      setInterviewer(result.interviewer);
      setMessages([
        {
          type: 'interviewer',
          content: result.initial_question,
          timestamp: new Date()
        }
      ]);
      setInterviewStart(new Date());
      setStep('in-progress');
    } catch (err) {
      setError(err.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    if (!currentResponse.trim()) return;

    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: currentResponse,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentResponse('');
    setLoading(true);
    setError(null);

    try {
      const result = await submitInterviewResponse(sessionId, currentResponse);

      // Add interviewer response
      setMessages((prev) => [
        ...prev,
        {
          type: 'interviewer',
          content: result.follow_up || result.feedback || 'Thank you for your response.',
          timestamp: new Date()
        }
      ]);

      // Update scores if provided
      if (result.current_scores) {
        setScores(result.current_scores);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit response');
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
      setCurrentResponse(userMessage.content);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await completeInterview(sessionId);
      setScores(result.final_scores || result.scores);
      setStep('completed');
      onInterviewCompleted?.(result);

      // Store final feedback
      setMessages((prev) => [
        ...prev,
        {
          type: 'system',
          content: 'Interview completed! Your performance analysis is ready below.',
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to complete interview');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuestion = () => {
    if (messages.length > 0) {
      const lastQuestion = messages[messages.length - 1]?.content || '';
      navigator.clipboard.writeText(lastQuestion);
      alert('Question copied to clipboard!');
    }
  };

  const calculateDuration = () => {
    if (!interviewStart) return '0m';
    const duration = Math.floor((new Date() - interviewStart) / 60000);
    if (duration < 60) return `${duration}m`;
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  };

  // Setup Step
  if (step === 'setup') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Start AI Interview</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-1 flex-shrink-0" />
            <div className="text-red-800">{error}</div>
          </div>
        )}

        <form onSubmit={handleStartInterview} className="space-y-6">
          {/* Interview Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Interview Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'dsa', label: 'DSA', icon: '🧩' },
                { value: 'system_design', label: 'System Design', icon: '🏗️' },
                { value: 'behavioral', label: 'Behavioral', icon: '🤝' },
                { value: 'mixed', label: 'Mixed', icon: '🎯' }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setSetupForm({ ...setupForm, interviewType: type.value })
                  }
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    setupForm.interviewType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="font-semibold text-sm">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'easy', label: 'Easy', color: 'green' },
                { value: 'medium', label: 'Medium', color: 'yellow' },
                { value: 'hard', label: 'Hard', color: 'red' }
              ].map((diff) => (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() =>
                    setSetupForm({ ...setupForm, difficulty: diff.value })
                  }
                  className={`p-3 rounded-lg border-2 font-semibold transition ${
                    setupForm.difficulty === diff.value
                      ? `border-${diff.color}-600 bg-${diff.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Company Focus (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Focus (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Google, Amazon, Meta"
              value={setupForm.companyFocus}
              onChange={(e) =>
                setSetupForm({ ...setupForm, companyFocus: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Starting Interview...
              </>
            ) : (
              'Start Interview'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> The AI interviewer will ask you questions and evaluate your 
            responses based on technical knowledge, communication, and problem-solving skills.
          </p>
        </div>
      </div>
    );
  }

  // In-Progress Step
  if (step === 'in-progress') {
    return (
      <div className="bg-white rounded-lg shadow-md max-w-3xl mx-auto flex flex-col h-screen md:h-[600px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Interview in Progress</h2>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {calculateDuration()}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Score: {scores?.overall || 'N/A'}/10
              </span>
            </div>
          </div>
          <button
            onClick={handleCopyQuestion}
            className="p-2 hover:bg-blue-600 rounded transition"
            title="Copy question"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : msg.type === 'system'
                    ? 'bg-gray-200 text-gray-800 rounded-bl-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {msg.timestamp?.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Input Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {step === 'in-progress' && (
            <>
              <form onSubmit={handleSubmitResponse} className="flex gap-2">
                <textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Type your response here..."
                  rows="2"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={loading || !currentResponse.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center gap-2"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>

              <button
                onClick={handleCompleteInterview}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
              >
                Complete Interview
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Completed Step
  if (step === 'completed') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Interview Completed!</h2>
          <p className="text-gray-600 mt-2">
            Total Duration: {calculateDuration()}
          </p>
        </div>

        {scores && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Overall Score</h3>
                  <p className="text-gray-600 text-sm">
                    Performance level: {scores.performance_level || 'Excellent'}
                  </p>
                </div>
                <div className="text-5xl font-bold text-green-600">
                  {scores.overall || scores.overall_score || 'N/A'}/10
                </div>
              </div>
            </div>

            {/* Category Scores */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Category Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(scores).map(([key, value]) => {
                  if (!['overall', 'overall_score', 'performance_level'].includes(key) && typeof value === 'number') {
                    return (
                      <div key={key} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-sm text-gray-600 capitalize mb-1">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {value}/10
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Feedback & Recommendations</h3>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700 text-sm">
                  Great effort! Continue practicing similar problems to solidify your problem-solving skills. 
                  Focus on edge cases and optimizing your solutions further.
                </p>
              </div>
            </div>

            {/* Chat History */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Interview Transcript</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-semibold text-gray-700 capitalize">
                      {msg.type === 'user' ? 'You' : msg.type}:
                    </p>
                    <p className="text-gray-600 mt-1">{msg.content.substring(0, 200)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => {
              setStep('setup');
              setSessionId(null);
              setMessages([]);
              setCurrentResponse('');
              setScores(null);
              setError(null);
            }}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Start Another Interview
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
};

export default InterviewComponent;
