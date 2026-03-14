import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Filter, ChevronRight, Clock } from 'lucide-react';

export default function InterviewHistory({ userId }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchInterviewHistory();
  }, []);

  const fetchInterviewHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5003/api/interview/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error('Error fetching interview history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterviews = interviews
    .filter(interview => selectedType === 'all' || interview.type === selectedType)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'score') {
        return (b.score || 0) - (a.score || 0);
      }
      return 0;
    });

  const getScoreBadgeColor = (score) => {
    if (score >= 85) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (score >= 70) return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    if (score >= 55) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Average';
    return 'Needs Improvement';
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      easy: 'bg-green-500/20 text-green-400',
      medium: 'bg-blue-500/20 text-blue-400',
      hard: 'bg-red-500/20 text-red-400'
    };
    return colors[difficulty] || colors.medium;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          Interview History
        </h1>
        <p className="text-slate-400 mt-2">Review your past interviews and track your progress</p>
      </div>

      {/* Stats Overview */}
      {interviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Total Interviews</p>
            <p className="text-2xl font-bold text-white">{interviews.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Avg Score</p>
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length)}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Best Score</p>
            <p className="text-2xl font-bold text-green-400">
              {Math.max(...interviews.map(i => i.score || 0))}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Most Practiced</p>
            <p className="text-2xl font-bold text-purple-400">
              {interviews.length > 0
                ? Object.entries(
                    interviews.reduce((acc, i) => {
                      acc[i.type] = (acc[i.type] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                : 'N/A'
              }
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Technical">Technical</option>
            <option value="Behavioral">Behavioral</option>
            <option value="System Design">System Design</option>
            <option value="Coding">Coding</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="score">Highest Score</option>
          </select>
        </div>
      </div>

      {/* Interview List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredInterviews.length > 0 ? (
        <div className="space-y-3">
          {filteredInterviews.map((interview, idx) => (
            <div
              key={idx}
              className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg p-5 transition-all cursor-pointer hover:bg-slate-700"
              onClick={() => window.open(`/interview/${interview.id}`, '_blank')}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white capitalize">
                      {interview.type || 'Interview'}
                    </h3>
                    <span className={`text-xs font-bold py-1 px-2 rounded-full border ${getDifficultyBadge(interview.difficulty)}`}>
                      {interview.difficulty || 'medium'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(interview.created_at)}
                    </span>
                    {interview.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        ~{interview.duration} mins
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <div className={`text-2xl font-bold py-1 px-3 rounded-lg border ${getScoreBadgeColor(interview.score || 0)}`}>
                      {Math.round(interview.score || 0)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{getScoreLabel(interview.score || 0)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </div>

              {interview.feedback && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-sm text-slate-300 line-clamp-2">
                    {typeof interview.feedback === 'string' ? interview.feedback : interview.feedback.assessment || 'No feedback'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
          <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No interviews yet</p>
          <p className="text-sm text-slate-500">Start your first interview to see it here</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && interviews.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg">
          <Calendar className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Interviews Yet</h3>
          <p className="text-slate-400 mb-6">Start practicing interviews to build your history and track progress</p>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all">
            Start First Interview
          </button>
        </div>
      )}
    </div>
  );
}
