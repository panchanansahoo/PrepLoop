import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Key, Link2, Star, AlertCircle, Search, Table2, Eye } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const constraintIcon = (col) => {
    if (col.primaryKey) return <Key size={12} style={{ color: '#f59e0b' }} title="Primary Key" />;
    if (col.foreignKey) return <Link2 size={12} style={{ color: '#3b82f6' }} title={`FK → ${col.foreignKey.table}.${col.foreignKey.column}`} />;
    if (col.unique) return <Star size={12} style={{ color: '#8b5cf6' }} title="Unique" />;
    if (!col.nullable) return <AlertCircle size={12} style={{ color: '#ef4444' }} title="NOT NULL" />;
    return null;
};

export default function SchemaViewer({ schema }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const c = {
        bg: isLight ? '#fff' : '#0d0d1f',
        text: isLight ? '#1f2937' : '#e2e8f0',
        muted: isLight ? '#6b7280' : 'rgba(255,255,255,0.4)',
        mutedSoft: isLight ? '#9ca3af' : 'rgba(255,255,255,0.3)',
        mutedSofter: isLight ? '#d1d5db' : 'rgba(255,255,255,0.25)',
        border: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        borderLight: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.03)',
        inputBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.04)',
        inputBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)',
        cardBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.02)',
        headerBg: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)',
        colType: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
        searchIcon: isLight ? '#d1d5db' : 'rgba(255,255,255,0.3)',
        sampleBtnBg: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)',
        sampleBtnBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)',
        sampleBtnColor: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
        stripeBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.02)',
        nullColor: isLight ? '#d1d5db' : 'rgba(255,255,255,0.25)',
        thText: isLight ? '#9ca3af' : 'rgba(255,255,255,0.35)',
        relLabel: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
        relType: isLight ? '#d1d5db' : 'rgba(255,255,255,0.2)',
        fkColor: '#60a5fa',
        pkColor: '#f59e0b',
    };

    const [expandedTables, setExpandedTables] = useState(() => {
        const set = new Set();
        if (schema?.tables?.length) set.add(schema.tables[0].name);
        return set;
    });
    const [showSample, setShowSample] = useState({});
    const [search, setSearch] = useState('');

    if (!schema) return <div style={{ padding: 24, color: c.muted, textAlign: 'center' }}>No schema loaded</div>;

    const toggleTable = (name) => {
        setExpandedTables(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const filteredTables = schema.tables.filter(t =>
        !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.columns.some(col => col.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.bg, color: c.text }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{schema.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: schema.color }}>{schema.name}</span>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: c.searchIcon }} />
                    <input
                        type="text" placeholder="Search tables & columns..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 6, padding: '6px 8px 6px 28px', color: c.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* Tables */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
                {filteredTables.map(table => {
                    const isOpen = expandedTables.has(table.name);
                    const showingSample = showSample[table.name];
                    return (
                        <div key={table.name} style={{ marginBottom: 8, border: `1px solid ${c.border}`, borderRadius: 8, overflow: 'hidden', background: c.cardBg }}>
                            {/* Table header */}
                            <div
                                onClick={() => toggleTable(table.name)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', background: isOpen ? c.headerBg : 'transparent', transition: 'background 0.15s' }}
                            >
                                {isOpen ? <ChevronDown size={14} style={{ color: c.muted }} /> : <ChevronRight size={14} style={{ color: c.muted }} />}
                                <Table2 size={14} style={{ color: schema.color }} />
                                <span style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{table.name}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: c.mutedSoft }}>{table.columns.length} cols</span>
                            </div>

                            {/* Columns */}
                            {isOpen && (
                                <div style={{ padding: '0 12px 8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                        <thead>
                                            <tr style={{ color: c.thText, borderBottom: `1px solid ${c.border}` }}>
                                                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 500 }}>Column</th>
                                                <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 500 }}>Type</th>
                                                <th style={{ textAlign: 'center', padding: '4px 6px', fontWeight: 500, width: 30 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {table.columns.map(col => (
                                                <tr key={col.name} style={{ borderBottom: `1px solid ${c.borderLight}` }}>
                                                    <td style={{ padding: '3px 6px', fontFamily: 'monospace', color: col.primaryKey ? c.pkColor : col.foreignKey ? c.fkColor : c.text }}>
                                                        {col.name}
                                                    </td>
                                                    <td style={{ padding: '3px 6px', color: c.colType, fontFamily: 'monospace', fontSize: 10 }}>
                                                        {col.type}
                                                    </td>
                                                    <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                                                        {constraintIcon(col)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* FK references */}
                                    {table.columns.filter(col => col.foreignKey).map(col => (
                                        <div key={col.name} style={{ fontSize: 10, color: c.fkColor, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Link2 size={10} /> {col.name} → {col.foreignKey.table}.{col.foreignKey.column}
                                        </div>
                                    ))}

                                    {/* Sample data toggle */}
                                    {table.sampleData && (
                                        <button
                                            onClick={() => setShowSample(prev => ({ ...prev, [table.name]: !prev[table.name] }))}
                                            style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '3px 8px', background: c.sampleBtnBg, border: `1px solid ${c.sampleBtnBorder}`, borderRadius: 4, color: c.sampleBtnColor, fontSize: 10, cursor: 'pointer' }}
                                        >
                                            <Eye size={10} /> {showingSample ? 'Hide' : 'Show'} sample data
                                        </button>
                                    )}

                                    {/* Sample data table */}
                                    {showingSample && table.sampleData && (
                                        <div style={{ marginTop: 6, overflow: 'auto', maxHeight: 140 }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                                                <thead>
                                                    <tr>
                                                        {table.columns.map(col => (
                                                            <th key={col.name} style={{ padding: '3px 6px', textAlign: 'left', color: c.muted, fontWeight: 500, whiteSpace: 'nowrap', borderBottom: `1px solid ${c.border}`, fontFamily: 'monospace' }}>{col.name}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {table.sampleData.map((row, i) => (
                                                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : c.stripeBg }}>
                                                            {row.map((val, j) => (
                                                                <td key={j} style={{ padding: '2px 6px', whiteSpace: 'nowrap', fontFamily: 'monospace', color: val === null ? c.nullColor : c.text }}>
                                                                    {val === null ? 'NULL' : String(val)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Relationships */}
                {schema.relationships && schema.relationships.length > 0 && (
                    <div style={{ marginTop: 12, padding: '8px 12px', border: `1px solid ${c.border}`, borderRadius: 8, background: c.cardBg }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: c.relLabel, marginBottom: 6 }}>Relationships</div>
                        {schema.relationships.map((rel, i) => (
                            <div key={i} style={{ fontSize: 10, color: c.muted, padding: '2px 0', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ color: '#60a5fa' }}>{rel.from}</span>
                                <span>→</span>
                                <span style={{ color: '#10b981' }}>{rel.to}</span>
                                <span style={{ marginLeft: 8, color: c.relType, fontSize: 9 }}>({rel.type})</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
