import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight, Search, Tag, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/api.js';


export default function BlogList() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const { user } = useAuth();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const response = await fetch(`${API_URL}/api/blog`);
            if (response.ok) {
                const data = await response.json();
                setBlogs(data);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', 'System Design', 'DSA', 'AI/ML', 'Career', 'Interview Tips'];

    const filteredBlogs = filter === 'All'
        ? blogs
        : blogs.filter(blog => blog.category === filter);

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : 'white', position: 'relative' }}>


            {/* Header */}
            <section style={{ paddingTop: '120px', paddingBottom: '60px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <div className="container">
                    <div className="badge" style={{ marginBottom: '20px', display: 'inline-flex' }}>
                        <span style={{ marginRight: '8px' }}>✍️</span> Engineering Thoughts
                    </div>
                    <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>
                        Latest <span className="text-gradient">Insights</span>
                    </h1>
                    <p style={{ color: 'var(--zinc-400)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        Deep dives into system design, algorithmic patterns, and the future of AI in software engineering.
                    </p>
                </div>
            </section>

            {/* Categories & Search */}
            <section className="container" style={{ marginBottom: '40px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: filter === cat ? '1px solid var(--accent)' : '1px solid var(--zinc-800)',
                                    background: filter === cat ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    color: filter === cat ? 'var(--accent)' : 'var(--zinc-400)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--zinc-500)' }} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            style={{
                                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)',
                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                padding: '10px 16px 10px 40px',
                                borderRadius: '8px',
                                color: isLight ? '#1a1a2e' : 'white',
                                outline: 'none',
                                width: '240px'
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Create Button (Author only - for now just logged in) */}
            {isAdmin && (
                <div className="container" style={{ marginBottom: '40px', textAlign: 'right', position: 'relative', zIndex: 10 }}>
                    <Link to="/blog/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        Write Article <ArrowRight size={16} />
                    </Link>
                </div>
            )}

            {/* Blog Grid */}
            <section className="container" style={{ paddingBottom: '100px', position: 'relative', zIndex: 10 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>Loading insights...</div>
                ) : filteredBlogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--zinc-500)' }}>
                        No articles found. Be the first to write one!
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '32px' }}>
                        {filteredBlogs.map(blog => (
                            <Link to={`/blog/${blog.slug}`} key={blog.id} className="card" style={{ display: 'block', textDecoration: 'none', padding: 0, overflow: 'hidden' }}>
                                {blog.cover_image && (
                                    <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                                        <img src={blog.cover_image} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} />
                                    </div>
                                )}
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', fontSize: '12px', color: 'var(--zinc-500)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={14} /> {new Date(blog.created_at).toLocaleDateString()}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} /> {blog.read_time || 5} min read
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: '22px', marginBottom: '12px', color: isLight ? '#1a1a2e' : 'white', lineHeight: 1.4 }}>{blog.title}</h3>
                                    <p style={{ color: 'var(--zinc-400)', fontSize: '15px', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {/* Plain text preview if content is complex */}
                                        To perform simple preview we would strip HTML tags. For now, assuming title is catchy enough.
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--zinc-800)', paddingTop: '16px', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {blog.author?.avatar_url ? (
                                                <img src={blog.author.avatar_url} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                            ) : (
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--zinc-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                    <User size={14} />
                                                </div>
                                            )}
                                            <span style={{ fontSize: '13px', color: 'var(--zinc-400)' }}>{blog.author?.full_name || 'Anonymous'}</span>
                                        </div>
                                        <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 500 }}>Read More</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
