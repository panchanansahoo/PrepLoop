import React, { useState, useEffect } from 'react';

const quotes = [
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
    { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Truth can only be found in one place: the code.", author: "Robert C. Martin" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "It's not a bug — it's an undocumented feature.", author: "Anonymous" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
    { text: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", author: "Bill Gates" },
    { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
];

function getQuoteOfDay() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return quotes[dayOfYear % quotes.length];
}

export default function CodingQuote() {
    const [quote, setQuote] = useState(getQuoteOfDay);
    const [fade, setFade] = useState(true);

    const nextQuote = () => {
        setFade(false);
        setTimeout(() => {
            const idx = quotes.indexOf(quote);
            setQuote(quotes[(idx + 1) % quotes.length]);
            setFade(true);
        }, 200);
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.04))',
            borderRadius: 16,
            border: '1px solid rgba(139, 92, 246, 0.15)',
            padding: '24px 28px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative accent */}
            <div style={{
                position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                borderRadius: '50%', background: 'rgba(139, 92, 246, 0.06)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: -20, left: -20, width: 80, height: 80,
                borderRadius: '50%', background: 'rgba(99, 102, 241, 0.04)', pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>💡</span> Quote of the Day
                </div>
                <button onClick={nextQuote} style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '5px 12px', color: 'rgba(255,255,255,0.5)',
                    fontSize: 11, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                }} onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#fff'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = 'rgba(255,255,255,0.5)'; }}>
                    Next →
                </button>
            </div>

            <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.2s', position: 'relative', zIndex: 1 }}>
                <div style={{
                    fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)',
                    fontStyle: 'italic', marginBottom: 12, fontWeight: 500,
                }}>
                    "{quote.text}"
                </div>
                <div style={{ fontSize: 13, color: 'rgba(139, 92, 246, 0.8)', fontWeight: 600 }}>
                    — {quote.author}
                </div>
            </div>
        </div>
    );
}
