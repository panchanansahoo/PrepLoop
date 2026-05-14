import { useState } from 'react';

const THEME = {
    bg: 'rgba(10,10,26,0.95)',
    line: 'rgba(255,255,255,0.03)',
    activeLine: 'rgba(139,92,246,0.12)',
    activeLineBorder: 'rgba(139,92,246,0.4)',
    lineNum: 'rgba(255,255,255,0.2)',
    lineNumActive: '#c084fc',
    keyword: '#c084fc',
    string: '#34d399',
    number: '#fbbf24',
    comment: 'rgba(255,255,255,0.25)',
    fn: '#60a5fa',
    variable: '#f0abfc',
    operator: '#f472b6',
    bracket: 'rgba(255,255,255,0.5)',
    text: 'rgba(255,255,255,0.8)',
    type: '#22d3ee',
};

function tokenize(line) {
    const tokens = [];
    const patterns = [
        { regex: /^(\/\/.*)/, type: 'comment' },
        { regex: /^(#.*)/, type: 'comment' },
        { regex: /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, type: 'string' },
        { regex: /^(\b(?:function|const|let|var|if|else|for|while|return|def|class|import|from|in|of|new|true|false|null|undefined|break|continue|switch|case|default|do|try|catch|finally|throw|async|await|yield|not|and|or|is|None|True|False|elif|pass|lambda|with|as|raise|except)\b)/, type: 'keyword' },
        { regex: /^(\b\d+\.?\d*\b)/, type: 'number' },
        { regex: /^(\b(?:Array|Math|console|log|push|pop|shift|unshift|slice|splice|sort|filter|map|reduce|forEach|indexOf|includes|length|append|len|range|print|sorted|enumerate|zip|list|dict|set|int|str|float|min|max|abs|sum|swap|heapq|deque|collections|defaultdict)\b)/, type: 'fn' },
        { regex: /^([+\-*/%=<>!&|^~?:]+)/, type: 'operator' },
        { regex: /^([()[\]{}])/, type: 'bracket' },
        { regex: /^(\s+)/, type: 'space' },
        { regex: /^(\w+)/, type: 'text' },
        { regex: /^(.)/, type: 'text' },
    ];

    let remaining = line;
    while (remaining.length > 0) {
        let matched = false;
        for (const { regex, type } of patterns) {
            const match = remaining.match(regex);
            if (match) {
                tokens.push({ text: match[1], type });
                remaining = remaining.slice(match[1].length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            tokens.push({ text: remaining[0], type: 'text' });
            remaining = remaining.slice(1);
        }
    }
    return tokens;
}

export default function CodePanel({ code, activeLine = -1, language = 'javascript', algoColor = '#8b5cf6' }) {
    const [collapsed, setCollapsed] = useState(false);
    if (!code) return null;

    const lines = code.split('\n');

    return (
        <div style={{
            borderRadius: 14,
            background: THEME.bg,
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 14px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {language} · Algorithm Code
                    </span>
                </div>
                <button onClick={() => setCollapsed(c => !c)} style={{
                    padding: '2px 10px', borderRadius: 6, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600,
                }}>
                    {collapsed ? '▼ Show' : '▲ Hide'}
                </button>
            </div>

            {/* Code body */}
            {!collapsed && (
                <div style={{
                    maxHeight: 320, overflowY: 'auto', padding: '8px 0',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                    fontSize: 12, lineHeight: '20px',
                }}>
                    {lines.map((line, i) => {
                        const lineNum = i + 1;
                        const isActive = lineNum === activeLine;
                        const tokens = tokenize(line);
                        return (
                            <div key={i} style={{
                                display: 'flex',
                                background: isActive ? THEME.activeLine : 'transparent',
                                borderLeft: isActive ? `3px solid ${algoColor}` : '3px solid transparent',
                                padding: '0 12px 0 0',
                                transition: 'all 0.2s ease',
                            }}>
                                {/* Line number */}
                                <span style={{
                                    width: 40, minWidth: 40, textAlign: 'right', paddingRight: 12,
                                    color: isActive ? THEME.lineNumActive : THEME.lineNum,
                                    fontWeight: isActive ? 800 : 400,
                                    userSelect: 'none',
                                }}>
                                    {lineNum}
                                </span>
                                {/* Code content */}
                                <span style={{ whiteSpace: 'pre' }}>
                                    {tokens.map((tok, j) => (
                                        <span key={j} style={{
                                            color: tok.type === 'space' ? undefined : THEME[tok.type] || THEME.text,
                                        }}>{tok.text}</span>
                                    ))}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
