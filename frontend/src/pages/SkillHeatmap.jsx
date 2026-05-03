import React, { useState, useEffect } from 'react';
import { Activity, Flame, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getColor(minutes, isLight) {
  if (minutes === 0) return isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)';
  if (minutes < 30) return '#bbf7d0';
  if (minutes < 60) return '#4ade80';
  if (minutes < 120) return '#16a34a';
  return '#14532d';
}

export default function SkillHeatmap() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  useEffect(() => {
    apiFetch.get('/api/skill-heatmap').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', background: bg, display: 'grid', placeItems: 'center', color: text }}>Loading heatmap...</div>;

  // Build 52-week grid (days grouped into weeks)
  const days = data?.days || [];
  const weeks = [];
  // Pad start so first day aligns to correct weekday
  const firstDay = days[0] ? new Date(days[0].date).getDay() : 0;
  const padded = [...Array(firstDay).fill(null), ...days];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Month labels
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstReal = week.find(d => d);
    if (firstReal) {
      const m = new Date(firstReal.date).getMonth();
      if (m !== lastMonth) { monthLabels.push({ wi, label: MONTHS[m] }); lastMonth = m; }
    }
  });

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'grid', placeItems: 'center' }}>
            <Activity size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Skill Heatmap</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Your daily practice activity over the last year</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Current Streak', value: `${data?.streak || 0} days`, icon: <Flame size={18} />, color: '#f97316' },
            { label: 'Active Days', value: data?.totalDaysActive || 0, icon: <Calendar size={18} />, color: '#6366f1' },
            { label: 'This Year', value: `${days.filter(d => d.minutes > 0).length} days`, icon: <Activity size={18} />, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ background: card, border, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: muted, fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div style={{ background: card, border, borderRadius: 20, padding: 24, overflowX: 'auto' }}>
          <div style={{ position: 'relative', minWidth: 700 }}>
            {/* Month labels */}
            <div style={{ display: 'flex', marginLeft: 28, marginBottom: 4 }}>
              {weeks.map((_, wi) => {
                const ml = monthLabels.find(m => m.wi === wi);
                return <div key={wi} style={{ width: 14, marginRight: 2, fontSize: 10, color: muted, fontWeight: 600, flexShrink: 0 }}>{ml ? ml.label : ''}</div>;
              })}
            </div>

            <div style={{ display: 'flex', gap: 0 }}>
              {/* Day labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>
                {DAYS.map((d, i) => (
                  <div key={d} style={{ height: 14, fontSize: 9, color: muted, fontWeight: 600, display: 'flex', alignItems: 'center', visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div style={{ display: 'flex', gap: 2 }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Array(7).fill(null).map((_, di) => {
                      const day = week[di];
                      return (
                        <div key={di}
                          onMouseEnter={e => day && setTooltip({ day, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setTooltip(null)}
                          style={{ width: 14, height: 14, borderRadius: 3, background: day ? getColor(day.minutes, isLight) : 'transparent', cursor: day ? 'pointer' : 'default', flexShrink: 0 }} />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: muted }}>Less</span>
              {[0, 20, 45, 90, 150].map(m => (
                <div key={m} style={{ width: 12, height: 12, borderRadius: 2, background: getColor(m, isLight) }} />
              ))}
              <span style={{ fontSize: 11, color: muted }}>More</span>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 40, background: isLight ? '#1e293b' : '#f8fafc', color: isLight ? 'white' : '#0f172a', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, pointerEvents: 'none', zIndex: 9999, whiteSpace: 'nowrap' }}>
            {tooltip.day.date}: {tooltip.day.minutes > 0 ? `${tooltip.day.minutes} min` : 'No activity'}
            {Object.keys(tooltip.day.topics || {}).length > 0 && (
              <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>
                {Object.entries(tooltip.day.topics).map(([t, m]) => `${t}: ${m}m`).join(' · ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
