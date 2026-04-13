import React, { useEffect, useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, TrendingUp, Target } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';

export default function InterviewAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overall');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5003/api/analytics/overview', {
        method: 'GET',
        headers: buildAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'from-green-500 to-green-400';
    if (score >= 70) return 'from-blue-500 to-blue-400';
    if (score >= 55) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  const MetricCard = ({ label, value, unit = '', icon: Icon }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 font-medium">{label}</p>
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <p className="text-4xl font-bold text-white">{value}{unit}</p>
    </div>
  );

  const ScoreBreakdown = ({ title, breakdown }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <div className="space-y-3">
        {breakdown && Object.entries(breakdown).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-slate-300 capitalize">{key}</span>
              <span className="text-sm font-bold text-white">{Math.round(value?.avg) || 0}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${getScoreColor(value?.avg)} rounded-full h-2 transition-all`}
                style={{ width: `${Math.min((value?.avg || 0) / 100 * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Performance Analytics
        </h1>
        <p className="text-slate-400 mt-2">Track your interview preparation progress</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-6 h-24 animate-pulse" />
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Interviews"
              value={analytics.totalInterviews || 0}
              icon={Target}
            />
            <MetricCard
              label="Avg Overall Score"
              value={Math.round(analytics.averageOverallScore || 0)}
              unit=""
              icon={TrendingUp}
            />
            <MetricCard
              label="Best Score"
              value={Math.round(analytics.bestScore || 0)}
              unit=""
              icon={BarChart3}
            />
            <MetricCard
              label="Current Streak"
              value={analytics.currentStreak || 0}
              unit=" interviews"
              icon={LineChartIcon}
            />
          </div>

          {/* Metric Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              label="Communication Avg"
              value={Math.round(analytics.averageCommunicationScore || 0)}
            />
            <MetricCard
              label="Technical Avg"
              value={Math.round(analytics.averageTechnicalScore || 0)}
            />
            <MetricCard
              label="Problem Solving Avg"
              value={Math.round(analytics.averageProblemSolvingScore || 0)}
            />
            <MetricCard
              label="Consistency"
              value={Math.round(analytics.consistency || 0)}
              unit="%"
            />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.byType && (
              <ScoreBreakdown
                title="Performance by Interview Type"
                breakdown={analytics.byType}
              />
            )}
            {analytics.byDifficulty && (
              <ScoreBreakdown
                title="Performance by Difficulty"
                breakdown={analytics.byDifficulty}
              />
            )}
          </div>

          {/* Trend Chart */}
          {analytics.recentTrend && analytics.recentTrend.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LineChartIcon className="w-5 h-5" />
                Recent Score Trend
              </h3>

              <div className="space-y-3">
                {analytics.recentTrend.slice(-10).map((entry, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-400">
                        Interview {analytics.totalInterviews - (10 - idx)}
                      </span>
                      <span className="text-sm font-bold text-white">{Math.round(entry.score)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className={`bg-gradient-to-r ${getScoreColor(entry.score)} rounded-full h-3 transition-all`}
                        style={{ width: `${Math.min(entry.score / 100 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-sm text-slate-300">
                  📈 Your trend: <span className="font-bold text-blue-400">
                    {analytics.scoreTrend > 0 ? '📈 Improving' : analytics.scoreTrend < 0 ? '📉 Declining' : '➡️ Stable'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">📊 Insights & Recommendations</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              {analytics.averageCommunicationScore < 70 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">⚠️</span>
                  <span>Your communication score is below average. Focus on clear articulation and structured responses.</span>
                </li>
              )}
              {analytics.averageTechnicalScore < 70 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">⚠️</span>
                  <span>Consider deepening your technical knowledge. Practice harder problems to build confidence.</span>
                </li>
              )}
              {analytics.totalInterviews > 5 && analytics.consistency < 60 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">⚠️</span>
                  <span>Your scores are inconsistent. Practice more to build stability in your performance.</span>
                </li>
              )}
              {analytics.totalInterviews > 0 && analytics.averageOverallScore >= 80 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Excellent performance! Try harder difficulty levels to further improve.</span>
                </li>
              )}
              {(!analytics.byType || Object.keys(analytics.byType).length < 4) && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">💡</span>
                  <span>Try all interview types to become a well-rounded candidate.</span>
                </li>
              )}
            </ul>
          </div>

          {/* Goal Progress */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Your Goals</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Overall Score Target: 85+</span>
                  <span className="text-white font-bold">{Math.round(analytics.averageOverallScore || 0)}/85</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-full h-2 transition-all"
                    style={{ width: `${Math.min((analytics.averageOverallScore || 0) / 85 * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Practice Goal: 20 Interviews</span>
                  <span className="text-white font-bold">{analytics.totalInterviews || 0}/20</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-400 rounded-full h-2 transition-all"
                    style={{ width: `${Math.min((analytics.totalInterviews || 0) / 20 * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No analytics data yet</p>
          <p className="text-sm text-slate-500">Complete interviews to see detailed analytics</p>
        </div>
      )}
    </div>
  );
}
