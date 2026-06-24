import {CheckCircle2, Eye, EyeOff, List, Sparkles, Layout, Map} from 'lucide-react';

export function ProblemExplorerViewControls({
  isLight,
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
            onClick={() => {
              setViewMode('patterns');
              setActivePlan(null);
            }}
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
            onClick={() => {
              setViewMode('all');
              setActivePlan(null);
            }}
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
          <button
            onClick={() => setViewMode('plans')}
            style={{
              padding: '9px 22px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background:
                viewMode === 'plans'
                  ? 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(219,39,119,0.15))'
                  : 'transparent',
              border:
                viewMode === 'plans'
                  ? '1px solid rgba(236,72,153,0.3)'
                  : '1px solid transparent',
              color:
                viewMode === 'plans'
                  ? '#f472b6'
                  : isLight
                    ? 'rgba(0,0,0,0.45)'
                    : 'rgba(255,255,255,0.4)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: viewMode === 'plans' ? '0 2px 10px rgba(236,72,153,0.12)' : 'none',
              letterSpacing: '-0.01em',
            }}
          >
            <Sparkles size={14} />
            Study Plans
          </button>
          <button
            onClick={() => setViewMode('roadmap')}
            style={{
              padding: '9px 22px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background:
                viewMode === 'roadmap'
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.15))'
                  : 'transparent',
              border:
                viewMode === 'roadmap'
                  ? '1px solid rgba(245,158,11,0.3)'
                  : '1px solid transparent',
              color:
                viewMode === 'roadmap'
                  ? '#fbbf24'
                  : isLight
                    ? 'rgba(0,0,0,0.45)'
                    : 'rgba(255,255,255,0.4)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: viewMode === 'roadmap' ? '0 2px 10px rgba(245,158,11,0.12)' : 'none',
              letterSpacing: '-0.01em',
            }}
          >
            <Map size={14} />
            Roadmap
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
