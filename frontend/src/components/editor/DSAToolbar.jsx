import { useState, useRef, useEffect } from 'react';
import {
  Play, Send, ChevronDown, Settings, Timer, Maximize2,
  Code2, FileCode, Braces, Keyboard, Sun, Moon, Palette,
  Copy, Check, RotateCcw, Sparkles
} from 'lucide-react';
import { LANGUAGES, ALL_TEMPLATES, ALGORITHM_TEMPLATES, DATA_STRUCTURE_TEMPLATES } from '../../data/dsaTemplates';
import { EDITOR_THEMES } from '../../data/editorThemes';

export default function DSAToolbar({
  language, onLanguageChange,
  onRun, onSubmit, onInsertTemplate,
  running = false, timer = null, onToggleFocus, focusMode = false,
  editorTheme = 'one-dark-pro', onThemeChange,
  onCopyCode, onResetCode, difficulty = null,
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const dropdownRef = useRef(null);
  const themeRef = useRef(null);

  const isLight = theme === 'light';

  const handleCopy = () => {
    onCopyCode?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const diffColors = {
    Easy: '#4ade80', Medium: '#fbbf24', Hard: '#f87171',
  };

  // Close dropdown on outside click
  // Fix #8: use || so a click outside EITHER ref closes all dropdowns
  useEffect(() => {
    const handler = (e) => {
      const outsideDrop = !dropdownRef.current || !dropdownRef.current.contains(e.target);
      const outsideTheme = !themeRef.current || !themeRef.current.contains(e.target);
      if (outsideDrop && outsideTheme) {
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
      background: isLight ? 'rgba(248, 249, 250, 0.95)' : 'rgba(10,10,26,0.98)',
      borderBottom: isLight ? '1px solid rgba(99,102,241,0.08)' : '1px solid rgba(255,255,255,0.06)',
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
              background: isLight ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.04)',
              border: isLight ? '1px solid rgba(99,102,241,0.15)' : '1px solid rgba(255,255,255,0.08)',
              color: isLight ? '#1a1d2e' : '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              outline: 'none',
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id} style={{ background: isLight ? '#f8f9fa' : '#1a1a2e', color: isLight ? '#1a1d2e' : '#fff' }}>
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            color: isLight ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.3)', pointerEvents: 'none',
          }} />
        </div>

        {/* Template dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button onClick={() => { setShowTemplates(s => !s); setShowSettings(false); }} style={{
            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
            background: showTemplates ? (isLight ? 'rgba(99,102,241,0.12)' : 'rgba(139,92,246,0.15)') : (isLight ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.04)'),
            border: `1px solid ${showTemplates ? (isLight ? 'rgba(99,102,241,0.25)' : 'rgba(139,92,246,0.3)') : (isLight ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.08)')}`,
            color: showTemplates ? '#c084fc' : (isLight ? '#6b7280' : 'rgba(255,255,255,0.5)'),
            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Braces size={12} /> Templates <ChevronDown size={10} />
          </button>

          {showTemplates && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4,
              width: 280, maxHeight: 400, overflowY: 'auto',
              background: isLight ? 'rgba(240, 240, 255, 0.98)' : 'rgba(15,15,30,0.98)', border: isLight ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 8, zIndex: 100,
              boxShadow: isLight ? '0 8px 32px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
            }}>
              {ALL_TEMPLATES.map(group => (
                <div key={group.group}>
                  <div style={{
                    fontSize: 9, color: isLight ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.3)', fontWeight: 700,
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

        {/* Difficulty badge */}
        {difficulty && (
          <span style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800,
            color: diffColors[difficulty] || '#fbbf24',
            background: `${diffColors[difficulty] || '#fbbf24'}15`,
            border: `1px solid ${diffColors[difficulty] || '#fbbf24'}30`,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>{difficulty}</span>
        )}

        {/* Keyboard shortcuts hint */}
        <div style={{
          padding: '4px 8px', borderRadius: 6,
          background: 'rgba(255,255,255,0.02)',
          fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Keyboard size={9} /> Ctrl+Enter · Ctrl+Shift+Enter
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

        {/* Copy code */}
        <button onClick={handleCopy} title="Copy Code" aria-label="Copy Code" style={{
          width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
          background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: copied ? '#4ade80' : 'rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>

        {/* Reset code */}
        {onResetCode && (
          <button onClick={onResetCode} title="Reset to Starter Code" aria-label="Reset Code" style={{
            width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RotateCcw size={13} />
          </button>
        )}

        {/* Focus mode */}
        <button onClick={onToggleFocus} title="Focus Mode" aria-label="Focus Mode" style={{
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
