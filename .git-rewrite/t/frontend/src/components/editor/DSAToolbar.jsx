import { useState, useRef, useEffect } from 'react';
import {
  Play, Send, ChevronDown, Settings, Timer, Maximize2,
  Code2, FileCode, Braces, Keyboard, Sun, Moon, Palette
} from 'lucide-react';
import { LANGUAGES, ALL_TEMPLATES, ALGORITHM_TEMPLATES, DATA_STRUCTURE_TEMPLATES } from '../../data/dsaTemplates';
import { EDITOR_THEMES } from '../../data/editorThemes';

export default function DSAToolbar({
  language, onLanguageChange,
  onRun, onSubmit, onInsertTemplate,
  running = false, timer = null, onToggleFocus, focusMode = false,
  editorTheme = 'one-dark-pro', onThemeChange,
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const dropdownRef = useRef(null);
  const themeRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        themeRef.current && !themeRef.current.contains(e.target)) {
        setShowTemplates(false);
        setShowSettings(false);
        setShowThemes(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 48, padding: '0 12px',
      background: 'rgba(10,10,26,0.98)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      fontFamily: "'Inter', system-ui, sans-serif",
      flexShrink: 0,
    }}>
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Language selector */}
        <div style={{ position: 'relative' }}>
          <select
            value={language}
            onChange={e => onLanguageChange(e.target.value)}
            style={{
              appearance: 'none',
              padding: '6px 28px 6px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              outline: 'none',
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id} style={{ background: '#1a1a2e' }}>
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
          }} />
        </div>

        {/* Template dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button onClick={() => { setShowTemplates(s => !s); setShowSettings(false); }} style={{
            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
            background: showTemplates ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${showTemplates ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: showTemplates ? '#c084fc' : 'rgba(255,255,255,0.5)',
            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Braces size={12} /> Templates <ChevronDown size={10} />
          </button>

          {showTemplates && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4,
              width: 280, maxHeight: 400, overflowY: 'auto',
              background: 'rgba(15,15,30,0.98)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 8, zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
            }}>
              {ALL_TEMPLATES.map(group => (
                <div key={group.group}>
                  <div style={{
                    fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 0.5, padding: '8px 8px 4px',
                  }}>{group.group}</div>
                  {group.items.map(item => (
                    <button key={item.id} onClick={() => {
                      const template = item.templates?.[language] || '';
                      if (template) {
                        onInsertTemplate?.(template);
                        setShowTemplates(false);
                      }
                    }} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: 'transparent', border: 'none', textAlign: 'left',
                      color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600,
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 11 }}>{item.name}</div>
                        {item.complexity && (
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                            {item.complexity.time} · {item.complexity.space}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme selector */}
        <div style={{ position: 'relative' }} ref={themeRef}>
          <button onClick={() => { setShowThemes(s => !s); setShowTemplates(false); setShowSettings(false); }} style={{
            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
            background: showThemes ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${showThemes ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: showThemes ? '#c084fc' : 'rgba(255,255,255,0.5)',
            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Palette size={12} />
            {EDITOR_THEMES.find(t => t.id === editorTheme)?.label || 'Theme'}
            <ChevronDown size={10} />
          </button>

          {showThemes && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4,
              width: 240, maxHeight: 400, overflowY: 'auto',
              background: 'rgba(15,15,30,0.98)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 6, zIndex: 9999,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{
                fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5, padding: '6px 8px 4px',
              }}>Editor Theme</div>
              {EDITOR_THEMES.map(theme => (
                <button key={theme.id} onClick={() => {
                  onThemeChange?.(theme.id);
                  setShowThemes(false);
                }} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                  background: editorTheme === theme.id ? 'rgba(139,92,246,0.12)' : 'transparent',
                  border: editorTheme === theme.id ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
                  textAlign: 'left',
                  color: editorTheme === theme.id ? '#c084fc' : 'rgba(255,255,255,0.7)',
                  fontSize: 11, fontWeight: 600,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (editorTheme !== theme.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (editorTheme !== theme.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 14 }}>{theme.icon}</span>
                  <span style={{ flex: 1 }}>{theme.label}</span>
                  <span style={{
                    width: 14, height: 14, borderRadius: 4,
                    background: theme.colors['editor.background'],
                    border: '1px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                  }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div style={{
          padding: '4px 8px', borderRadius: 6,
          background: 'rgba(255,255,255,0.02)',
          fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Keyboard size={9} /> Ctrl+Enter to Run
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Timer */}
        {timer !== null && (
          <div style={{
            padding: '5px 12px', borderRadius: 8,
            background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)',
            color: '#fbbf24', fontSize: 12, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Timer size={12} /> {timer}
          </div>
        )}

        {/* Focus mode */}
        <button onClick={onToggleFocus} title="Focus Mode" style={{
          width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
          background: focusMode ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focusMode ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: focusMode ? '#c084fc' : 'rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Maximize2 size={13} />
        </button>

        {/* Run */}
        <button onClick={onRun} disabled={running} style={{
          padding: '6px 16px', borderRadius: 8, cursor: running ? 'not-allowed' : 'pointer',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
          opacity: running ? 0.6 : 1,
        }}>
          <Play size={12} /> Run
        </button>

        {/* Submit */}
        <button onClick={onSubmit} disabled={running} style={{
          padding: '6px 16px', borderRadius: 8, cursor: running ? 'not-allowed' : 'pointer',
          background: running ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
          border: 'none', color: '#fff', fontSize: 11, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 5,
          boxShadow: running ? 'none' : '0 2px 8px rgba(34,197,94,0.3)',
          opacity: running ? 0.6 : 1,
        }}>
          <Send size={12} /> Submit
        </button>
      </div>
    </div>
  );
}
