export function ProblemExplorerFiltersPanel({
    showFilters,
    isLight,
    activeFilterCount,
    clearAll,
    difficulties,
    selectedDifficulties,
    setSelectedDifficulties,
    topics,
    selectedTopics,
    setSelectedTopics,
    companies,
    selectedCompanies,
    setSelectedCompanies,
    patterns,
    selectedPatterns,
    setSelectedPatterns,
    frequencies,
    selectedFrequency,
    setSelectedFrequency,
    timeEstimates,
    maxTime,
    setMaxTime,
    toggleListItem,
    diffColor,
    freqColor,
}) {
    if (!showFilters) {
        return null;
    }

    return (
        <div style={{
            background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 22,
            border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)', marginBottom: 20,
            display: 'flex', flexDirection: 'column', gap: 18,
            boxShadow: isLight ? '0 4px 30px rgba(0,0,0,0.06)' : '0 4px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)' }}>FILTERS</span>
                {activeFilterCount > 0 && (
                    <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Clear All</button>
                )}
            </div>

            <div>
                <div style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Difficulty</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {difficulties.map(d => {
                        const active = selectedDifficulties.includes(d);
                        return (
                            <button key={d} onClick={() => toggleListItem(selectedDifficulties, setSelectedDifficulties, d)} style={{
                                padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                background: active ? `${diffColor(d)}20` : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                border: active ? `1px solid ${diffColor(d)}40` : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                                color: active ? diffColor(d) : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                            }}>{d}</button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Topics</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {topics.map(t => {
                        const active = selectedTopics.includes(t);
                        return (
                            <button key={t} onClick={() => toggleListItem(selectedTopics, setSelectedTopics, t)} style={{
                                padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                background: active ? 'rgba(139,92,246,0.2)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                                border: active ? '1px solid rgba(139,92,246,0.4)' : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
                                color: active ? '#c084fc' : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                            }}>{t}</button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Companies</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {companies.map(c => {
                        const active = selectedCompanies.includes(c.id);
                        return (
                            <button key={c.id} onClick={() => toggleListItem(selectedCompanies, setSelectedCompanies, c.id)} style={{
                                padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                background: active ? `${c.color}20` : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                                border: active ? `1px solid ${c.color}40` : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
                                color: active ? c.color : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                            }}>{c.name}</button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Patterns / Algorithms</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {patterns.map(p => {
                        const active = selectedPatterns.includes(p.id);
                        return (
                            <button key={p.id} onClick={() => toggleListItem(selectedPatterns, setSelectedPatterns, p.id)}
                                title={p.desc} style={{
                                    padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                    background: active ? `${p.color}20` : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                                    border: active ? `1px solid ${p.color}40` : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
                                    color: active ? p.color : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                <span style={{ fontSize: 12 }}>{p.icon}</span>{p.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Frequency</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {frequencies.map(f => {
                            const active = selectedFrequency === f;
                            return (
                                <button key={f} onClick={() => setSelectedFrequency(active ? '' : f)} style={{
                                    padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                                    background: active ? `${freqColor(f)}20` : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                                    border: active ? `1px solid ${freqColor(f)}40` : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
                                    color: active ? freqColor(f) : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                                }}>{f}</button>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Max Time (min)</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {timeEstimates.map(t => {
                            const active = maxTime === String(t);
                            return (
                                <button key={t} onClick={() => setMaxTime(active ? '' : String(t))} style={{
                                    padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                    background: active ? 'rgba(103,232,249,0.15)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                                    border: active ? '1px solid rgba(103,232,249,0.4)' : isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
                                    color: active ? '#67e8f9' : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                                }}>{t}m</button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
