import { useState, useEffect } from 'react';
import { improvementPlan } from '../api/aiService';
import { Link } from 'react-router-dom';

export default function ImprovementPlanWidget() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const data = await improvementPlan.getLatest();
      setPlan(data);
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-100">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          🎯 AI Improvement Plan
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Get personalized recommendations based on your interview performance
        </p>
        <Link
          to="/improvement-plan"
          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          Generate Your Plan
        </Link>
      </div>
    );
  }

  const { plan_data, progress } = plan;
  const totalTasks = plan_data.dailyPlan.reduce((sum, day) => sum + day.tasks.length, 0);
  const completedCount = progress?.completedTasks?.length || 0;
  const completionRate = Math.round((completedCount / totalTasks) * 100);
  const currentDay = Math.min(
    Math.floor((Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1,
    plan_data.timeframe
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          🎯 Your Improvement Plan
        </h3>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          Day {currentDay}/{plan_data.timeframe}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-800">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Top Weakness */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Top Focus Area:</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize">
            {plan_data.topWeaknesses[0]?.area.replace(/_/g, ' ')}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              plan_data.topWeaknesses[0]?.intensity === 'high'
                ? 'bg-red-100 text-red-800'
                : plan_data.topWeaknesses[0]?.intensity === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {plan_data.topWeaknesses[0]?.intensity}
          </span>
        </div>
      </div>

      {/* Today's Tasks */}
      {plan_data.dailyPlan[currentDay - 1] && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-medium text-blue-800 mb-1">Today's Focus:</p>
          <p className="text-sm text-gray-700 capitalize">
            {plan_data.dailyPlan[currentDay - 1].focusArea.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {plan_data.dailyPlan[currentDay - 1].tasks.length} tasks • ~
            {plan_data.dailyPlan[currentDay - 1].estimatedTime} min
          </p>
        </div>
      )}

      <Link
        to="/improvement-plan"
        className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition"
      >
        View Full Plan →
      </Link>
    </div>
  );
}
