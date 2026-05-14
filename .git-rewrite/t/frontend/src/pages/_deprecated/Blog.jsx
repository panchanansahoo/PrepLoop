import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Code2, Brain, FileText, MessageSquare, BookOpen, Cpu } from 'lucide-react';

const blogPosts = [
    {
        icon: '📊',
        readTime: '8 min read',
        title: 'The 90 DSA Patterns That Cover 99% of Coding Interviews',
        desc: 'Master the 90 DSA patterns that form the backbone of coding interviews at top tech companies. Learn structured patterns with AI-powered practice.',
        category: 'DSA',
        link: '/dsa-patterns'
    },




    {
        icon: '🗺️',
        readTime: '6 min read',
        title: 'Structured Learning Paths: DSA, System Design, AI & More',
        desc: 'Follow curated learning paths designed by industry experts. Cover everything from basic data structures to advanced system design and AI/ML.',
        category: 'Learning',
        link: '/dashboard/learning-path'
    }
];

export default function Blog() {
    return (
        <div>
            <section className="home-hero" style={{ padding: '80px 20px 60px' }}>
                <div className="container">
                    <h1 style={{ fontSize: '48px' }}>Expert Guides & Resources</h1>
                    <p className="hero-sub">
                        Comprehensive guides on mastering technical interviews, DSA patterns, system design, resume optimization, and career advancement strategies.
                    </p>
                </div>
            </section>

            <section className="home-section">
                <div className="container">
                    <div className="blog-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                        {blogPosts.map((post, i) => (
                            <Link to={post.link} key={i} className="blog-card">
                                <div className="blog-card-img">
                                    <span>{post.icon}</span>
                                </div>
                                <div className="blog-card-body">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                        <div className="read-time"><Clock size={12} /> {post.readTime}</div>
                                        <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 11 }}>{post.category}</span>
                                    </div>
                                    <h3>{post.title}</h3>
                                    <p>{post.desc}</p>
                                    <span className="read-link">Read Guide <ArrowRight size={14} /></span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="home-cta-banner">
                <div className="container">
                    <h2>Start Preparing Today</h2>
                    <p>Get access to all guides, AI-powered tools, and structured learning paths.</p>
                    <Link to="/signup" className="btn-hero-primary" style={{ display: 'inline-flex' }}>
                        Get Started Free <ArrowRight size={18} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
