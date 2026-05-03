import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Global',
    shortcuts: [
      { keys: ['Ctrl', 'K'], desc: 'Open Command Palette' },
      { keys: ['?'],         desc: 'Show keyboard shortcuts' },
      { keys: ['Esc'],       desc: 'Close any modal / overlay' },
    ],
  },
  {
    title: 'DSA Code Editor',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'],       desc: 'Run code' },
      { keys: ['Ctrl', '⇧', 'Enter'],  desc: 'Submit solution' },
      { keys: ['Ctrl', 'H'],           desc: 'Toggle AI hints panel' },
    ],
  },
  {
    title: 'Problem Explorer',
    shortcuts: [
      { keys: ['/'],         desc: 'Focus search bar' },
      { keys: ['F'],         desc: 'Toggle filters panel' },
      { keys: ['R'],         desc: 'Pick a random problem' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'],    desc: 'Go to Dashboard' },
      { keys: ['G', 'P'],    desc: 'Go to Problems' },
      { keys: ['G', 'I'],    desc: 'Go to AI Interview' },
      { keys: ['G', 'F'],    desc: 'Go to Flashcards' },
    ],
  },
];

function Kbd({ children }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, padding: '3px 7px', borderRadius: 6,
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderBottom: '2px solid rgba(255,255,255,0.08)',
      fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
      fontFamily: "'JetBrains Mono', monospace",
      lineHeight: 1,
    }}>
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'ksm-fade 0.15s ease',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: 'rgba(12,12,22,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          animation: 'ksm-slide 0.18s cubic-bezier(0.16,1,0.3,1)',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center',
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
            }}>
              <Keyboard size={16} style={{ color: '#c084fc' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Keyboard Shortcuts</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Press <Kbd>?</Kbd> anytime to open this</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {SECTIONS.map(section => (
            <div key={section.title}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
              }}>
                {section.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {section.shortcuts.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                      {s.desc}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {s.keys.map((k, ki) => (
                        <span key={ki} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Kbd>{k}</Kbd>
                          {ki < s.keys.length - 1 && (
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500,
          textAlign: 'center',
        }}>
          More shortcuts coming soon · Press <Kbd>Esc</Kbd> to close
        </div>
      </div>

      <style>{`
        @keyframes ksm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ksm-slide { from { opacity: 0; transform: scale(0.96) translateY(-6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
