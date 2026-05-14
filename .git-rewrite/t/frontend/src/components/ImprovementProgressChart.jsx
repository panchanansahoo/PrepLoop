import { useState, useEffect } from 'react';
import { improvementPlan } from '../api/aiService';

export default function ImprovementProgressChart() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await improvementPlan.getHistory(10);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading progress...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Progress History</h3>
        <p className="text-gray-600 text-sm">
          Complete your first improvement plan to see progress over time
        </p>
      </div>
    );
  }

  // Calculate completion rates for each plan
  const progressData = history.map(plan => {
    const totalTasks = plan.plan_data.dailyPlan.reduce(
      (sum, day) => sum + day.tasks.length,
      0
    );
    const completedCount = plan.progress?.completedTasks?.length || 0;
    const completionRate = totalTasks > 0 
      ? Math.round((completedCount / totalTasks) * 100) 
      : 0;

    return {
      id: plan.id,
      date: new Date(plan.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      completionRate,
      status: plan.status,
      topWeakness: plan.plan_data.topWeaknesses[0]?.area || 'N/A'
    };
  }).reverse(); // Show oldest to newest

  const maxRate = Math.max(...progressData.map(d => d.completionRate), 100);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Progress History</h3>

      {/* Chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-2 h-48">
          {progressData.map((data, idx) => (
            <div key={data.id} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end justify-center h-40">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer relative group"
                  style={{ height: `${(data.completionRate / maxRate) * 100}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {data.completionRate}% complete
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-2 text-center">
                {data.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {history.length}
          </div>
          <div className="text-xs text-gray-600">Total Plans</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {history.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(
              progressData.reduce((sum, d) => sum + d.completionRate, 0) / 
              progressData.length
            )}%
          </div>
          <div className="text-xs text-gray-600">Avg Completion</div>
        </div>
      </div>

      {/* Recent Focus Areas */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Focus Areas</h4>
        <div className="flex flex-wrap gap-2">
          {[...new Set(progressData.map(d => d.topWeakness))].slice(0, 5).map(area => (
            <span
              key={area}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize"
            >
              {area.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
