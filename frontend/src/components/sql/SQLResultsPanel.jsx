import { useState } from 'react';
import { CheckCircle, XCircle, Clock, ArrowUpDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function SQLResultsPanel({ results, expectedOutput, status, executionTime, solutionUnlocked = false }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [activeTab, setActiveTab] = useState('results');
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const c = {
        bg: isLight ? '#fff' : '#0d0d1f',
        text: isLight ? '#1f2937' : '#e2e8f0',
        muted: isLight ? '#6b7280' : 'rgba(255,255,255,0.4)',
        mutedSoft: isLight ? '#9ca3af' : 'rgba(255,255,255,0.3)',
        mutedSofter: isLight ? '#d1d5db' : 'rgba(255,255,255,0.25)',
        border: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        borderLight: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.03)',
        headerBg: isLight ? '#fff' : '#0d0d1f',
        headerText: isLight ? '#4b5563' : 'rgba(255,255,255,0.6)',
        headerBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)',
        stripeBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.02)',
        nullColor: isLight ? '#d1d5db' : 'rgba(255,255,255,0.25)',
        activeTab: isLight ? '#1f2937' : '#e2e8f0',
        inactiveTab: isLight ? '#9ca3af' : 'rgba(255,255,255,0.4)',
        tabBorder: '#8b5cf6',
        emptyColor: isLight ? '#9ca3af' : 'rgba(255,255,255,0.3)',
    };

    const tabs = [
        { id: 'results', label: 'Results' },
        { id: 'solution', label: 'Solution' },
    ];

    const statusBadge = () => {
        if (!status) return null;
        const styles = {
            accepted: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', icon: CheckCircle, text: 'Accepted' },
            wrong: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: XCircle, text: 'Wrong Answer' },
            running: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', icon: Clock, text: 'Running...' },
            error: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: XCircle, text: 'Error' },
        };
        const s = styles[status] || styles.error;
        const Icon = s.icon;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600 }}>
                <Icon size={14} /> {s.text}
            </div>
        );
    };

    const sortData = (data, columns) => {
        if (!sortCol || !data) return data;
        const colIndex = columns.indexOf(sortCol);
        if (colIndex === -1) return data;
        return [...data].sort((a, b) => {
            const av = a[colIndex], bv = b[colIndex];
            if (av === null && bv === null) return 0;
            if (av === null) return 1;
            if (bv === null) return -1;
            if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
            return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        });
    };

    const handleSort = (col) => {
        if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
        else { setSortCol(col); setSortDir('asc'); }
    };

    const renderTable = (data) => {
        if (!data || !data.columns || !data.rows) {
            return <div style={{ padding: 24, textAlign: 'center', color: c.emptyColor, fontSize: 13 }}>Run your query to see results</div>;
        }
        const sorted = sortData(data.rows, data.columns);
        return (
            <div style={{ overflow: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr>
                            {data.columns.map(col => (
                                <th
                                    key={col}
                                    onClick={() => handleSort(col)}
                                    style={{ position: 'sticky', top: 0, padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: c.headerText, background: c.headerBg, borderBottom: `1px solid ${c.headerBorder}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', fontFamily: 'monospace', fontSize: 11 }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {col}
                                        <ArrowUpDown size={10} style={{ opacity: sortCol === col ? 0.8 : 0.2 }} />
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : c.stripeBg, transition: 'background 0.1s' }}>
                                {row.map((val, j) => (
                                    <td key={j} style={{ padding: '4px 10px', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap', color: val === null ? c.nullColor : c.text, fontStyle: val === null ? 'italic' : 'normal', borderBottom: `1px solid ${c.borderLight}` }}>
                                        {val === null ? 'NULL' : String(val)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const currentData = activeTab === 'results' ? results : expectedOutput;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.bg, color: c.text }}>
            {/* Tabs + status */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ padding: '8px 14px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? `2px solid ${c.tabBorder}` : '2px solid transparent', color: activeTab === tab.id ? c.activeTab : c.inactiveTab, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                        {tab.label}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {executionTime && <span style={{ fontSize: 11, color: c.mutedSoft }}>{currentData?.rows?.length || 0} rows • {executionTime}ms</span>}
                    {statusBadge()}
                </div>
            </div>

            {/* Content */}
            {activeTab === 'solution' && !solutionUnlocked ? (
                <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.emptyColor, fontSize: 13, textAlign: 'center' }}>
                    Submit your first solution to reveal the answer
                </div>
            ) : (
                renderTable(currentData)
            )}
        </div>
    );
}
