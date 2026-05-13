import React, { useState } from 'react';
import { Zap, BookOpen, Code, Users, Loader } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';
import { API_URL } from '../utils/safeApiUrl';

export default function InterviewStart({ onStartInterview }) {
  const [selectedType, setSelectedType] = useState('technical');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const interviewTypes = [
    { id: 'technical', label: 'Technical', icon: Code, desc: 'System design, DSA, architecture' },
    { id: 'behavioral', label: 'Behavioral', icon: Users, desc: 'Communication & soft skills' },
    { id: 'system-design', label: 'System Design', icon: BookOpen, desc: 'Scalable architecture' },
    { id: 'coding', label: 'Coding', icon: Zap, desc: 'Algorithm & Data Structures' }
  ];

  const difficulties = ['easy', 'medium', 'hard'];

  const handleStartInterview = async () => {
    if (!selectedType) {
      setError('Please select an interview type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/interview/start`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: selectedType,
          difficulty: selectedDifficulty,
          duration
        })
      });

      if (!response.ok) {
        throw new Error('Your interview couldn\'t be started. Please try again.');
      }

      const data = await response.json();
      const questions = Array.isArray(data.questions) ? data.questions : [];
      const firstQuestion = data.firstQuestion || data.question || questions[0] || null;
      onStartInterview({
        type: selectedType,
        difficulty: selectedDifficulty,
        duration,
        questions: questions.length > 0 ? questions : firstQuestion ? [firstQuestion] : [],
        firstQuestion,
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-white mb-4">Mock Interview Platform</h1>
        <p className="text-slate-300 text-lg">Practice with AI-powered real-time feedback</p>
      </div>

      {/* Interview Type Selection */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Select Interview Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {interviewTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-6 rounded-lg border-2 transition-all cursor-pointer group ${
                  selectedType === type.id
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg mb-1">{type.label}</h3>
                <p className="text-sm text-slate-400">{type.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Select Difficulty</h2>
        <div className="flex gap-4">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-6 py-3 rounded-lg font-medium transition-all capitalize ${
                selectedDifficulty === diff
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {diff}
              {diff === 'easy' && ' ⭐'}
              {diff === 'medium' && ' ⭐⭐'}
              {diff === 'hard' && ' ⭐⭐⭐'}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selection */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Interview Duration</h2>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="15"
            max="90"
            step="15"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-white font-bold text-lg w-20 text-right">{duration} min</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6 space-y-3">
        <h3 className="font-bold text-blue-300">💡 Tips for Success</h3>
        <ul className="space-y-2 text-blue-200 text-sm">
          <li>• Find a quiet place without distractions</li>
          <li>• Speak clearly and articulate your thoughts</li>
          <li>• Take your time to think through problems</li>
          <li>• Ask clarifying questions when needed</li>
          <li>• Get real-time AI feedback on your responses</li>
        </ul>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartInterview}
        disabled={loading || !selectedType}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Starting Interview...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Start Interview
          </>
        )}
      </button>
    </div>
  );
}
