import { Lightbulb, Sparkles } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="alp-empty-state" style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div className="alp-empty-inner" style={{
        maxWidth: 440, margin: '0 auto',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 20, padding: '48px 32px',
      }}>
        <div className="alp-empty-icon" style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(168,85,247,0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Lightbulb size={28} style={{ color: '#818cf8' }} />
        </div>
        <h3 className="alp-empty-title" style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
          Configure Your Learning Path
        </h3>
        <p className="alp-empty-desc" style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.6, margin: '0 0 24px' }}>
          Select your target tracks and configure duration, intensity, and company focus above.
          Hit <strong>Generate My Roadmap</strong> to create your personalized study plan.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['DSA', 'Aptitude', 'SQL', 'System Design'].map((t, i) => (
            <span key={i} style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12, fontWeight: 500,
            }}>
              {t}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 20, fontSize: 12, opacity: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Sparkles size={12} />
          <span>AI-powered scheduling with confidence tracking</span>
        </div>
      </div>
    </div>
  );
}
