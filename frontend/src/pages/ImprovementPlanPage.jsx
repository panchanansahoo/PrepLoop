import { useState } from 'react';
import ImprovementPlanSimple from '../components/ImprovementPlanSimple';
import ImprovementProgressChart from '../components/ImprovementProgressChart';
import { useImprovementPlan } from '../hooks/useImprovementPlan';

export default function ImprovementPlanPage() {
  const [activeTab, setActiveTab] = useState('plan');
  const { plan, getStats, getNextMilestone } = useImprovementPlan();

  const stats = plan ? getStats() : null;
  const nextMilestone = plan ? getNextMilestone() : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            AI Interview Improvement Plan
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Personalized practice plans based on your interview performance
          </p>
        </div>
      </div>

      {/* Stats Bar (if plan exists) */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs opacity-90">Current Day</div>
                <div className="text-2xl font-bold">
                  {stats.currentDay}/{stats.totalDays}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-90">Tasks Completed</div>
                <div className="text-2xl font-bold">
                  {stats.completedCount}/{stats.totalTasks}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-90">Overall Progress</div>
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
              </div>
              <div>
                <div className="text-xs opacity-90">Today's Progress</div>
                <div className="text-2xl font-bold">
                  {stats.todaysTasksCompleted}/{stats.todaysTotalTasks}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('plan')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'plan'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Current Plan
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'progress'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Progress History
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'resources'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Resources
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'plan' && <ImprovementPlanSimple />}
            
            {activeTab === 'progress' && (
              <div className="space-y-6">
                <ImprovementProgressChart />
                
                {/* Additional Stats */}
                {plan && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Plan Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Plan Created:</span>
                        <span className="font-medium">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{plan.status}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Overall Trend:</span>
                        <span className="font-medium capitalize">
                          {plan.plan_data.overallTrend.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && plan && (
              <div className="space-y-6">
                {/* Recommendations */}
                {plan.plan_data.recommendations && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
                    
                    {plan.plan_data.recommendations.immediate_actions && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                          Immediate Actions
                        </h4>
                        <ul className="space-y-2">
                          {plan.plan_data.recommendations.immediate_actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-600 mt-0.5">→</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.plan_data.recommendations.practice_focus && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                          Practice Focus
                        </h4>
                        <ul className="space-y-2">
                          {plan.plan_data.recommendations.practice_focus.map((focus, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>{focus}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.plan_data.recommendations.mindset_tips && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                          Mindset Tips
                        </h4>
                        <ul className="space-y-2">
                          {plan.plan_data.recommendations.mindset_tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-purple-600 mt-0.5">💡</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Resources */}
                {plan.plan_data.resources && plan.plan_data.resources.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Recommended Resources</h3>
                    <div className="space-y-3">
                      {plan.plan_data.resources.map((resource, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <span className="text-2xl">
                            {resource.type === 'book' ? '📚' :
                             resource.type === 'course' ? '🎓' :
                             resource.type === 'video' ? '🎥' :
                             resource.type === 'practice' ? '💻' : '📄'}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{resource.title}</h4>
                            <p className="text-xs text-gray-600 capitalize">{resource.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Milestone */}
            {nextMilestone && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Next Milestone</h3>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="font-semibold">Day {nextMilestone.day}</span>
                  </div>
                  <h4 className="font-medium text-sm capitalize mb-2">
                    {nextMilestone.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {nextMilestone.description}
                  </p>
                  <div className="text-xs text-gray-600">
                    <strong>Criteria:</strong>
                    <ul className="mt-1 space-y-1">
                      {nextMilestone.criteria.map((criterion, idx) => (
                        <li key={idx}>• {criterion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Quick Tips</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <p className="text-gray-700">
                    Complete tasks daily for best results
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <p className="text-gray-700">
                    Track your progress with notes
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600">🎯</span>
                  <p className="text-gray-700">
                    Focus on one area at a time
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">🔄</span>
                  <p className="text-gray-700">
                    Generate new plans as you improve
                  </p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Stuck on a task or need guidance? We're here to help!
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                Get Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
