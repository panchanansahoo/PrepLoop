import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Code2, FileText, BookOpen, Brain, Cpu, TrendingUp } from 'lucide-react';

const coreFeatures = [

  {
    icon: <Code2 size={24} />,
    title: 'AI Code Practice',
    desc: 'Master coding problems with intelligent hints, pattern recognition, and step-by-step guidance.',
    bullets: ['500+ problems', 'Pattern-based learning', 'Intelligent hints'],
    link: '/code-practice',
    bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8'
  },

];



const dsaPatterns = [
  'Two Pointers', 'Sliding Window', 'Binary Search', 'Dynamic Programming',
  'Graph Traversal', 'Tree Patterns', 'Backtracking', 'Greedy Algorithms'
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="home-hero" style={{ padding: '80px 20px 60px' }}>
        <div className="container">
          <h1 style={{ fontSize: '48px' }}>Master Technical Interviews with AI</h1>
          <p className="hero-sub">
            Advanced AI-powered platform for coding interviews, system design, and career preparation
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <h2>Core Features</h2>
            <p>Everything you need to ace technical interviews with AI-powered guidance</p>
          </div>
          <div className="home-features-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {coreFeatures.map((f, i) => (
              <Link to={f.link} key={i} className="home-feature-card">
                <div className="home-feature-icon" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <ul>
                  {f.bullets.map((b, j) => (
                    <li key={j}>✓ {b}</li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* DSA 90 Patterns */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <h2>DSA 90 Patterns</h2>
            <p>Master the most important coding patterns that appear in 90% of technical interviews</p>
          </div>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 30 }}>
              {dsaPatterns.map((p, i) => (
                <span key={i} style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600
                }}>{p}</span>
              ))}
              <span style={{
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                border: '1px solid var(--border)'
              }}>+82 more patterns</span>
            </div>
            <Link to="/dsa-patterns" className="btn-hero-primary" style={{ display: 'inline-flex' }}>
              Explore All Patterns <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta-banner">
        <div className="container">
          <h2>Start Your Journey Today</h2>
          <p>Join thousands of engineers who landed their dream jobs with AI-powered preparation.</p>
          <Link to="/signup" className="btn-hero-primary" style={{ display: 'inline-flex' }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
