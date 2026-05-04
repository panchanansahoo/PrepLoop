import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TaskItem } from './ImprovementPlan';

/**
 * VirtualizedDailyPlanSection - Lazy loads daily plan items using virtual scrolling
 * Only renders visible days + 2 day buffer above/below
 * Dramatically improves performance for plans with 20+ days
 */
export const VirtualizedDailyPlanSection = React.memo(({
  dailyPlan = [],
  isTaskCompleted,
  onToggleTask,
  bufferSize = 2
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: bufferSize * 2 });
  const containerRef = useRef(null);

  // Calculate visible items based on scroll position
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const itemHeight = 120; // Approximate height per day
    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const end = Math.min(
      dailyPlan.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
    );

    setVisibleRange({ start, end });
  }, [dailyPlan.length, bufferSize]);

  // Debounce scroll event
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId;
    const handleScrollDebounced = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };

    container.addEventListener('scroll', handleScrollDebounced);
    return () => {
      container.removeEventListener('scroll', handleScrollDebounced);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  // Memoize visible items to prevent unnecessary recalculations
  const visibleItems = useMemo(() => {
    return dailyPlan.slice(visibleRange.start, visibleRange.end);
  }, [dailyPlan, visibleRange]);

  // Total height for placeholder elements
  const offsetY = visibleRange.start * 120;
  const totalHeight = dailyPlan.length * 120;

  return (
    <div
      ref={containerRef}
      className="daily-plan-virtual-scroll"
      style={{
        height: '600px',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      {/* Spacer for items above viewport */}
      {visibleRange.start > 0 && (
        <div style={{ height: `${offsetY}px` }} />
      )}

      {/* Visible items */}
      {visibleItems.map((day, idx) => (
        <DailyPlanCard
          key={`day-${visibleRange.start + idx}`}
          day={day.day}
          theme={day.theme}
          tasks={day.tasks}
          isTaskCompleted={isTaskCompleted}
          onToggleTask={onToggleTask}
        />
      ))}

      {/* Spacer for items below viewport */}
      {visibleRange.end < dailyPlan.length && (
        <div style={{ height: `${totalHeight - (visibleRange.end * 120)}px` }} />
      )}
    </div>
  );
});

VirtualizedDailyPlanSection.displayName = 'VirtualizedDailyPlanSection';

/**
 * DailyPlanCard - Single day of the plan (memoized)
 */
const DailyPlanCard = React.memo(({
  day,
  theme,
  tasks = [],
  isTaskCompleted,
  onToggleTask
}) => (
  <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-semibold">
        Day {day}: {theme}
      </h3>
      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
        {tasks.filter((_, idx) => isTaskCompleted(day, idx)).length}/{tasks.length}
      </span>
    </div>
    <ul className="space-y-2">
      {tasks.map((task, idx) => (
        <TaskItem
          key={`${day}-${idx}`}
          text={task}
          completed={isTaskCompleted(day, idx)}
          onToggle={() => onToggleTask(day, idx)}
        />
      ))}
    </ul>
  </div>
));

DailyPlanCard.displayName = 'DailyPlanCard';

/**
 * useLazyLoadingConfig - Determines whether to use virtualization
 */
export function useLazyLoadingConfig(dailyPlanLength) {
  const USE_VIRTUALIZATION_THRESHOLD = 20; // Enable for 20+ days

  return useMemo(() => ({
    shouldVirtualize: dailyPlanLength >= USE_VIRTUALIZATION_THRESHOLD,
    bufferSize: 2,
    threshold: USE_VIRTUALIZATION_THRESHOLD
  }), [dailyPlanLength]);
}

export default VirtualizedDailyPlanSection;
