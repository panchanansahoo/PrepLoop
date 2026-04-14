import { useState, useEffect } from 'react';
import { useImprovementPlan } from '../hooks/useImprovementPlan';

export default function ImprovementPlanNotification() {
  const { plan, getStats } = useImprovementPlan();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissed state daily
    const lastDismissed = localStorage.getItem('improvement_plan_dismissed');
    const today = new Date().toDateString();
    
    if (lastDismissed !== today) {
      setDismissed(false);
    }
  }, []);

  if (!plan || dismissed) return null;

  const stats = getStats();
  if (!stats || !stats.todaysPlan) return null;

  // Don't show if all today's tasks are completed
  if (stats.todaysTasksCompleted === stats.todaysTotalTasks) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('improvement_plan_dismissed', new Date().toDateString());
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h3 className="font-semibold text-gray-800">Daily Practice Reminder</h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        You have {stats.todaysTotalTasks - stats.todaysTasksCompleted} task
        {stats.todaysTotalTasks - stats.todaysTasksCompleted !== 1 ? 's' : ''} remaining for today
      </p>

      <div className="bg-blue-50 rounded p-3 mb-3">
        <p className="text-xs font-medium text-blue-800 mb-1">Today's Focus:</p>
        <p className="text-sm text-gray-700 capitalize">
          {stats.todaysPlan.focusArea.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          ~{stats.todaysPlan.estimatedTime} minutes
        </p>
      </div>

      <div className="flex gap-2">
        <a
          href="/improvement-plan"
          className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
        >
          Start Now
        </a>
        <button
          onClick={handleDismiss}
          className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition"
        >
          Later
        </button>
      </div>
    </div>
  );
}
