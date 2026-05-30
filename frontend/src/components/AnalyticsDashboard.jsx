import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {TrendingUp, Award, Calendar, Target, Zap} from 'lucide-react';

/**
 * Comprehensive Analytics Dashboard
 * Shows interview performance metrics, trends, and insights
 */
export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // week, month, all

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/analytics/dashboard?range=${timeRange}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available yet. Start practicing!</p>
      </div>
    );
  }

  const performanceTrendData = analyticsData.performance_trend || [];
  const questionTypeData = analyticsData.question_type_scores || [];
  const difficultyData = analyticsData.difficulty_distribution || [];
  const categoryScores = analyticsData.category_scores || [];

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Interview Analytics</h1>
          <p className="text-gray-600">Track your progress and identify improvement areas</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-8">
          {['week', 'month', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {range === 'week' ? '📅 This Week' : range === 'month' ? '📆 This Month' : '📈 All Time'}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Average Score */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-semibold">Avg Score</span>
              <Award size={24} className="text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-indigo-600">
              {Math.round(analyticsData.average_score || 0)}
            </div>
            <p className="text-sm text-gray-500 mt-2">Out of 100</p>
          </div>

          {/* Interviews Completed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-semibold">Interviews</span>
              <Zap size={24} className="text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-500">
              {analyticsData.total_interviews || 0}
            </div>
            <p className="text-sm text-gray-500 mt-2">In this period</p>
          </div>

          {/* Improvement */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-semibold">Improvement</span>
              <TrendingUp size={24} className="text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-500">
              +{analyticsData.improvement_percentage || 0}%
            </div>
            <p className="text-sm text-gray-500 mt-2">Since start</p>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 font-semibold">Streak</span>
              <Calendar size={24} className="text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {analyticsData.current_streak || 0}
            </div>
            <p className="text-sm text-gray-500 mt-2">Days active</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Performance Trend</h3>
            {performanceTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ fill: '#4f46e5' }}
                    name="Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Question Type Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 By Question Type</h3>
            {questionTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#4f46e5" name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Difficulty Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Difficulty Distribution</h3>
            {difficultyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {difficultyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📚 By Category</h3>
            <div className="space-y-3">
              {categoryScores && categoryScores.length > 0 ? (
                categoryScores.map((category, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-700">{category.name}</span>
                      <span className="font-bold text-indigo-600">{category.score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Strengths */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">✨ Top Strengths</h3>
            <div className="space-y-3">
              {analyticsData.top_strengths && analyticsData.top_strengths.length > 0 ? (
                analyticsData.top_strengths.map((strength, idx) => (
                  <div key={idx} className="bg-green-50 border-l-4 border-green-500 p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">✓</span>
                      <div>
                        <p className="font-semibold text-gray-900">{strength.name}</p>
                        <p className="text-xs text-gray-600">Score: {strength.score}/100</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </div>

          {/* Areas to Improve */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Areas to Improve</h3>
            <div className="space-y-3">
              {analyticsData.areas_to_improve && analyticsData.areas_to_improve.length > 0 ? (
                analyticsData.areas_to_improve.map((area, idx) => (
                  <div key={idx} className="bg-orange-50 border-l-4 border-orange-500 p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">⚠</span>
                      <div>
                        <p className="font-semibold text-gray-900">{area.name}</p>
                        <p className="text-xs text-gray-600">Score: {area.score}/100</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {analyticsData.recommendations && analyticsData.recommendations.length > 0 && (
          <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={24} className="text-indigo-600" />
              Personalized Recommendations
            </h3>
            <div className="space-y-3">
              {analyticsData.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
                  <p className="font-semibold text-gray-900 mb-1">{rec.title}</p>
                  <p className="text-gray-700 text-sm">{rec.description}</p>
                  {rec.action_url && (
                    <a
                      href={rec.action_url}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold mt-2 inline-block"
                    >
                      Start Learning →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
