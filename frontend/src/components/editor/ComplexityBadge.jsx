import { Clock, Database, Zap, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const SEVERITY_STYLES = {
  error:   { bg: 'rgba(239,68,68,.08)',   border: 'rgba(239,68,68,.2)',   color: '#f87171', icon: AlertTriangle },
  warn:    { bg: 'rgba(245,158,11,.08)',  border: 'rgba(245,158,11,.2)',  color: '#fbbf24', icon: AlertTriangle },
  info:    { bg: 'rgba(96,165,250,.08)',  border: 'rgba(96,165,250,.2)',  color: '#60a5fa', icon: Info },
  success: { bg: 'rgba(34,197,94,.08)',   border: 'rgba(34,197,94,.2)',   color: '#4ade80', icon: CheckCircle2 },
};

export default function ComplexityBadge({ analysis }) {
  if (!analysis) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
        Start writing code to see complexity analysis
      </div>
    );
  }

  const { timeResult, spaceResult, dataStructures, patterns, codeLines, suggestions } = analysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Time + Space row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* Time */}
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: `${timeResult.color}0d`,
          border: `1px solid ${timeResult.color}25`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <Clock size={11} style={{ color: timeResult.color }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Time</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: timeResult.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {timeResult.complexity}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 600 }}>
            {timeResult.label}
          </div>
        </div>

        {/* Space */}
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: `${spaceResult.color}0d`,
          border: `1px solid ${spaceResult.color}25`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <Database size={11} style={{ color: spaceResult.color }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Space</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: spaceResult.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {spaceResult.complexity}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 600 }}>
            {spaceResult.label}
          </div>
        </div>
      </div>

      {/* Detected patterns */}
      {patterns.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
            Patterns Detected
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {patterns.map(p => (
              <span key={p} style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.2)',
                color: '#c084fc',
              }}>{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Data structures */}
      {dataStructures.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
            Data Structures
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {dataStructures.map(ds => (
              <span key={ds.name} style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: `${ds.color}12`, border: `1px solid ${ds.color}25`,
                color: ds.color,
              }}>{ds.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {suggestions.map((s, i) => {
            const style = SEVERITY_STYLES[s.severity] || SEVERITY_STYLES.info;
            const Icon = style.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 7,
                padding: '7px 10px', borderRadius: 8,
                background: style.bg, border: `1px solid ${style.border}`,
              }}>
                <Icon size={12} style={{ color: style.color, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{s.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Code stats */}
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600, textAlign: 'right' }}>
        {codeLines} lines analyzed
      </div>
    </div>
  );
}
