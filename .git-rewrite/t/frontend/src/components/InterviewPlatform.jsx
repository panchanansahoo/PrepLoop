import React, { useState, useEffect } from 'react';
import InterviewStart from './InterviewStart';
import InterviewSession from './InterviewSession';
import InterviewComplete from './InterviewComplete';
import InterviewHistory from './InterviewHistory';
import InterviewAnalytics from './InterviewAnalytics';
import InterviewRecommendations from './InterviewRecommendations';

export default function InterviewPlatform() {
  const [activeTab, setActiveTab] = useState('start'); // 'start', 'session', 'history', 'analytics', 'recommendations'
  const [currentInterview, setCurrentInterview] = useState(null);
  const [sessionConfig, setSessionConfig] = useState(null);

  const handleStartInterview = (config) => {
    setSessionConfig(config);
    setCurrentInterview({
      questions: config.questions || [],
      responses: [],
      feedback: [],
      startTime: Date.now()
    });
    setActiveTab('session');
  };

  const handleCompleteInterview = (responses, scores) => {
    const interview = {
      ...currentInterview,
      responses,
      scores,
      completedAt: Date.now()
    };
    setCurrentInterview(interview);
    setActiveTab('complete');
  };

  const handleViewHistory = () => {
    setActiveTab('history');
  };

  const handleViewAnalytics = () => {
    setActiveTab('analytics');
  };

  const handleViewRecommendations = () => {
    setActiveTab('recommendations');
  };

  const handleNewInterview = () => {
    setCurrentInterview(null);
    setSessionConfig(null);
    setActiveTab('start');
  };

  return (
    <div className="interview-platform min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('start')}
              className={`py-4 px-6 font-medium text-sm cursor-pointer transition-colors border-b-2 ${
                activeTab === 'start'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Start Interview
            </button>
            <button
              onClick={handleViewHistory}
              className={`py-4 px-6 font-medium text-sm cursor-pointer transition-colors border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              History
            </button>
            <button
              onClick={handleViewAnalytics}
              className={`py-4 px-6 font-medium text-sm cursor-pointer transition-colors border-b-2 ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={handleViewRecommendations}
              className={`py-4 px-6 font-medium text-sm cursor-pointer transition-colors border-b-2 ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'start' && (
          <InterviewStart onStartInterview={handleStartInterview} />
        )}

        {activeTab === 'session' && currentInterview && (
          <InterviewSession
            interview={currentInterview}
            config={sessionConfig}
            onComplete={handleCompleteInterview}
          />
        )}

        {activeTab === 'complete' && currentInterview && (
          <InterviewComplete
            interview={currentInterview}
            onNewInterview={handleNewInterview}
          />
        )}

        {activeTab === 'history' && (
          <InterviewHistory onSelectInterview={(interview) => {
            setCurrentInterview(interview);
            setActiveTab('complete');
          }} />
        )}

        {activeTab === 'analytics' && (
          <InterviewAnalytics />
        )}

        {activeTab === 'recommendations' && (
          <InterviewRecommendations />
        )}
      </div>
    </div>
  );
}
