import { useState } from 'react';
import {
    Terminal, BarChart3, Eye, Layers, ChevronDown,
    Play, Pause, SkipForward, SkipBack, RotateCcw
} from 'lucide-react';
import ArrayVisualizer from '../visualizer/ArrayVisualizer';
import GraphVisualizer from '../visualizer/GraphVisualizer';

const VIZ_TABS = [
    { id: 'output', label: 'Output', icon: Terminal },
    { id: 'visualize', label: 'Visualize', icon: Eye },
    { id: 'variables', label: 'Variables', icon: Layers },
];

// ─── Simple Tree Visualizer ───
function TreeVisualizer({ data }) {
    if (!data || data.length === 0) return <EmptyState text="No tree data to visualize" />;

    const nodes = [];
    const edges = [];

    function buildTree(arr, index, x, y, spread) {
        if (index >= arr.length || arr[index] === null) return;
        nodes.push({ id: index, val: arr[index], x, y });
        const leftIdx = 2 * index + 1;
        const rightIdx = 2 * index + 2;
        if (leftIdx < arr.length && arr[leftIdx] !== null) {
            edges.push({ from: index, to: leftIdx });
            buildTree(arr, leftIdx, x - spread, y + 60, spread / 2);
        }
        if (rightIdx < arr.length && arr[rightIdx] !== null) {
            edges.push({ from: index, to: rightIdx });
            buildTree(arr, rightIdx, x + spread, y + 60, spread / 2);
        }
    }

    buildTree(data, 0, 300, 40, 120);

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    return (
        <svg width="600" height="320" viewBox="0 0 600 320" style={{ maxWidth: '100%' }}>
            {edges.map((e, i) => {
                const from = nodeMap[e.from];
                const to = nodeMap[e.to];
                if (!from || !to) return null;
                return (
                    <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke="rgba(139,92,246,0.3)" strokeWidth={2} />
                );
            })}
            {nodes.map(n => (
                <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r={20}
                        fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" strokeWidth={2} />
                    <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="central"
                        fill="#fff" fontSize={13} fontWeight={700} fontFamily="system-ui">
                        {n.val}
                    </text>
                </g>
            ))}
        </svg>
    );
}

// ─── Stack/Queue Visualizer ───
function StackQueueVisualizer({ data = [], type = 'stack' }) {
    if (data.length === 0) return <EmptyState text={`Empty ${type}`} />;

    return (
        <div style={{ display: 'flex', flexDirection: type === 'stack' ? 'column-reverse' : 'row', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
            {data.map((item, i) => (
                <div key={i} style={{
                    padding: '8px 20px', borderRadius: 8, minWidth: 50, textAlign: 'center',
                    background: i === (type === 'stack' ? data.length - 1 : 0) ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${i === (type === 'stack' ? data.length - 1 : 0) ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: i === (type === 'stack' ? data.length - 1 : 0) ? '#c084fc' : 'rgba(255,255,255,0.6)',
                    fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.3s ease',
                }}>
                    {item}
                </div>
            ))}
            {type === 'stack' && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>
                    ↑ TOP
                </div>
            )}
            {type === 'queue' && (
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>← FRONT</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>BACK →</span>
                </div>
            )}
        </div>
    );
}

// ─── Linked List Visualizer ───
function LinkedListVisualizer({ data = [] }) {
    if (data.length === 0) return <EmptyState text="Empty linked list" />;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginRight: 4 }}>HEAD →</span>
            {data.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 0,
                        borderRadius: 8, overflow: 'hidden',
                        border: '1px solid rgba(34,211,238,0.3)',
                    }}>
                        <div style={{
                            padding: '8px 14px',
                            background: 'rgba(34,211,238,0.1)',
                            color: '#22d3ee', fontSize: 13, fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>{item}</div>
                        <div style={{
                            padding: '8px 8px',
                            background: 'rgba(34,211,238,0.05)',
                            color: 'rgba(34,211,238,0.5)', fontSize: 10,
                        }}>→</div>
                    </div>
                    {i < data.length - 1 && (
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16 }}>→</span>
                    )}
                </div>
            ))}
            <span style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', fontSize: 10, fontWeight: 700,
            }}>null</span>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{text}</p>
        </div>
    );
}

export default function VisualizationPanel({
    output, feedback, vizType = 'none', vizData = null, variables = {}
}) {
    const [activeTab, setActiveTab] = useState('output');
    const [selectedViz, setSelectedViz] = useState('auto');

    const vizOptions = [
        { id: 'auto', label: 'Auto' },
        { id: 'array', label: 'Array' },
        { id: 'tree', label: 'Tree' },
        { id: 'graph', label: 'Graph' },
        { id: 'linkedList', label: 'Linked List' },
        { id: 'stack', label: 'Stack' },
        { id: 'queue', label: 'Queue' },
    ];

    // Try to parse actual output into visualizable data
    const parsedData = (() => {
        if (!output?.output) return null;
        try {
            const trimmed = output.output.trim();
            // Try parsing as JSON array
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
        // Try extracting numbers from output like "[1, 2, 3]"
        const match = output?.output?.match(/\[([^\]]+)\]/);
        if (match) {
            const nums = match[1].split(',').map(s => {
                const n = Number(s.trim());
                return isNaN(n) ? s.trim() : n;
            });
            if (nums.length > 0) return nums;
        }
        return null;
    })();

    const renderVisualization = () => {
        if (!output && !vizData) {
            return <EmptyState text="Run your code to see visualization here" />;
        }

        const type = selectedViz === 'auto' ? (vizType || 'array') : selectedViz;
        const arrayData = vizData || (parsedData ? { array: parsedData, highlights: [], sorted: [], swapping: false, comparing: false } : null);

        if (!arrayData && !parsedData) {
            return <EmptyState text="Output couldn't be visualized — try returning an array or data structure" />;
        }

        switch (type) {
            case 'array':
                return <ArrayVisualizer step={arrayData || { array: parsedData, highlights: [], sorted: [], swapping: false, comparing: false }} />;
            case 'tree':
                return <TreeVisualizer data={parsedData || []} />;
            case 'linkedList':
                return <LinkedListVisualizer data={parsedData || []} />;
            case 'stack':
                return <StackQueueVisualizer data={parsedData || []} type="stack" />;
            case 'queue':
                return <StackQueueVisualizer data={parsedData || []} type="queue" />;
            case 'graph':
                if (vizData) return <GraphVisualizer step={vizData} />;
                return <EmptyState text="Graph visualization requires structured data" />;
            default:
                if (parsedData) return <ArrayVisualizer step={{ array: parsedData, highlights: [], sorted: [], swapping: false, comparing: false }} />;
                return <EmptyState text="Run code that outputs an array to visualize" />;
        }
    };

    const variableEntries = Object.entries(variables).length > 0
        ? Object.entries(variables)
        : [];

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'rgba(10,10,26,0.95)',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            {/* Tab bar */}
            <div style={{
                display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 8px', flexShrink: 0,
            }}>
                {VIZ_TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            padding: '10px 14px', cursor: 'pointer',
                            background: 'transparent', border: 'none',
                            borderBottom: `2px solid ${activeTab === tab.id ? '#8b5cf6' : 'transparent'}`,
                            color: activeTab === tab.id ? '#c084fc' : 'rgba(255,255,255,0.4)',
                            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
                            transition: 'all 0.2s ease',
                        }}>
                            <Icon size={12} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                {/* Output Tab */}
                {activeTab === 'output' && (
                    <div>
                        {output ? (
                            <div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                                    fontSize: 13, fontWeight: 700,
                                    color: output.success ? '#4ade80' : '#f87171',
                                }}>
                                    {output.success ? '✓ ' : '✗ '}
                                    {output.submission
                                        ? (output.submission.status === 'accepted' ? 'Accepted' : 'Wrong Answer')
                                        : (output.success ? 'Executed Successfully' : 'Execution Error')
                                    }
                                </div>
                                {output.submission && (
                                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                        <div style={{
                                            padding: '8px 14px', borderRadius: 8,
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                        }}>
                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>Runtime</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: '#c084fc', fontFamily: "'JetBrains Mono', monospace" }}>{output.submission.runtime}</div>
                                        </div>
                                        <div style={{
                                            padding: '8px 14px', borderRadius: 8,
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                        }}>
                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>Memory</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', fontFamily: "'JetBrains Mono', monospace" }}>{output.submission.memory}</div>
                                        </div>
                                    </div>
                                )}
                                <pre style={{
                                    whiteSpace: 'pre-wrap', fontSize: 11,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: 'rgba(255,255,255,0.6)',
                                    padding: '6px 10px', borderRadius: 6, margin: 0,
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    {output.message}
                                </pre>
                                {output.output && output.output !== output.message && (
                                    <pre style={{
                                        whiteSpace: 'pre-wrap', fontSize: 11,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        color: '#e2e8f0',
                                        padding: '6px 10px', borderRadius: 6, marginTop: 4,
                                        background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)',
                                    }}>
                                        <span style={{ fontSize: 8, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Output</span>
                                        {output.output}
                                    </pre>
                                )}

                                {/* AI Feedback */}
                                {feedback && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                            <div style={{
                                                padding: '6px 12px', borderRadius: 8,
                                                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                                                fontSize: 11, fontWeight: 700, color: '#4ade80',
                                            }}>Time: {feedback.timeComplexity}</div>
                                            <div style={{
                                                padding: '6px 12px', borderRadius: 8,
                                                background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)',
                                                fontSize: 11, fontWeight: 700, color: '#60a5fa',
                                            }}>Space: {feedback.spaceComplexity}</div>
                                        </div>
                                        <div style={{
                                            padding: 12, borderRadius: 10,
                                            background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)',
                                        }}>
                                            <div style={{ fontSize: 10, color: '#c084fc', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
                                                💡 AI Feedback
                                            </div>
                                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                                                {feedback.suggestions}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyState text="Run your code to see output here" />
                        )}
                    </div>
                )}

                {/* Visualize Tab */}
                {activeTab === 'visualize' && (
                    <div>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                            {vizOptions.map(opt => (
                                <button key={opt.id} onClick={() => setSelectedViz(opt.id)} style={{
                                    padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                                    background: selectedViz === opt.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${selectedViz === opt.id ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                    color: selectedViz === opt.id ? '#c084fc' : 'rgba(255,255,255,0.4)',
                                }}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div style={{
                            padding: 16, borderRadius: 12,
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                            minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {renderVisualization()}
                        </div>
                    </div>
                )}

                {/* Variables Tab */}
                {activeTab === 'variables' && (
                    <div>
                        <div style={{
                            fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
                        }}>Variable Watch</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {variableEntries.length === 0 ? (
                                <EmptyState text="Variable tracking requires a debugger integration — coming soon" />
                            ) : variableEntries.map(([name, info]) => {
                                const val = typeof info === 'object' ? info : { value: info, type: typeof info, changed: false };
                                return (
                                    <div key={name} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '6px 12px', borderRadius: 8,
                                        background: val.changed ? 'rgba(250,204,21,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${val.changed ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                        transition: 'all 0.3s ease',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {val.changed && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24' }} />}
                                            <span style={{
                                                fontSize: 12, fontWeight: 700, color: '#c084fc',
                                                fontFamily: "'JetBrains Mono', monospace",
                                            }}>{name}</span>
                                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
                                                {val.type}
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: 12, fontWeight: 600,
                                            color: val.changed ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                                            fontFamily: "'JetBrains Mono', monospace",
                                        }}>
                                            {String(val.value)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
