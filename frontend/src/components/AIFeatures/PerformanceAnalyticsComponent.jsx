import React, { useState, useEffect } from 'react';
import {
  getPerformanceTrends,
  getInterviewHistory,
  getCodeReviewHistory
} from '../../api/aiService';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Award,
  AlertCircle,
  Loader,
  Target
} from 'lucide-react';

const PerformanceAnalyticsComponent = () => {
  const [trends, setTrends] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [selectedType]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [trendsData, interviewsData, reviewsData] = await Promise.all([
        getPerformanceTrends(selectedType),
        getInterviewHistory(1, 5),
        getCodeReviewHistory(1, 5)
      ]);

      setTrends(trendsData);
      setInterviews(interviewsData.data || interviewsData);
      setReviews(reviewsData.data || reviewsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load performance analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="text-blue-600" />
          Performance Analytics
        </h2>
        <p className="text-gray-600 mt-2">Track your progress across all AI features</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-1 flex-shrink-0" />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter by Interview Type:</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-lg transition ${
              selectedType === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {['dsa', 'system_design', 'behavioral', 'mixed'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg transition capitalize ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Trends Section */}
      {trends && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" />
            Performance Trends
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Attempts */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Total Attempts</p>
              <p className="text-3xl font-bold text-blue-600">
                {trends.total_attempts || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">Across all features</p>
            </div>

            {/* Average Score */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Average Score</p>
              <p className="text-3xl font-bold text-green-600">
                {trends.average_score?.toFixed(1) || 0}/10
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {trends.score_trend === 'up' ? '📈 Improving' : '📉 Declining'}
              </p>
            </div>

            {/* Best Category */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Best Category</p>
              <p className="text-lg font-bold text-purple-600 capitalize">
                {trends.best_category?.replace(/_/g, ' ') || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Score: {trends.best_category_score?.toFixed(1)}/10
              </p>
            </div>

            {/* Needs Work */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Needs Work</p>
              <p className="text-lg font-bold text-orange-600 capitalize">
                {trends.needs_work_category?.replace(/_/g, ' ') || 'None'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Score: {trends.needs_work_score?.toFixed(1)}/10
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          {trends.category_breakdown && (
            <div className="mt-6 pt-6 border-t">
              <p className="font-semibold text-gray-900 mb-4">Category Breakdown</p>
              <div className="space-y-3">
                {Object.entries(trends.category_breakdown).map(([category, stats]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 capitalize mb-1">
                        {category.replace(/_/g, ' ')}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(stats.average_score * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-700 ml-4">
                      {stats.average_score?.toFixed(1)}/10
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Interviews */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Recent Interviews
        </h3>

        {interviews.length > 0 ? (
          <div className="space-y-3">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 capitalize">
                    {interview.type?.replace(/_/g, ' ') || 'Interview'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Difficulty: <span className="font-semibold capitalize">{interview.difficulty}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(interview.created_at).toLocaleDateString()} at{' '}
                    {new Date(interview.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {interview.score?.toFixed(1) || interview.overall_score?.toFixed(1) || 'N/A'}/10
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {interview.status || 'completed'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No interviews yet. Start one to see your history!</p>
        )}
      </div>

      {/* Recent Code Reviews */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="text-green-600" />
          Recent Code Reviews
        </h3>

        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Problem #{review.problem_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Language: <span className="font-semibold capitalize">{review.language}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {review.overall_score?.toFixed(1) || 'N/A'}/10
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {review.performance_level || 'Good'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No code reviews yet. Submit one to see your history!</p>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Target className="text-blue-600" />
          Personalized Recommendations
        </h3>
        <ul className="space-y-2 text-blue-900 text-sm">
          <li>✓ Focus on improving System Design interviews - your weakest category</li>
          <li>✓ Great progress on DSA problems! Keep practicing to maintain momentum</li>
          <li>✓ Consider doing a mixed interview to test diverse skills</li>
          <li>✓ Submit more code reviews to get better feedback on coding practices</li>
        </ul>
      </div>
    </div>
  );
};

export default PerformanceAnalyticsComponent;
