import React, { useMemo, useRef, useState, useEffect } from 'react';

export default function StreakHeatmap({
  activityHistory = {},
  currentStreak = 0,
  bestStreak = 0,
  totalSolvedYear = 0,
  todaySolved = 0,
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { weeks, months } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate() - 1);

    const weeks = [];
    let currentWeek = [];
    const d = new Date(startDate);
    const monthLabels = [];
    let lastMonth = -1;

    while (d <= endDate) {
      const key = d.toISOString().split('T')[0];
      const monthNum = d.getMonth();
      if (monthNum !== lastMonth && d.getDay() === 0) {
        monthLabels.push({
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: weeks.length,
        });
        lastMonth = monthNum;
      }
      const dayData = activityHistory[key] || {};
      currentWeek.push({
        date: key,
        count: dayData.solved || 0,
        xp: dayData.xp || 0,
        easy: dayData.easy || 0,
        medium: dayData.medium || 0,
        hard: dayData.hard || 0,
        isToday: key === today.toISOString().split('T')[0],
        isFuture: d > today,
      });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return { weeks, months: monthLabels };
  }, [activityHistory]);

  const getColor = (count, isFuture) => {
    if (isFuture) return 'rgba(255,255,255,0.02)';
    if (count === 0) return 'rgba(255,255,255,0.06)';
    if (count === 1) return 'rgba(139,92,246,0.3)';
    if (count === 2) return 'rgba(139,92,246,0.5)';
    if (count <= 4) return 'rgba(139,92,246,0.7)';
    return 'rgba(139,92,246,0.9)';
  };

  // SVG-based layout calculations
  const totalWeeks = weeks.length;
  const labelWidth = 32;
  const availableWidth = Math.max(containerWidth - labelWidth - 4, 100);
  const gap = 3;
  const cellSize = Math.floor((availableWidth - gap * (totalWeeks - 1)) / totalWeeks);
  const actualCellSize = Math.max(cellSize, 8);
  const totalGridWidth = totalWeeks * actualCellSize + (totalWeeks - 1) * gap;
  const monthRowHeight = 16;
  const totalGridHeight = 7 * actualCellSize + 6 * gap;
  const svgWidth = labelWidth + totalGridWidth;
  const svgHeight = monthRowHeight + totalGridHeight;

  const dayLabels = [
    { label: 'Mon', index: 1 },
    { label: 'Wed', index: 3 },
    { label: 'Fri', index: 5 },
  ];

  const handleCellHover = (e, day) => {
    if (day.isFuture) {
      setTooltip(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltip({ x, y, ...day });
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>DSA Activity Heatmap</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{totalSolvedYear}</span> problems solved in the last year
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Today's count */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>{todaySolved}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Today</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>{currentStreak}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Streak</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{bestStreak}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Best</div>
          </div>
        </div>
      </div>

      {/* SVG Heatmap */}
      <div ref={containerRef} style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
        {containerWidth > 0 && (
          <svg
            width="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMinYMin meet"
            style={{ display: 'block' }}
          >
            {/* Month labels */}
            {months.map((m, i) => {
              const nextMonth = months[i + 1];
              const x = labelWidth + m.weekIndex * (actualCellSize + gap);
              const nextX = nextMonth ? labelWidth + nextMonth.weekIndex * (actualCellSize + gap) : Infinity;
              if (nextX - x < 28) {
                if (nextMonth) return null;
              }
              return (
                <text
                  key={`month-${i}`}
                  x={x}
                  y={11}
                  fill="rgba(255,255,255,0.4)"
                  fontSize={10}
                  fontFamily="inherit"
                >
                  {m.month}
                </text>
              );
            })}

            {/* Day labels */}
            {dayLabels.map(({ label, index }) => (
              <text
                key={`day-${index}`}
                x={labelWidth - 6}
                y={monthRowHeight + index * (actualCellSize + gap) + actualCellSize / 2 + 3.5}
                fill="rgba(255,255,255,0.35)"
                fontSize={10}
                fontFamily="inherit"
                textAnchor="end"
              >
                {label}
              </text>
            ))}

            {/* Grid cells */}
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const x = labelWidth + wi * (actualCellSize + gap);
                const y = monthRowHeight + di * (actualCellSize + gap);
                return (
                  <rect
                    key={`${wi}-${di}`}
                    x={x}
                    y={y}
                    width={actualCellSize}
                    height={actualCellSize}
                    rx={3}
                    ry={3}
                    fill={getColor(day.count, day.isFuture)}
                    stroke={day.isToday ? 'rgba(139,92,246,0.8)' : 'rgba(255,255,255,0.03)'}
                    strokeWidth={day.isToday ? 2 : 1}
                    style={{ cursor: day.isFuture ? 'default' : 'pointer', transition: 'fill 0.15s ease' }}
                    onMouseEnter={(e) => handleCellHover(e, day)}
                    onMouseMove={(e) => handleCellHover(e, day)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            )}
          </svg>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(tooltip.x + 12, containerWidth - 200),
              top: tooltip.y - 80,
              background: 'rgba(15,15,20,0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '10px 14px',
              pointerEvents: 'none',
              zIndex: 50,
              minWidth: 160,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
              })}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: tooltip.count > 0 ? '#a78bfa' : 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              {tooltip.count === 0 ? 'No problems solved' : `${tooltip.count} problem${tooltip.count > 1 ? 's' : ''} solved`}
            </div>
            {tooltip.count > 0 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {tooltip.easy > 0 && (
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                    {tooltip.easy} Easy
                  </span>
                )}
                {tooltip.medium > 0 && (
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                    {tooltip.medium} Med
                  </span>
                )}
                {tooltip.hard > 0 && (
                  <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                    {tooltip.hard} Hard
                  </span>
                )}
              </div>
            )}
            {tooltip.count > 0 && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                +{tooltip.xp} XP earned
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 12 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Less</span>
        {[0, 1, 2, 3, 5].map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: getColor(c, false) }} />
        ))}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>More</span>
      </div>
    </div>
  );
}
