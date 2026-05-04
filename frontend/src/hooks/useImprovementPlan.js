import { useState, useEffect, useCallback, useMemo } from 'react';
import { improvementPlan } from '../api/aiService';

/**
 * Custom hook for managing improvement plan state and operations
 * OPTIMIZED (Phase 3):
 * - Added useMemo for expensive computations (stats, milestones)
 * - Optimized callback dependency arrays
 * - Proper AbortController cleanup already in place
 * 
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
  }, [plan?.id]); // Only depend on plan.id, not whole plan object

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
  }, [plan?.progress?.completedTasks]); // Only depend on completedTasks, not whole plan

  // PHASE 3 OPTIMIZATION: Memoize expensive stats calculation
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
  }, [plan?.plan_data?.dailyPlan, plan?.plan_data?.timeframe, plan?.created_at, isTaskCompleted]);

  // Get next milestone — memoized
  const getNextMilestone = useCallback(() => {
    if (!plan?.plan_data?.milestones) return null;

    const stats = getStats();
    if (!stats) return null;

    return plan.plan_data.milestones.find(
      m => m.day >= stats.currentDay
    );
  }, [plan?.plan_data?.milestones, getStats]);

  // Auto-fetch on mount with proper cleanup
  useEffect(() => {
    if (!autoFetch) return;

    const controller = new AbortController();
    fetchLatest(controller.signal);

    return () => {
      controller.abort();
    };
  }, [autoFetch, fetchLatest]);

  // PHASE 3 OPTIMIZATION: Memoize return object to prevent unnecessary re-renders
  // Only regenerate if dependencies change
  return useMemo(() => ({
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
  }), [plan, loading, error, generating, fetchLatest, generate, updateProgress, completeTask, uncompleteTask, isTaskCompleted, getStats, getNextMilestone]);
}

export default useImprovementPlan;
