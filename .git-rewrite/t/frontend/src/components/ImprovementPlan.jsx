import { useState, useEffect } from 'react';
import { improvementPlan } from '../api/aiService';

export default function ImprovementPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchLatestPlan();
  }, []);

  const fetchLatestPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await improvementPlan.getLatest();
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      const data = await improvementPlan.generate({ timeframe: 7 });
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const markTaskComplete = async (day, taskIndex) => {
    if (!plan) return;

    try {
      const completedTask = {
        day,
        taskIndex,
        completedAt: new Date().toISOString()
      };

      const existingTasks = plan.progress?.completedTasks || [];
      const updatedTasks = [...existingTasks, completedTask];

      const updated = await improvementPlan.updateProgress(
        plan.id,
        updatedTasks,
        plan.progress?.notes || ''
      );

      setPlan(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const isTaskCompleted = (day, taskIndex) => {
    if (!plan?.progress?.completedTasks) return false;
    return plan.progress.completedTasks.some(
      t => t.day === day && t.taskIndex === taskIndex
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading your improvement plan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={fetchLatestPlan}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">AI Interview Improvement Plan</h2>
        <p className="text-gray-600 mb-6">
          Generate a personalized improvement plan based on your interview performance
        </p>
        <button
          onClick={generateNewPlan}
          disabled={generating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Improvement Plan'}
        </button>
      </div>
    );
  }

  const { plan_data } = plan;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">Your Improvement Plan</h1>
          <button
            onClick={generateNewPlan}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate New Plan'}
          </button>
        </div>
        <p className="text-gray-600">{plan_data.summary}</p>
      </div>

      {/* Top Weaknesses */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Top Areas to Improve</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plan_data.topWeaknesses.map((weakness) => (
            <div
              key={weakness.area}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <h3 className="font-semibold capitalize mb-2">
                {weakness.area.replace(/_/g, ' ')}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      weakness.intensity === 'high'
                        ? 'bg-red-500'
                        : weakness.intensity === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${weakness.weaknessLevel}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{weakness.weaknessLevel}%</span>
              </div>
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${
                  weakness.intensity === 'high'
                    ? 'bg-red-100 text-red-800'
                    : weakness.intensity === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {weakness.intensity} priority
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Plan */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Daily Practice Plan</h2>
        <div className="space-y-4">
          {plan_data.dailyPlan.map((dayPlan) => (
            <div key={dayPlan.day} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Day {dayPlan.day}</h3>
                  <p className="text-gray-600 capitalize">
                    Focus: {dayPlan.focusArea.replace(/_/g, ' ')}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  ~{dayPlan.estimatedTime} min
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                <strong>Goal:</strong> {dayPlan.goal}
              </p>

              <ul className="space-y-2">
                {dayPlan.tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isTaskCompleted(dayPlan.day, idx)}
                      onChange={() => markTaskComplete(dayPlan.day, idx)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                    />
                    <span className={isTaskCompleted(dayPlan.day, idx) ? 'line-through text-gray-500' : ''}>
                      {task}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {plan_data.recommendations && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Recommendations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {plan_data.recommendations.immediate_actions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Immediate Actions</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {plan_data.recommendations.immediate_actions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {plan_data.recommendations.practice_focus && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Practice Focus</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {plan_data.recommendations.practice_focus.map((focus, idx) => (
                    <li key={idx}>{focus}</li>
                  ))}
                </ul>
              </div>
            )}

            {plan_data.recommendations.mindset_tips && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Mindset Tips</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {plan_data.recommendations.mindset_tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {plan_data.recommendations.resources && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Recommended Resources</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {plan_data.recommendations.resources.map((resource, idx) => (
                    <li key={idx}>{resource}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Milestones */}
      {plan_data.milestones && plan_data.milestones.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Milestones</h2>
          <div className="space-y-3">
            {plan_data.milestones.map((milestone, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {milestone.day}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold capitalize">{milestone.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {milestone.criteria.map((criterion, i) => (
                        <li key={i}>• {criterion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
