import { useImprovementPlan } from '../hooks/useImprovementPlan';

export default function ImprovementPlanSimple() {
  const {
    plan,
    loading,
    error,
    generating,
    generate,
    completeTask,
    uncompleteTask,
    isTaskCompleted,
    getStats
  } = useImprovementPlan();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Generate Your Improvement Plan</h2>
        <button
          onClick={() => generate({ timeframe: 7 })}
          disabled={generating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>
    );
  }

  const stats = getStats();
  const { plan_data } = plan;

  const handleTaskToggle = async (day, taskIndex) => {
    if (isTaskCompleted(day, taskIndex)) {
      await uncompleteTask(day, taskIndex);
    } else {
      await completeTask(day, taskIndex);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Improvement Plan</h1>
            <p className="text-gray-600">
              Day {stats.currentDay} of {stats.totalDays}
            </p>
          </div>
          <button
            onClick={() => generate({ timeframe: 7 })}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            New Plan
          </button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span className="font-medium">
              {stats.completedCount}/{stats.totalTasks} tasks ({stats.completionRate}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <p className="text-gray-700">{plan_data.summary}</p>
      </div>

      {/* Top Weaknesses */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Focus Areas</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {plan_data.topWeaknesses.map((w) => (
            <div key={w.area} className="border rounded-lg p-4">
              <h3 className="font-medium capitalize mb-2">
                {w.area.replace(/_/g, ' ')}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      w.intensity === 'high' ? 'bg-red-500' :
                      w.intensity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${w.weaknessLevel}%` }}
                  />
                </div>
                <span className="text-xs">{w.weaknessLevel}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Tasks */}
      <div className="space-y-4">
        {plan_data.dailyPlan.map((dayPlan) => {
          const isToday = dayPlan.day === stats.currentDay;
          const dayCompleted = dayPlan.tasks.every((_, idx) => 
            isTaskCompleted(dayPlan.day, idx)
          );

          return (
            <div
              key={dayPlan.day}
              className={`bg-white rounded-lg shadow p-6 ${
                isToday ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Day {dayPlan.day}</h3>
                    {isToday && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Today
                      </span>
                    )}
                    {dayCompleted && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ Complete
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {dayPlan.focusArea.replace(/_/g, ' ')}
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
                {dayPlan.tasks.map((task, idx) => {
                  const completed = isTaskCompleted(dayPlan.day, idx);
                  return (
                    <li key={idx} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={completed}
                        onChange={() => handleTaskToggle(dayPlan.day, idx)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className={completed ? 'line-through text-gray-500' : ''}>
                        {task}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
