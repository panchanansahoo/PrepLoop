import React, { useRef, useState } from 'react';
import { Search, SlidersHorizontal, X, Command } from 'lucide-react';

export function ProblemExplorerSearchToolbar({
    search,
    setSearch,
    isLight,
    showFilters,
    setShowFilters,
    activeFilterCount,
}) {
    const inputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleSearchContainerClick = () => {
        inputRef.current?.focus();
    };

    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            {/* Search Input */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: isLight
                        ? isFocused ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)'
                        : isFocused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    borderRadius: 14,
                    padding: '12px 18px',
                    border: isFocused
                        ? isLight ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.35)'
                        : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isFocused
                        ? isLight ? '0 4px 20px rgba(139,92,246,0.08), 0 0 0 3px rgba(139,92,246,0.06)' : '0 4px 20px rgba(139,92,246,0.12), 0 0 0 3px rgba(139,92,246,0.08)'
                        : isLight ? '0 2px 8px rgba(0,0,0,0.03)' : '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    cursor: 'text',
                }}
                onClick={handleSearchContainerClick}
            >
                <Search
                    size={18}
                    color={isFocused ? '#8b5cf6' : isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}
                    style={{ flexShrink: 0, transition: 'color 0.2s' }}
                />
                <input
                    ref={inputRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search problems, patterns, or topics..."
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: 14,
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                    }}
                />
                {search ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setSearch(''); }}
                        style={{
                            background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                            border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}
                    >
                        <X size={14} color={isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'} />
                    </button>
                ) : (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '3px 8px', borderRadius: 6,
                        background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                        border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
                        flexShrink: 0,
                    }}>
                        <Command size={10} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)' }}>K</span>
                    </div>
                )}
            </div>

            {/* Filters Button */}
            <button
                onClick={() => setShowFilters((current) => !current)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    borderRadius: 14,
                    background: showFilters
                        ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))'
                        : isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.03)',
                    border: showFilters
                        ? '1px solid rgba(139,92,246,0.3)'
                        : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                    color: showFilters ? '#a78bfa' : isLight ? '#475569' : 'rgba(255,255,255,0.5)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: showFilters
                        ? '0 4px 16px rgba(139,92,246,0.12)' : 'none',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                    if (!showFilters) {
                        e.currentTarget.style.background = isLight ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
                        e.currentTarget.style.color = '#a78bfa';
                    }
                }}
                onMouseLeave={e => {
                    if (!showFilters) {
                        e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = isLight ? '#475569' : 'rgba(255,255,255,0.5)';
                    }
                }}
            >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: '#fff',
                            borderRadius: 8,
                            minWidth: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '0 6px',
                            boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
                        }}
                    >
                        {activeFilterCount}
                    </span>
                )}
            </button>
        </div>
    );
}
