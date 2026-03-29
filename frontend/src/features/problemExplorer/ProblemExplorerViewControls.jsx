import React from 'react';
import { BookOpen, CheckCircle2, Eye, EyeOff, List } from 'lucide-react';

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
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginRight: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <BookOpen size={12} /> Study Plans:
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
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                background: isActive
                  ? 'rgba(139,92,246,0.15)'
                  : isLight
                    ? 'rgba(0,0,0,0.03)'
                    : 'rgba(255,255,255,0.03)',
                border: isActive
                  ? '1px solid rgba(139,92,246,0.3)'
                  : isLight
                    ? '1px solid rgba(0,0,0,0.08)'
                    : '1px solid rgba(255,255,255,0.06)',
                color: isActive ? '#c084fc' : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.15s',
              }}
            >
              {plan.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 14,
          background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
          borderRadius: 10,
          padding: 3,
          border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setViewMode('patterns')}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background:
              viewMode === 'patterns'
                ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))'
                : 'transparent',
            border:
              viewMode === 'patterns'
                ? '1px solid rgba(139,92,246,0.35)'
                : '1px solid transparent',
            color:
              viewMode === 'patterns'
                ? '#c084fc'
                : isLight
                  ? 'rgba(0,0,0,0.5)'
                  : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <BookOpen size={14} /> Pattern Based
        </button>
        <button
          onClick={() => setViewMode('all')}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background:
              viewMode === 'all'
                ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.2))'
                : 'transparent',
            border:
              viewMode === 'all'
                ? '1px solid rgba(59,130,246,0.35)'
                : '1px solid transparent',
            color:
              viewMode === 'all'
                ? '#93c5fd'
                : isLight
                  ? 'rgba(0,0,0,0.5)'
                  : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <List size={14} /> All Questions
        </button>
      </div>

      <div
        style={{
          fontSize: 13,
          color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>
          Showing <span style={{ color: '#c084fc', fontWeight: 700 }}>{filteredCount}</span> problems
        </span>
        {solvedInFiltered > 0 && (
          <span
            style={{
              color: 'rgba(110,231,183,0.6)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <CheckCircle2 size={11} /> {solvedInFiltered} solved
          </span>
        )}
        <button
          onClick={() => {
            setHideSolved((current) => !current);
            setPage(1);
          }}
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 12px',
            borderRadius: 7,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            background: hideSolved
              ? 'rgba(110,231,183,0.12)'
              : isLight
                ? 'rgba(0,0,0,0.03)'
                : 'rgba(255,255,255,0.03)',
            border: hideSolved
              ? '1px solid rgba(110,231,183,0.25)'
              : isLight
                ? '1px solid rgba(0,0,0,0.08)'
                : '1px solid rgba(255,255,255,0.06)',
            color: hideSolved ? '#6ee7b7' : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
          }}
        >
          {hideSolved ? <EyeOff size={12} /> : <Eye size={12} />}
          {hideSolved ? 'Showing Unsolved' : 'Hide Solved'}
        </button>
      </div>
    </>
  );
}
