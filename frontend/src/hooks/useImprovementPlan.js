import { useState, useEffect, useCallback } from 'react';
import { improvementPlan } from '../api/aiService';

/**
 * Custom hook for managing improvement plan state and operations
 * @param {boolean} autoFetch - Whether to automatically fetch the latest plan on mount
 * @returns {Object} Plan state and operations
 */
export function useImprovementPlan(autoFetch = true) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch latest plan — accepts a signal for abort support
  const fetchLatest = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const data = await improvementPlan.getLatest();
      // Don't update state if the request was aborted
      if (signal?.aborted) return null;
      setPlan(data);
      return data;
    } catch (err) {
      if (err?.name === 'AbortError' || signal?.aborted) return null;
      setError(err.message);
      throw err;
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Generate new plan
  const generate = useCallback(async (options = {}) => {
    try {
      setGenerating(true);
      setError(null);
      const data = await improvementPlan.generate(options);
      setPlan(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  // Update progress
  const updateProgress = useCallback(async (completedTasks, notes = '') => {
    if (!plan) {
      throw new Error('No active plan');
    }

    try {
      setError(null);
      const updated = await improvementPlan.updateProgress(
        plan.id,
        completedTasks,
        notes
      );
      setPlan(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [plan]);

  // Mark task as complete
  const completeTask = useCallback(async (day, taskIndex, notes = '') => {
    if (!plan) return;

    const existingTasks = plan.progress?.completedTasks || [];
    
    // Check if already completed
    const alreadyCompleted = existingTasks.some(
      t => t.day === day && t.taskIndex === taskIndex
    );

    if (alreadyCompleted) return plan;

    const newTask = {
      day,
      taskIndex,
      completedAt: new Date().toISOString()
    };

    const updatedTasks = [...existingTasks, newTask];
    return updateProgress(updatedTasks, notes);
  }, [plan, updateProgress]);

  // Uncomplete task
  const uncompleteTask = useCallback(async (day, taskIndex) => {
    if (!plan) return;

    const existingTasks = plan.progress?.completedTasks || [];
    const updatedTasks = existingTasks.filter(
      t => !(t.day === day && t.taskIndex === taskIndex)
    );

    return updateProgress(updatedTasks, plan.progress?.notes || '');
  }, [plan, updateProgress]);

  // Check if task is completed
  const isTaskCompleted = useCallback((day, taskIndex) => {
    if (!plan?.progress?.completedTasks) return false;
    return plan.progress.completedTasks.some(
      t => t.day === day && t.taskIndex === taskIndex
    );
  }, [plan]);

  // Get completion statistics
  const getStats = useCallback(() => {
    if (!plan) return null;

    const totalTasks = plan.plan_data.dailyPlan.reduce(
      (sum, day) => sum + day.tasks.length,
      0
    );
    const completedCount = plan.progress?.completedTasks?.length || 0;
    const completionRate = totalTasks > 0 
      ? Math.round((completedCount / totalTasks) * 100) 
      : 0;

    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentDay = Math.min(daysSinceCreated + 1, plan.plan_data.timeframe);

    const todaysPlan = plan.plan_data.dailyPlan[currentDay - 1];
    const todaysTasksCompleted = todaysPlan
      ? todaysPlan.tasks.filter((_, idx) => 
          isTaskCompleted(currentDay, idx)
        ).length
      : 0;

    return {
      totalTasks,
      completedCount,
      completionRate,
      currentDay,
      totalDays: plan.plan_data.timeframe,
      todaysPlan,
      todaysTasksCompleted,
      todaysTotalTasks: todaysPlan?.tasks.length || 0
    };
  }, [plan, isTaskCompleted]);

  // Get next milestone
  const getNextMilestone = useCallback(() => {
    if (!plan?.plan_data?.milestones) return null;

    const stats = getStats();
    if (!stats) return null;

    return plan.plan_data.milestones.find(
      m => m.day >= stats.currentDay
    );
  }, [plan, getStats]);

  // Auto-fetch on mount with proper cleanup
  useEffect(() => {
    if (!autoFetch) return;

    const controller = new AbortController();
    fetchLatest(controller.signal);

    return () => {
      controller.abort();
    };
  }, [autoFetch, fetchLatest]);

  return {
    plan,
    loading,
    error,
    generating,
    fetchLatest,
    generate,
    updateProgress,
    completeTask,
    uncompleteTask,
    isTaskCompleted,
    getStats,
    getNextMilestone,
    hasPlan: !!plan
  };
}

export default useImprovementPlan;
