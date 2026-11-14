import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, CheckCircle2, Clock, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';

function useSafeTheme() {
  try {
    const context = useTheme();
    return context?.theme || 'dark';
  } catch {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
    return 'dark';
  }
}

export default function SpacedRepetitionWidget() {
  const { user } = useAuth();
  const theme = useSafeTheme();
  const isLight = theme === 'light';

  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [dueProblems, setDueProblems] = useState([]);
  const [totalTracked, setTotalTracked] = useState(0);
  const [submittingId, setSubmittingId] = useState(null);

  const loadDueReviews = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await authFetch(buildApiUrl('/spaced-repetition/due?limit=6'));
      if (res.ok) {
        const data = await res.json();
        setDueProblems(Array.isArray(data.dueProblems) ? data.dueProblems : []);
        setTotalTracked(Number(data.totalTracked || 0));
      }
    } catch {
      // Non-critical widget; fail silently
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    loadDueReviews();
  }, [user?.id]);


  const handleRate = async (problem, quality) => {
    setSubmittingId(problem.problem_id);
    try {
      const res = await authFetch(buildApiUrl('/spaced-repetition/review'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.problem_id,
          problemTitle: problem.problem_title || problem.problem_id,
          quality,
        }),
      });
      if (res.ok) {
        setDueProblems((prev) => prev.filter((item) => item.problem_id !== problem.problem_id));
      }
    } catch {
      // Ignore transient network failures
    } finally {
      setSubmittingId(null);
    }
  };

  if (!user) return null;

  const colors = isLight
    ? {
        cardBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))',
        cardBorder: '1px solid rgba(15, 23, 42, 0.08)',
        cardShadow: '0 12px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
        title: '#0f172a',
        subtitle: '#64748b',
        itemBg: 'rgba(15, 23, 42, 0.025)',
        itemBorder: '1px solid rgba(15, 23, 42, 0.06)',
        itemHoverBg: 'rgba(15, 23, 42, 0.045)',
        itemTitle: '#1e293b',
        itemTitleHover: '#7c3aed',
        meta: '#64748b',
        emptyBg: 'rgba(15, 23, 42, 0.025)',
        emptyBorder: '1px solid rgba(15, 23, 42, 0.06)',
        emptyText: '#475569',
        refreshBg: 'rgba(15, 23, 42, 0.04)',
        refreshBorder: '1px solid rgba(15, 23, 42, 0.1)',
        refreshColor: '#475569',
        refreshHoverBg: 'rgba(15, 23, 42, 0.08)',
        skeletonBg: 'rgba(15, 23, 42, 0.06)',
        badgeBg: dueProblems.length > 0 ? 'rgba(147, 51, 234, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        badgeBorder: dueProblems.length > 0 ? '1px solid rgba(147, 51, 234, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
        badgeText: dueProblems.length > 0 ? '#7c3aed' : '#059669',
      }
    : {
        cardBg: 'linear-gradient(135deg, rgba(18, 18, 24, 0.75), rgba(20, 20, 28, 0.65))',
        cardBorder: '1px solid rgba(255, 255, 255, 0.08)',
        cardShadow: '0 24px 64px -20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        title: '#f8fafc',
        subtitle: '#94a3b8',
        itemBg: 'rgba(255, 255, 255, 0.03)',
        itemBorder: '1px solid rgba(255, 255, 255, 0.06)',
        itemHoverBg: 'rgba(255, 255, 255, 0.05)',
        itemTitle: '#f1f5f9',
        itemTitleHover: '#c084fc',
        meta: '#94a3b8',
        emptyBg: 'rgba(255, 255, 255, 0.02)',
        emptyBorder: '1px solid rgba(255, 255, 255, 0.06)',
        emptyText: '#94a3b8',
        refreshBg: 'rgba(255, 255, 255, 0.04)',
        refreshBorder: '1px solid rgba(255, 255, 255, 0.1)',
        refreshColor: '#cbd5e1',
        refreshHoverBg: 'rgba(255, 255, 255, 0.08)',
        skeletonBg: 'rgba(255, 255, 255, 0.06)',
        badgeBg: dueProblems.length > 0 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)',
        badgeBorder: dueProblems.length > 0 ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
        badgeText: dueProblems.length > 0 ? '#d8b4fe' : '#34d399',
      };

  const qualityOptions = [
    {
      label: 'Again',
      quality: 1,
      style: isLight
        ? { bg: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#dc2626' }
        : { bg: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' },
      hoverClass: 'hover-again',
    },
    {
      label: 'Hard',
      quality: 3,
      style: isLight
        ? { bg: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#d97706' }
        : { bg: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24' },
      hoverClass: 'hover-hard',
    },
    {
      label: 'Good',
      quality: 4,
      style: isLight
        ? { bg: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#059669' }
        : { bg: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' },
      hoverClass: 'hover-good',
    },
    {
      label: 'Easy',
      quality: 5,
      style: isLight
        ? { bg: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#4f46e5' }
        : { bg: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8' },
      hoverClass: 'hover-easy',
    },
  ];

  return (
    <section
      aria-label="Spaced Repetition Review Queue"
      style={{
        background: colors.cardBg,
        border: colors.cardBorder,
        boxShadow: colors.cardShadow,
        borderRadius: '24px',
        padding: '24px 28px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      <style>{`
        .sr-item-row {
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .sr-item-row:hover {
          background: ${colors.itemHoverBg} !important;
        }
        .sr-link {
          transition: color 0.2s ease;
        }
        .sr-link:hover {
          color: ${colors.itemTitleHover} !important;
        }
        .sr-rate-btn {
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
        }
        .sr-rate-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.15);
        }
        .sr-rate-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .sr-refresh-btn {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sr-refresh-btn:hover:not(:disabled) {
          background: ${colors.refreshHoverBg} !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.12)',
              flexShrink: 0,
            }}
          >
            <BrainCircuit size={20} color="#a855f7" style={{ filter: 'drop-shadow(0 2px 4px rgba(168, 85, 247, 0.3))' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: colors.title,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Spaced Repetition Queue
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '9999px',
                  padding: '3px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: colors.badgeBg,
                  border: colors.badgeBorder,
                  color: colors.badgeText,
                  whiteSpace: 'nowrap',
                }}
              >
                {dueProblems.length} Due for Review
              </span>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: colors.subtitle,
                margin: '3px 0 0',
              }}
            >
              SM-2 memory scheduling · {totalTracked} problem{totalTracked === 1 ? '' : 's'} tracked
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadDueReviews}
          disabled={loading}
          className="sr-refresh-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '10px',
            border: colors.refreshBorder,
            background: colors.refreshBg,
            color: colors.refreshColor,
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content */}
      {loading && !initialLoaded ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2].map((idx) => (
            <div
              key={idx}
              style={{
                height: '56px',
                borderRadius: '14px',
                background: colors.skeletonBg,
                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ))}
        </div>
      ) : dueProblems.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderRadius: '14px',
            border: colors.emptyBorder,
            background: colors.emptyBg,
            padding: '16px 20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.emptyText, fontSize: '13px' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
            <span>All caught up! Solve problems in DSA Explorer to build your review queue.</span>
          </div>
          <Link
            to="/problems"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: isLight ? '#7c3aed' : '#c084fc',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              background: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(192, 132, 252, 0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Explore Problems</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dueProblems.map((item) => (
            <div
              key={item.problem_id}
              className="sr-item-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                borderRadius: '14px',
                border: colors.itemBorder,
                background: colors.itemBg,
                padding: '12px 18px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: '180px', flex: '1 1 200px' }}>
                <Link
                  to={`/dsa-editor/${item.problem_id}`}
                  className="sr-link"
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.itemTitle,
                    textDecoration: 'none',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  {item.problem_title || item.problem_id}
                </Link>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: colors.meta }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    Interval: {item.interval_days || 1}d
                  </span>
                  <span>·</span>
                  <span>EF: {Number(item.ease_factor || 2.5).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {qualityOptions.map((opt) => {
                  const isCurrentSubmitting = submittingId === item.problem_id;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={isCurrentSubmitting}
                      onClick={() => handleRate(item, opt.quality)}
                      className={`sr-rate-btn ${opt.hoverClass}`}
                      style={{
                        borderRadius: '9px',
                        border: opt.style.border,
                        background: opt.style.bg,
                        color: opt.style.color,
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        opacity: isCurrentSubmitting ? 0.6 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isCurrentSubmitting && opt.label === 'Good' && <Loader2 size={12} className="animate-spin" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
