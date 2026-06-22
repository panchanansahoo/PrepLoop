import {CheckCircle2, Eye, EyeOff, List, Sparkles, Layout} from 'lucide-react';

export function ProblemExplorerViewControls({
  isLight,
  studyPlans,
  activePlan,
  setActivePlan,
  setViewMode,
  setPage,
  viewMode,
  filteredCount,
  solvedInFiltered,
  hideSolved,
  setHideSolved,
}) {
  return (
    <>
      {/* Study Plans - Premium horizontal scroll */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap',
        padding: '14px 18px', borderRadius: 14,
        background: isLight
          ? 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(248,250,252,0.8))'
          : 'linear-gradient(135deg, rgba(15,15,25,0.5), rgba(20,20,35,0.3))',
        border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
        <span
          style={{
            fontSize: 11,
            color: isLight ? '#64748b' : 'rgba(255,255,255,0.35)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginRight: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Sparkles size={12} />
          Study Plans
        </span>
        {studyPlans.map((plan) => {
          const isActive = activePlan === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => {
                setActivePlan(isActive ? null : plan.id);
                setViewMode('all');
                setPage(1);
              }}
              title={plan.desc}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))'
                  : isLight
                    ? 'rgba(0,0,0,0.03)'
                    : 'rgba(255,255,255,0.03)',
                border: isActive
                  ? '1px solid rgba(139,92,246,0.35)'
                  : isLight
                    ? '1px solid rgba(0,0,0,0.06)'
                    : '1px solid rgba(255,255,255,0.05)',
                color: isActive ? '#c084fc' : isLight ? '#475569' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.25s ease',
                boxShadow: isActive ? '0 2px 10px rgba(139,92,246,0.15)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = isLight ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.15)';
                  e.currentTarget.style.color = '#a78bfa';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = isLight ? '#475569' : 'rgba(255,255,255,0.45)';
                }
              }}
            >
              {plan.label}
            </button>
          );
        })}
      </div>

      {/* View mode tabs + status bar - combined row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Tab group */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.025)',
          borderRadius: 12,
          padding: 3,
          border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)',
        }}>
          <button
            onClick={() => setViewMode('patterns')}
            style={{
              padding: '9px 22px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background:
                viewMode === 'patterns'
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))'
                  : 'transparent',
              border:
                viewMode === 'patterns'
                  ? '1px solid rgba(139,92,246,0.3)'
                  : '1px solid transparent',
              color:
                viewMode === 'patterns'
                  ? '#c084fc'
                  : isLight
                    ? 'rgba(0,0,0,0.45)'
                    : 'rgba(255,255,255,0.4)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: viewMode === 'patterns' ? '0 2px 10px rgba(139,92,246,0.12)' : 'none',
              letterSpacing: '-0.01em',
            }}
          >
            <Layout size={14} />
            Pattern Based
          </button>
          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '9px 22px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background:
                viewMode === 'all'
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))'
                  : 'transparent',
              border:
                viewMode === 'all'
                  ? '1px solid rgba(59,130,246,0.3)'
                  : '1px solid transparent',
              color:
                viewMode === 'all'
                  ? '#93c5fd'
                  : isLight
                    ? 'rgba(0,0,0,0.45)'
                    : 'rgba(255,255,255,0.4)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: viewMode === 'all' ? '0 2px 10px rgba(59,130,246,0.12)' : 'none',
              letterSpacing: '-0.01em',
            }}
          >
            <List size={14} />
            All Questions
          </button>
        </div>

        {/* Status */}
        <div
          style={{
            fontSize: 13,
            color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: 1,
          }}
        >
          <span style={{ fontWeight: 600 }}>
            <span style={{
              color: '#a78bfa', fontWeight: 800,
              background: 'linear-gradient(135deg, #c084fc, #818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{filteredCount}</span>
            <span style={{ marginLeft: 4 }}>problems</span>
          </span>
          {solvedInFiltered > 0 && (
            <span
              style={{
                color: '#34d399',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 8,
                background: 'rgba(52,211,153,0.08)',
              }}
            >
              <CheckCircle2 size={12} /> {solvedInFiltered} solved
            </span>
          )}
        </div>

        {/* Hide solved toggle */}
        <button
          onClick={() => {
            setHideSolved((current) => !current);
            setPage(1);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            background: hideSolved
              ? 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.08))'
              : isLight
                ? 'rgba(0,0,0,0.03)'
                : 'rgba(255,255,255,0.03)',
            border: hideSolved
              ? '1px solid rgba(52,211,153,0.25)'
              : isLight
                ? '1px solid rgba(0,0,0,0.06)'
                : '1px solid rgba(255,255,255,0.05)',
            color: hideSolved ? '#34d399' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.25s ease',
            letterSpacing: '-0.01em',
          }}
        >
          {hideSolved ? <EyeOff size={13} /> : <Eye size={13} />}
          {hideSolved ? 'Showing Unsolved' : 'Hide Solved'}
        </button>
      </div>
    </>
  );
}
