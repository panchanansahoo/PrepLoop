import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, Lightbulb, Volume2 } from 'lucide-react';

/**
 * Real-time Feedback Component
 * Displays live feedback on answer quality, tips, and improvement areas
 */
export default function RealtimeFeedback({ feedback }) {
  const [speakingFeedback, setSpeakingFeedback] = useState(false);

  if (!feedback) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col items-center justify-center">
        <Lightbulb size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">
          Start typing or recording to get real-time feedback...
        </p>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-300';
    if (score >= 60) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  const playFeedback = () => {
    setSpeakingFeedback(true);
    const text = `
      Quality score: ${feedback.quality_score}.
      ${feedback.strengths ? `Strengths: ${feedback.strengths.join(', ')}` : ''}
      ${feedback.areas_for_improvement ? `Areas to improve: ${feedback.areas_for_improvement.join(', ')}` : ''}
      ${feedback.suggestion ? `Tip: ${feedback.suggestion}` : ''}
    `;
    
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingFeedback(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        ⚡ Real-time Feedback
      </h3>

      {/* Quality Score */}
      <div className={`rounded-lg border-2 p-4 mb-4 ${getScoreBgColor(feedback.quality_score)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Quality Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(feedback.quality_score)}`}>
            {feedback.quality_score}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              feedback.quality_score >= 80
                ? 'bg-green-600'
                : feedback.quality_score >= 60
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${feedback.quality_score}%` }}
          />
        </div>
      </div>

      {/* Structure Score */}
      {feedback.structure_score && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Structure</span>
            <span className="text-lg font-bold text-blue-600">{feedback.structure_score}%</span>
          </div>
        </div>
      )}

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-green-600" />
            <h4 className="font-semibold text-gray-900">Strengths</h4>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 p-3 space-y-1">
            {feedback.strengths.map((strength, idx) => (
              <div key={idx} className="text-sm text-green-800">
                ✓ {strength}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas for Improvement */}
      {feedback.areas_for_improvement && feedback.areas_for_improvement.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-yellow-600" />
            <h4 className="font-semibold text-gray-900">Improve</h4>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 space-y-1">
            {feedback.areas_for_improvement.map((area, idx) => (
              <div key={idx} className="text-sm text-yellow-800">
                ⚠ {area}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion */}
      {feedback.suggestion && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 mb-4">
          <div className="flex items-start gap-2">
            <Lightbulb size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Expert Tip</h4>
              <p className="text-sm text-indigo-800">{feedback.suggestion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Similar Questions */}
      {feedback.similar_questions && feedback.similar_questions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-purple-600" />
            <h4 className="font-semibold text-gray-900">Next Level</h4>
          </div>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3">
            <p className="text-xs text-purple-800">
              After mastering this, try: <strong>{feedback.similar_questions[0]}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Audio Playback */}
      <button
        onClick={playFeedback}
        disabled={speakingFeedback}
        className={`w-full py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
          speakingFeedback
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        <Volume2 size={16} />
        {speakingFeedback ? 'Listening...' : 'Hear Feedback'}
      </button>
    </div>
  );
}
