import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

const TOOLTIPS = {
    star: {
        title: 'STAR Framework',
        content: 'A structured method for answering behavioral questions:\n\n• **S**ituation — Describe the context\n• **T**ask — Explain your responsibility\n• **A**ction — Detail what you did\n• **R**esult — Share the outcome with metrics',
    },
    systemDesign: {
        title: 'System Design',
        content: 'System Design involves designing scalable, reliable software architectures:\n\n• **HLD** — High-Level Design: architecture, components, data flow\n• **LLD** — Low-Level Design: classes, APIs, database schema\n• Common topics: Load Balancers, Caching, Databases, Message Queues',
    },
    bigO: {
        title: 'Big-O Notation',
        content: 'Big-O describes algorithm efficiency:\n\n• **O(1)** — Constant time\n• **O(log n)** — Logarithmic (binary search)\n• **O(n)** — Linear (single loop)\n• **O(n log n)** — Sorting algorithms\n• **O(n²)** — Nested loops\n• **O(2ⁿ)** — Exponential (recursion)',
    },
    dp: {
        title: 'Dynamic Programming',
        content: 'DP solves complex problems by breaking them into overlapping subproblems:\n\n• **Memoization** — Top-down with cache\n• **Tabulation** — Bottom-up with table\n• Key: Identify optimal substructure and overlapping subproblems',
    },
    sql: {
        title: 'SQL Essentials',
        content: 'Structured Query Language for relational databases:\n\n• **SELECT / FROM / WHERE** — Basic queries\n• **JOIN** — Combine tables (INNER, LEFT, RIGHT)\n• **GROUP BY / HAVING** — Aggregation\n• **Subqueries** — Nested queries\n• **Window Functions** — Ranking, running totals',
    },
    behavioral: {
        title: 'Behavioral Interview',
        content: 'Companies assess soft skills and culture fit:\n\n• Use STAR framework for every answer\n• Prepare 5-6 strong stories from experience\n• Common themes: Leadership, Conflict, Failure, Teamwork\n• Be specific with numbers and outcomes',
    },
};

export default function InlineHelp({ topic, size = 14 }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const tip = TOOLTIPS[topic];

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    if (!tip) return null;

    return (
        <span className="inline-help" ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                className="ih-trigger"
                onClick={() => setOpen(!open)}
                aria-label={`Help: ${tip.title}`}
            >
                <HelpCircle size={size} />
            </button>
            {open && (
                <div className="ih-popover">
                    <div className="ih-header">
                        <span className="ih-title">{tip.title}</span>
                        <button className="ih-close" onClick={() => setOpen(false)}><X size={12} /></button>
                    </div>
                    <div className="ih-content">
                        {tip.content.split('\n').map((line, i) => (
                            <p key={i} dangerouslySetInnerHTML={{
                                __html: line
                                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/^• /, '<span style="color:var(--accent)">•</span> ')
                            }} />
                        ))}
                    </div>
                </div>
            )}
        </span>
    );
}
