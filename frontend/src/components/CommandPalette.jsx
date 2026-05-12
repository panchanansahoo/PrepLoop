import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, ArrowRight, Code2, Brain, Briefcase, BookOpen,
  LayoutDashboard, User, Settings, Trophy, Zap, Target,
  FileText, MessageSquare, BarChart3, Flame, Star, Clock,
  ChevronRight, Command, CornerDownLeft,
} from 'lucide-react';
import { PROBLEMS } from '../data/problemsDatabase';

// ── Static nav items ──
const NAV_ITEMS = [
  { id: 'dashboard',        label: 'Dashboard',              path: '/dashboard',           icon: LayoutDashboard, group: 'Pages',      keywords: 'home overview' },
  { id: 'problems',         label: 'Problem Explorer',       path: '/problems',            icon: Code2,           group: 'Practice',   keywords: 'dsa leetcode questions' },
  { id: 'dsa-path',         label: 'DSA Learning Path',      path: '/dsa-path',            icon: BookOpen,        group: 'Practice',   keywords: 'data structures algorithms learn' },
  { id: 'company-interview',label: 'AI Mock Interview',      path: '/company-interview',   icon: Brain,           group: 'Interviews', keywords: 'ai voice mock practice' },
  { id: 'interview-suite',  label: 'Interview Suite',        path: '/interview-suite',     icon: Target,          group: 'Interviews', keywords: 'suite rounds technical' },
  { id: 'behavioral-coach', label: 'Behavioral Coach',       path: '/behavioral-coach',    icon: MessageSquare,   group: 'Interviews', keywords: 'hr soft skills star method' },
  { id: 'system-design',    label: 'System Design',          path: '/system-design',       icon: Zap,             group: 'Practice',   keywords: 'architecture distributed' },
  { id: 'system-design-sim',label: 'System Design Canvas',   path: '/system-design-sim',   icon: Zap,             group: 'Practice',   keywords: 'canvas draw diagram' },
  { id: 'flashcards',       label: 'Flashcards',             path: '/flashcards',          icon: Star,            group: 'Practice',   keywords: 'review spaced repetition' },
  { id: 'quiz-arena',       label: 'Quiz Arena',             path: '/quiz-arena',          icon: Trophy,          group: 'Practice',   keywords: 'quiz mcq test' },
  { id: 'daily-challenges', label: 'Daily Challenges',       path: '/daily-challenges',    icon: Flame,           group: 'Practice',   keywords: 'daily streak challenge' },
  { id: 'pattern-trainer',  label: 'Pattern Trainer',        path: '/pattern-trainer',     icon: Brain,           group: 'Practice',   keywords: 'patterns sliding window two pointer' },
  { id: 'complexity-analyzer', label: 'Complexity Analyzer', path: '/complexity-analyzer', icon: BarChart3,       group: 'Tools',      keywords: 'big o time space analysis' },
  { id: 'code-reviewer',    label: 'AI Code Reviewer',       path: '/code-reviewer',       icon: Code2,           group: 'Tools',      keywords: 'review feedback ai' },
  { id: 'bug-debugger',     label: 'Bug Debugger',           path: '/bug-debugger',        icon: Code2,           group: 'Tools',      keywords: 'debug fix error' },
  { id: 'code-translator',  label: 'Code Translator',        path: '/code-translator',     icon: Code2,           group: 'Tools',      keywords: 'translate convert language' },
  { id: 'resume-analyzer',  label: 'Resume Analyzer',        path: '/resume-analyzer',     icon: FileText,        group: 'Career',     keywords: 'resume cv ats' },
  { id: 'copilot',          label: 'AI Job Copilot',         path: '/copilot',             icon: Briefcase,       group: 'Career',     keywords: 'jobs career copilot ai' },
  { id: 'job-updates',      label: 'Job Updates',            path: '/job-updates',         icon: Briefcase,       group: 'Career',     keywords: 'jobs listings openings' },
  { id: 'improvement-plan', label: 'Improvement Plan',       path: '/improvement-plan',    icon: Target,          group: 'Career',     keywords: 'plan improve ai coaching' },
  { id: 'skill-heatmap',    label: 'Skill Heatmap',          path: '/skill-heatmap',       icon: BarChart3,       group: 'Career',     keywords: 'skills heatmap strength weakness' },
  { id: 'readiness-check',  label: 'Readiness Check',        path: '/readiness-check',     icon: Target,          group: 'Career',     keywords: 'ready score check' },
  { id: 'interview-analytics', label: 'Interview Analytics', path: '/interview-analytics', icon: BarChart3,       group: 'Career',     keywords: 'analytics stats performance' },
  { id: 'weekly-report',    label: 'Weekly Report',          path: '/weekly-report',       icon: BarChart3,       group: 'Career',     keywords: 'report weekly progress' },
  { id: 'profile',          label: 'Profile',                path: '/profile',             icon: User,            group: 'Account',    keywords: 'account me settings' },
  { id: 'settings',         label: 'Settings',               path: '/dashboard/settings',  icon: Settings,        group: 'Account',    keywords: 'preferences config' },
  { id: 'wallet',           label: 'Coin Wallet',            path: '/wallet',              icon: Star,            group: 'Account',    keywords: 'coins points rewards' },
  { id: 'community',        label: 'Community',              path: '/community',           icon: MessageSquare,   group: 'Community',  keywords: 'forum discuss community' },
  { id: 'blog',             label: 'Blog',                   path: '/blog',                icon: FileText,        group: 'Community',  keywords: 'articles posts read' },
  { id: 'sql-problems',     label: 'SQL Problems',           path: '/sql-problems',        icon: Code2,           group: 'Practice',   keywords: 'sql database query' },
  { id: 'aptitude',         label: 'Aptitude Hub',           path: '/aptitude',            icon: Brain,           group: 'Practice',   keywords: 'aptitude logical reasoning' },
  { id: 'visualizer',       label: 'Algorithm Visualizer',   path: '/visualizer',          icon: Zap,             group: 'Tools',      keywords: 'visualize sort graph animate' },
  { id: 'playground',       label: 'Coding Playground',      path: '/playground',          icon: Code2,           group: 'Tools',      keywords: 'sandbox free code run' },
  { id: 'company-prep',     label: 'Company Prep',           path: '/company-prep',        icon: Briefcase,       group: 'Interviews', keywords: 'google amazon meta microsoft apple' },
  { id: 'peer-interview',   label: 'Peer Mock Interview',    path: '/peer-interview',      icon: MessageSquare,   group: 'Interviews', keywords: 'peer mock partner' },
  { id: 'negotiation-coach',label: 'Offer Negotiation Coach',path: '/negotiation-coach',   icon: Briefcase,       group: 'Career',     keywords: 'salary offer negotiate' },
  { id: 'rejection-analyzer',label: 'Rejection Analyzer',   path: '/rejection-analyzer',  icon: FileText,        group: 'Career',     keywords: 'rejection feedback analyze' },
  { id: 'jd-questions',     label: 'JD Question Generator',  path: '/jd-questions',        icon: FileText,        group: 'Tools',      keywords: 'job description questions generate' },
  { id: 'answer-timer',     label: 'Answer Timer',           path: '/answer-timer',        icon: Clock,           group: 'Tools',      keywords: 'timer timed practice' },
  { id: 'daily-win',        label: 'Daily Win',              path: '/daily-win',           icon: Flame,           group: 'Practice',   keywords: 'daily win habit' },
  { id: 'question-bank',    label: 'Question Bank',          path: '/question-bank',       icon: BookOpen,        group: 'Practice',   keywords: 'bank search questions' },
  { id: 'accountability',   label: 'Accountability Partner', path: '/accountability',      icon: User,            group: 'Community',  keywords: 'partner accountability buddy' },
];

const DIFF_COLOR = { Easy: '#4ade80', Medium: '#fbbf24', Hard: '#f87171' };
const GROUP_ORDER = ['Pages', 'Practice', 'Interviews', 'Tools', 'Career', 'Account', 'Community'];

function score(item, q) {
  const query = q.toLowerCase();
  const label = item.label.toLowerCase();
  const keywords = (item.keywords || '').toLowerCase();
  if (label === query) return 100;
  if (label.startsWith(query)) return 80;
  if (label.includes(query)) return 60;
  if (keywords.includes(query)) return 40;
  // partial word match
  const words = query.split(' ').filter(Boolean);
  if (words.every(w => label.includes(w) || keywords.includes(w))) return 30;
  return 0;
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Build results
  const results = useMemo(() => {
    const q = query.trim();

    if (!q) {
      // Default: show top nav items grouped
      return NAV_ITEMS.slice(0, 8).map(item => ({ ...item, type: 'nav' }));
    }

    const navScored = NAV_ITEMS
      .map(item => ({ ...item, type: 'nav', _score: score(item, q) }))
      .filter(i => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);

    // Problem search
    const ql = q.toLowerCase();
    const problemMatches = PROBLEMS
      .filter(p =>
        p.title?.toLowerCase().includes(ql) ||
        p.topics?.some(t => t.toLowerCase().includes(ql)) ||
        p.patterns?.some(pt => pt.toLowerCase().includes(ql))
      )
      .slice(0, 5)
      .map(p => ({ ...p, type: 'problem', label: p.title, path: `/code-editor/${p.id}`, group: 'Problems', icon: Code2 }));

    return [...navScored, ...problemMatches];
  }, [query]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0); }, [results]);

  const go = useCallback((item) => {
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[activeIdx]) go(results[activeIdx]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, activeIdx, go, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  // Group results for display
  const grouped = query.trim()
    ? null // flat list when searching
    : GROUP_ORDER.reduce((acc, g) => {
        const items = results.filter(r => r.group === g);
        if (items.length) acc.push({ group: g, items });
        return acc;
      }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'cpFadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 620,
          background: 'rgba(12,12,22,0.98)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.08)',
          overflow: 'hidden',
          animation: 'cpSlideIn 0.18s cubic-bezier(0.16,1,0.3,1)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Search size={18} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, problems, tools..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: 15, fontWeight: 500,
              caretColor: '#8b5cf6',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 2,
            }}>
              <X size={15} />
            </button>
          )}
          <kbd style={{
            padding: '3px 7px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.3)', flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 420, overflowY: 'auto', padding: '6px 0' }}>
          {results.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}

          {/* Grouped (no query) */}
          {grouped && grouped.map(({ group, items }) => (
            <div key={group}>
              <div style={{
                padding: '8px 16px 4px',
                fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase', letterSpacing: 0.8,
              }}>{group}</div>
              {items.map(item => {
                const idx = results.indexOf(item);
                return <ResultRow key={item.id} item={item} idx={idx} activeIdx={activeIdx} onHover={setActiveIdx} onClick={go} />;
              })}
            </div>
          ))}

          {/* Flat (with query) */}
          {!grouped && results.map((item, idx) => (
            <ResultRow key={item.id || item.path} item={item} idx={idx} activeIdx={activeIdx} onHover={setActiveIdx} onClick={go} />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CornerDownLeft size={11} /> select
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>↑↓ navigate</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>ESC close</span>
          <div style={{ flex: 1 }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.6 }}>
            <Command size={10} />K to open
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cpFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cpSlideIn { from { opacity: 0; transform: scale(0.96) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

function ResultRow({ item, idx, activeIdx, onHover, onClick }) {
  const isActive = idx === activeIdx;
  const Icon = item.icon || ArrowRight;

  return (
    <div
      data-idx={idx}
      onMouseEnter={() => onHover(idx)}
      onClick={() => onClick(item)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 16px', cursor: 'pointer',
        background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
        borderLeft: `2px solid ${isActive ? '#8b5cf6' : 'transparent'}`,
        transition: 'background 0.1s',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: isActive ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} style={{ color: isActive ? '#c084fc' : 'rgba(255,255,255,0.4)' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </div>
        {item.type === 'problem' && item.difficulty && (
          <div style={{ fontSize: 10, color: DIFF_COLOR[item.difficulty] || '#fbbf24', fontWeight: 700, marginTop: 1 }}>
            {item.difficulty} · {item.topics?.slice(0, 2).join(', ')}
          </div>
        )}
        {item.type === 'nav' && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{item.path}</div>
        )}
      </div>

      {item.type === 'problem' && (
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
          color: DIFF_COLOR[item.difficulty] || '#fbbf24',
          background: `${DIFF_COLOR[item.difficulty] || '#fbbf24'}15`,
          flexShrink: 0,
        }}>{item.difficulty}</span>
      )}

      <ChevronRight size={13} style={{ color: isActive ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
    </div>
  );
}
