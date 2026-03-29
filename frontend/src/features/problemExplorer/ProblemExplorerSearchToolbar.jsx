import { Search, SlidersHorizontal, X } from 'lucide-react';

export function ProblemExplorerSearchToolbar({
    search,
    setSearch,
    isLight,
    showFilters,
    setShowFilters,
    activeFilterCount,
}) {
    return (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Search size={18} color={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'} />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search problems by name or topic..."
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        color: isLight ? '#1e293b' : '#fff',
                        fontSize: 14,
                    }}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={16} color={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'} />
                    </button>
                )}
            </div>
            <button
                onClick={() => setShowFilters((current) => !current)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: showFilters ? 'rgba(139,92,246,0.15)' : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                    border: showFilters ? '1px solid rgba(139,92,246,0.3)' : isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
                    color: showFilters ? '#c084fc' : isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                }}
            >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                    <span
                        style={{
                            background: '#8b5cf6',
                            color: '#fff',
                            borderRadius: '50%',
                            width: 18,
                            height: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 800,
                        }}
                    >
                        {activeFilterCount}
                    </span>
                )}
            </button>
        </div>
    );
}
