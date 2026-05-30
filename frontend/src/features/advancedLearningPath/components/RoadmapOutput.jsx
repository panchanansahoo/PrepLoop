import { useState } from 'react';
import { ChevronDown, CheckCircle, Clock, Download, Calendar, BookOpen } from 'lucide-react';

export default function RoadmapOutput({ weeks, aiTaskDone, onToggleTask, onExport, trackLabels }) {
  const [expandedWeeks, setExpandedWeeks] = useState(() => {
    const s = {};
    if (weeks && weeks.length) s[0] = true;
    return s;
  });

  const toggleWeek = (idx) => {
    setExpandedWeeks(p => ({ ...p, [idx]: !p[idx] }));
  };

  const expandAll = () => {
    const all = {};
    weeks.forEach((_, i) => { all[i] = true; });
    setExpandedWeeks(all);
  };

  const collapseAll = () => {
    setExpandedWeeks({});
  };

  const totalTasks = weeks.reduce((s, w) => s + (w.dayPlan ? w.dayPlan.length : 0), 0);
  const doneTasks = weeks.reduce((s, w) => {
    if (!w.dayPlan) return s;
    return s + w.dayPlan.filter(d => aiTaskDone && aiTaskDone[d.dateISO]).length;
  }, 0);

  if (!weeks || weeks.length === 0) return null;

  const weekAccents = {
    dsa: { bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)', dot: '#818cf8', label: '', },
    apt: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', dot: '#34d399', label: '', },
    sql: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', dot: '#fbbf24', label: '', },
    sys: { bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)', dot: '#f472b6', label: '', },
    mixed: { bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', dot: '#a855f7', label: '', },
  };

  return (
    <div className="alp-output" style={{ marginBottom: 40 }}>
      <div className="alp-summary-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderRadius: 16,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen size={18} style={{ color: '#818cf8' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {weeks.length}-Week Roadmap
          </span>
          <span className="alp-summary-pill">
            <CheckCircle size={12} /> {doneTasks}/{totalTasks} done
          </span>
          <span className="alp-summary-pill">
            <Clock size={12} /> ~{weeks.reduce((s, w) => {
              if (!w.dayPlan) return s;
              const totalMin = w.dayPlan.reduce((ms, d) => {
                return ms + (aiTaskDone && aiTaskDone[d.dateISO] ? 0 : 1);
              }, 0);
              return s + Math.round(totalMin / weeks.length);
            }, 0)} min/day
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="alp-btn"
            onClick={expandAll}
            style={{ padding: '8px 14px', fontSize: 12, borderRadius: 10 }}
          >
            Expand All
          </button>
          <button
            className="alp-btn"
            onClick={collapseAll}
            style={{ padding: '8px 14px', fontSize: 12, borderRadius: 10 }}
          >
            Collapse All
          </button>
          <div className="alp-export-group" style={{ display: 'flex', gap: 4 }}>
            <button className="alp-btn alp-download" onClick={() => onExport('json')} title="Export JSON" style={{ padding: '8px 10px', fontSize: 12, borderRadius: 10 }}>
              <Download size={14} />
            </button>
            <button className="alp-btn alp-download" onClick={() => onExport('csv')} title="Export CSV" style={{ padding: '8px 10px', fontSize: 12, borderRadius: 10 }}>
              <span style={{ fontSize: 12, marginLeft: 2 }}>CSV</span>
            </button>
            <button className="alp-btn alp-download" onClick={() => onExport('ics')} title="Export ICS Calendar" style={{ padding: '8px 10px', fontSize: 12, borderRadius: 10 }}>
              <Calendar size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="alp-timeline">
        <div className="alp-timeline-line" />

        {weeks.map((week, wi) => {
          const accent = weekAccents[week.track] || weekAccents.mixed;
          const isExpanded = expandedWeeks[wi] || false;
          const weekDoneCount = week.dayPlan ? week.dayPlan.filter(d => aiTaskDone && aiTaskDone[d.dateISO]).length : 0;
          const weekTotal = week.dayPlan ? week.dayPlan.length : 0;

          return (
            <div key={wi} className="alp-week-card" style={{ position: 'relative', marginBottom: 16 }}>
              <div className="alp-week-dot" style={{ background: accent.dot, boxShadow: `0 0 8px ${accent.dot}44` }} />

              <div
                className="alp-week-header"
                onClick={() => toggleWeek(wi)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleWeek(wi); } }}
                style={{
                  background: accent.bg, border: `1px solid ${accent.border}`,
                  borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                  marginLeft: 28,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="alp-week-num" style={{ fontWeight: 800, fontSize: 14 }}>Week {week.week}</span>
                  <span className="alp-week-title">{week.track ? (trackLabels[week.track] || week.track) : ''}</span>
                  <span className="alp-week-dates">
                    {week.startISO && <Calendar size={12} />}
                    {week.startISO ? `${week.startISO.slice(5)}` : ''}
                    {week.startISO && week.endISO ? ' — ' : ''}
                    {week.endISO ? `${week.endISO.slice(5)}` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="alp-week-progress" style={{
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, opacity: 0.7,
                  }}>
                    <CheckCircle size={12} style={{ color: weekDoneCount === weekTotal ? '#34d399' : '#64748b' }} />
                    <span>{weekDoneCount}/{weekTotal}</span>
                  </div>
                  {week.confidence !== undefined && (
                    <div className="alp-week-confidence" style={{ fontSize: 12, opacity: 0.5 }}>
                      {(week.confidence >= 85 ? '🔥 ' : week.confidence >= 60 ? '' : '⚠️ ')}{week.confidence}%
                    </div>
                  )}
                  <div className="alp-week-chevron" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="alp-week-body" style={{ marginLeft: 28, marginTop: 8 }}>
                  {week.chunk && week.chunk.length > 0 && (
                    <div style={{ padding: '12px 16px 8px', fontSize: 13, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {week.chunk.map((c, ci) => (
                        <span key={ci} className="alp-topic-tag" style={{
                          padding: '4px 10px', borderRadius: 20,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          fontSize: 12,
                        }}>
                          {c.title}
                          {c.diff && <span style={{ opacity: 0.4, marginLeft: 4 }}>{c.diff}</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ padding: '4px 16px 16px' }}>
                    {week.dayPlan && week.dayPlan.length > 0 ? (
                      week.dayPlan.map((d, di) => {
                        const dateKey = d.dateISO;
                        const isDone = aiTaskDone && aiTaskDone[dateKey];
                        return (
                          <div
                            key={di}
                            className={`alp-day-row ${isDone ? 'done' : ''}`}
                            onClick={() => onToggleTask(dateKey)}
                            role="checkbox"
                            aria-checked={isDone}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleTask(dateKey); } }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                              marginBottom: 4, transition: 'all 0.2s',
                              textDecoration: isDone ? 'line-through' : 'none',
                              opacity: isDone ? 0.5 : 1,
                            }}
                          >
                            <div className="alp-day-check" style={{
                              width: 18, height: 18, borderRadius: 4,
                              border: isDone ? 'none' : '2px solid rgba(255,255,255,0.15)',
                              background: isDone ? '#818cf8' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {isDone && <CheckCircle size={14} style={{ color: '#fff' }} />}
                            </div>
                            <div className="alp-day-time" style={{ flexShrink: 0, fontSize: 11, minWidth: 40, opacity: 0.5 }}>
                              {d.dateISO ? d.dateISO.slice(5) : ''}
                            </div>
                            <div className="alp-day-task" style={{ flex: 1, fontSize: 14 }}>
                              {d.task}
                            </div>
                            {d.topic && (
                              <div className="alp-day-topic" style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(255,255,255,0.04)', opacity: 0.6, flexShrink: 0,
                              }}>
                                {d.topic}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: 12, textAlign: 'center', opacity: 0.4, fontSize: 13 }}>
                        No specific daily plan — use the buffer for review or catch-up.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
