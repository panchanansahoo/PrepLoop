import { useEffect, useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, TrendingUp, Target } from 'lucide-react';

import { authFetch } from '../utils/authFetch';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/api.js';

export default function InterviewAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [_selectedMetric,_setSelectedMetricc] = useState('overall');
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_URL}/api/analytics/overview`);

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
    if (score >= 85) return 'from-emerald-500 to-emerald-400';
    if (score >= 70) return 'from-indigo-500 to-indigo-400';
    if (score >= 55) return 'from-amber-500 to-amber-400';
    return 'from-rose-500 to-rose-400';
  };

  const panelBg = isLight 
    ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))'
    : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))';
  const panelBorder = isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)';
  const textColor = isLight ? 'text-slate-800' : 'text-white';
  const subTextColor = isLight ? 'text-slate-500' : 'text-slate-400';

  const MetricCard = ({ label, value, unit = '', icon: Icon = BarChart3 }) => (
    <div className="relative overflow-hidden group transition-all duration-300 hover:-translate-y-1" style={{
      background: panelBg, borderRadius: 24, border: panelBorder, padding: '24px',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      boxShadow: isLight
        ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)'
        : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
    }}>
      <div className="flex items-center justify-between mb-4">
        <p className={`font-semibold ${subTextColor}`}>{label}</p>
        <div className={`p-2 rounded-xl bg-opacity-10 ${isLight ? 'bg-indigo-100' : 'bg-indigo-400/20'}`}>
          <Icon className={`w-5 h-5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
        </div>
      </div>
      <p className={`text-4xl font-extrabold ${textColor} tracking-tight`}>{value}<span className="text-xl font-medium opacity-50 ml-1">{unit}</span></p>
    </div>
  );

  const ScoreBreakdown = ({ title, breakdown }) => (
    <div className="transition-all duration-300 hover:shadow-xl" style={{
      background: panelBg, borderRadius: 24, border: panelBorder, padding: '24px',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)'
    }}>
      <h3 className={`text-lg font-bold ${textColor} mb-6`}>{title}</h3>
      <div className="space-y-4">
        {breakdown && Object.entries(breakdown).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium capitalize ${subTextColor}`}>{key}</span>
              <span className={`text-sm font-bold ${textColor}`}>{Math.round(value?.avg) || 0}</span>
            </div>
            <div className={`w-full rounded-full h-2 ${isLight ? 'bg-slate-100' : 'bg-slate-700/50'}`}>
              <div
                className={`bg-gradient-to-r ${getScoreColor(value?.avg)} rounded-full h-2 transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min((value?.avg || 0) / 100 * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style>{`
        .bg-opacity-10 { opacity: 0.9; }
      `}</style>
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-extrabold flex items-center gap-3 ${textColor}`}>
          <div className={`p-2 rounded-xl ${isLight ? 'bg-indigo-100' : 'bg-indigo-500/20'}`}>
            <BarChart3 className={`w-8 h-8 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
          </div>
          Performance Analytics
        </h1>
        <p className={`mt-3 font-medium ${subTextColor}`}>Track your interview preparation progress and unlock insights.</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`rounded-3xl p-6 h-40 animate-pulse ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
              ))}
          </div>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              label="Total Interviews"
              value={analytics.totalInterviews || 0}
              icon={Target}
            />
            <MetricCard
              label="Avg Overall Score"
              value={Math.round(analytics.averageOverallScore || 0)}
              unit="%"
              icon={TrendingUp}
            />
            <MetricCard
              label="Best Score"
              value={Math.round(analytics.bestScore || 0)}
              unit="%"
              icon={BarChart3}
            />
            <MetricCard
              label="Current Streak"
              value={analytics.currentStreak || 0}
              unit="🔥"
              icon={LineChartIcon}
            />
          </div>

          {/* Metric Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              label="Communication"
              value={Math.round(analytics.averageCommunicationScore || 0)}
              icon={BarChart3}
            />
            <MetricCard
              label="Technical"
              value={Math.round(analytics.averageTechnicalScore || 0)}
              icon={BarChart3}
            />
            <MetricCard
              label="Problem Solving"
              value={Math.round(analytics.averageProblemSolvingScore || 0)}
              icon={BarChart3}
            />
            <MetricCard
              label="Consistency"
              value={Math.round(analytics.consistency || 0)}
              unit="%"
              icon={BarChart3}
            />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            {analytics.recentTrend && analytics.recentTrend.length > 0 && (
              <div style={{
                background: panelBg, borderRadius: 24, border: panelBorder, padding: '28px',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)'
              }}>
                <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 ${textColor}`}>
                  <LineChartIcon className="w-5 h-5" />
                  Recent Score Trend
                </h3>

                <div className="space-y-4">
                  {analytics.recentTrend.slice(-10).map((entry, idx) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${subTextColor}`}>
                          Interview {analytics.totalInterviews - (analytics.recentTrend.length - 1 - idx)}
                        </span>
                        <span className={`text-sm font-bold ${textColor}`}>{Math.round(entry.score)}</span>
                      </div>
                      <div className={`w-full rounded-full h-3 ${isLight ? 'bg-slate-100' : 'bg-slate-700/50'}`}>
                        <div
                          className={`bg-gradient-to-r ${getScoreColor(entry.score)} rounded-full h-3 transition-all duration-700 ease-out group-hover:opacity-80`}
                          style={{ width: `${Math.min(entry.score / 100 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`mt-6 p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                  <p className={`text-sm font-medium ${textColor}`}>
                    📈 Your trend: <span className="font-bold text-indigo-500">
                      {analytics.scoreTrend > 0 ? '📈 Improving' : analytics.scoreTrend < 0 ? '📉 Declining' : '➡️ Stable'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
                {/* Recommendations */}
                <div style={{
                    background: isLight ? 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.05))' : 'linear-gradient(135deg, rgba(88,28,135,0.2), rgba(30,58,138,0.2))',
                    borderRadius: 24, border: isLight ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(168,85,247,0.3)', padding: '28px'
                }}>
                    <h3 className={`text-lg font-bold mb-4 ${textColor}`}>✨ AI Insights</h3>
                    <ul className={`space-y-3 font-medium text-sm ${subTextColor}`}>
                    {analytics.averageCommunicationScore < 70 && (
                        <li className="flex items-start gap-3">
                        <span className="text-amber-500 mt-0.5 text-lg">⚠️</span>
                        <span>Your communication is below average. Focus on clear articulation.</span>
                        </li>
                    )}
                    {analytics.averageTechnicalScore < 70 && (
                        <li className="flex items-start gap-3">
                        <span className="text-amber-500 mt-0.5 text-lg">⚠️</span>
                        <span>Deepen your technical knowledge through algorithm practice.</span>
                        </li>
                    )}
                    {analytics.totalInterviews > 5 && analytics.consistency < 60 && (
                        <li className="flex items-start gap-3">
                        <span className="text-amber-500 mt-0.5 text-lg">⚠️</span>
                        <span>Scores fluctuate. Practice more to build reliable stability.</span>
                        </li>
                    )}
                    {analytics.totalInterviews > 0 && analytics.averageOverallScore >= 80 && (
                        <li className="flex items-start gap-3">
                        <span className="text-emerald-500 mt-0.5 text-lg">✓</span>
                        <span>Excellent average! Challenge yourself with FAANG simulations.</span>
                        </li>
                    )}
                    {(!analytics.byType || Object.keys(analytics.byType).length < 4) && (
                        <li className="flex items-start gap-3">
                        <span className="text-indigo-500 mt-0.5 text-lg">💡</span>
                        <span>Attempt diverse interview types to become well-rounded.</span>
                        </li>
                    )}
                    </ul>
                </div>

                {/* Goals */}
                <div style={{
                    background: panelBg, borderRadius: 24, border: panelBorder, padding: '28px',
                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)'
                }}>
                    <h3 className={`text-lg font-bold mb-5 ${textColor}`}>Active Goals</h3>
                    <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${subTextColor}`}>Overall Target: 85+</span>
                        <span className={`font-bold ${textColor}`}>{Math.round(analytics.averageOverallScore || 0)}/85</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isLight ? 'bg-slate-100' : 'bg-slate-700/50'}`}>
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full h-2 transition-all duration-1000"
                            style={{ width: `${Math.min((analytics.averageOverallScore || 0) / 85 * 100, 100)}%` }}
                        />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${subTextColor}`}>Simulator Milestone</span>
                        <span className={`font-bold ${textColor}`}>{analytics.totalInterviews || 0}/20</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isLight ? 'bg-slate-100' : 'bg-slate-700/50'}`}>
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full h-2 transition-all duration-1000"
                            style={{ width: `${Math.min((analytics.totalInterviews || 0) / 20 * 100, 100)}%` }}
                        />
                        </div>
                    </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
            background: panelBg, borderRadius: 24, border: panelBorder, padding: '48px',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)'
        }} className="text-center">
          <div className={`inline-flex p-4 rounded-3xl mb-4 ${isLight ? 'bg-indigo-50' : 'bg-indigo-500/10'}`}>
            <BarChart3 className={`w-12 h-12 ${isLight ? 'text-indigo-300' : 'text-indigo-400/50'}`} />
          </div>
          <p className={`text-lg font-bold mb-2 ${textColor}`}>Awaiting Data Collection</p>
          <p className={`font-medium ${subTextColor}`}>Complete interviews to unlock your deep performance metrics here.</p>
        </div>
      )}
    </div>
  );
}
