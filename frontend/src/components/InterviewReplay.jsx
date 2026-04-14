import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Download, Share2, MessageCircle, ThumbsUp, ArrowLeft } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';

/**
 * Interview Replay Component
 * Allows users to review past interviews with playback and analysis
 */
export default function InterviewReplay() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const buildInterviewApiUrl = (path) => buildApiUrl(path, { rawBaseUrl: API_BASE_URL, apiPrefix: '/api' });
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchInterviews();
  }, [sortBy]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${buildInterviewApiUrl('/interviews')}?sort=${sortBy}`, {
        headers: buildAuthHeaders(),
      });
      const data = await response.json();
      setInterviews(data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInterview = (interviewId) => {
    (async () => {
      try {
        const response = await fetch(buildInterviewApiUrl(`/interviews/${interviewId}/download`), {
          headers: buildAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error('Failed to download interview');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `interview-${interviewId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading interview:', error);
      }
    })();
  };

  const shareInterview = (interview) => {
    const text = `I just completed a ${interview.type} interview with Preploop and scored ${interview.score}/100! Check out my improvement: ${interview.improvement}%`;
    if (navigator.share) {
      navigator.share({
        title: 'My Interview Results',
        text: text,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    }
  };

  // === REPLAY VIEW ===
  if (selectedInterview) {
    const interview = selectedInterview;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setSelectedInterview(null)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 text-gray-700 font-semibold transition-all"
            >
              <ArrowLeft size={20} /> Back to List
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview
              </h1>
              <p className="text-gray-600">
                {new Date(interview.created_at).toLocaleDateString()} • {interview.duration} mins
              </p>
            </div>
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Score */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center lg:col-span-1">
              <div className="text-6xl font-bold text-indigo-600 mb-2">{interview.score}</div>
              <p className="text-gray-600 mb-4">Overall Score</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${interview.score}%` }}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
              <h3 className="font-bold text-gray-900 mb-4">📊 Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Communication</p>
                  <p className="text-2xl font-bold text-blue-600">{interview.communication_score}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Technical</p>
                  <p className="text-2xl font-bold text-green-600">{interview.technical_score}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Problem Solving</p>
                  <p className="text-2xl font-bold text-purple-600">{interview.problem_solving_score}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-orange-600">{interview.confidence_score}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Q&A Review */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">💬 Question & Answer Review</h3>
            <div className="space-y-6">
              {interview.questions && interview.questions.map((qa, idx) => (
                <div key={idx} className="border-l-4 border-indigo-600 pl-6 pb-6">
                  {/* Question */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Question {idx + 1}</p>
                    <h4 className="text-lg font-bold text-gray-900">{qa.question}</h4>
                  </div>

                  {/* Your Answer */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Your Answer:</p>
                    <p className="text-gray-800">{qa.answer}</p>
                  </div>

                  {/* Score & Feedback */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600">
                          <span className="text-white font-bold">{qa.score}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="font-bold text-gray-900">Out of 100</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Feedback:</p>
                      <p className="text-gray-800 font-semibold">{qa.feedback}</p>
                    </div>
                  </div>

                  {/* Audio Playback */}
                  {qa.audio_url && (
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all"
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        {isPlaying ? 'Pause' : 'Play'} Recording
                      </button>
                      <audio ref={(audio) => audio && isPlaying && audio.play()} src={qa.audio_url} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Feedback & Tips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">✨ Strengths</h3>
              <div className="space-y-2">
                {interview.strengths && interview.strengths.map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xl">✓</span>
                    <span className="text-gray-800">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas to Improve */}
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Areas to Improve</h3>
              <div className="space-y-2">
                {interview.areas_to_improve && interview.areas_to_improve.map((area, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xl">⚠</span>
                    <span className="text-gray-800">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => downloadInterview(interview.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 text-gray-700 font-semibold transition-all"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() => shareInterview(interview)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 text-gray-700 font-semibold transition-all"
            >
              <Share2 size={18} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 text-gray-700 font-semibold transition-all">
              <MessageCircle size={18} />
              <span className="hidden sm:inline">Comment</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
              <ThumbsUp size={18} />
              <span className="hidden sm:inline">Helpful</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📹 Interview Replay</h1>
          <p className="text-gray-600">Review your past interviews and track your improvement</p>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { value: 'recent', label: '⏰ Most Recent' },
            { value: 'score', label: '⭐ Highest Score' },
            { value: 'oldest', label: '📅 Oldest First' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                sortBy === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Interviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No interviews yet. Start your first interview!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedInterview(interview)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer p-6 border-l-4 border-indigo-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Date & Type */}
                  <div>
                    <p className="text-sm text-gray-600">
                      {new Date(interview.created_at).toLocaleDateString()}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900">
                      {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
                    </h3>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <div className={`text-sm font-bold px-3 py-1 rounded-full w-fit ${
                      interview.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      interview.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {interview.difficulty.charAt(0).toUpperCase() + interview.difficulty.slice(1)}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-lg font-bold text-gray-900">{interview.duration} mins</p>
                  </div>

                  {/* Score */}
                  <div className="flex items-end justify-between md:block">
                    <div>
                      <p className="text-sm text-gray-600">Score</p>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-indigo-600">{interview.score}</div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-indigo-600 rounded-full"
                            style={{ width: `${interview.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="hidden md:flex justify-end">
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all">
                      <Play size={16} /> Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
