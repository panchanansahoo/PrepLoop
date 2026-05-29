import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Share2, Bookmark } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import DOMPurify from 'dompurify';
import NotionViewer from '../components/editor/NotionViewer';
import { API_URL } from '../config/api.js';


export default function BlogPost() {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const sanitizedHtml = useMemo(() => {
        if (!blog?.content || !blog.content.trim()) return '';
        return DOMPurify.sanitize(blog.content, {
            USE_PROFILES: { html: true },
        });
    }, [blog?.content]);

    useEffect(() => {
        fetchBlog();
    }, [slug]);

    const fetchBlog = async () => {
        try {
            const response = await fetch(`${API_URL}/api/blog/${slug}`);
            if (response.ok) {
                const data = await response.json();
                setBlog(data);
            } else {
                // Handle 404
            }
        } catch (error) {
            console.error('Error fetching blog:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (!blog) return <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Blog not found.</div>;

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : 'white', position: 'relative' }}>


            {/* Navbar Placeholder/Spacer since we have a fixed navbar */}
            <div style={{ height: '80px' }}></div>

            <article className="container" style={{ maxWidth: '800px', padding: '60px 20px 100px', position: 'relative', zIndex: 10 }}>
                <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--zinc-400)', marginBottom: '40px', textDecoration: 'none' }}>
                    <ArrowLeft size={16} /> Back to Blog
                </Link>

                <div style={{ marginBottom: '20px', color: 'var(--accent)', fontWeight: 600 }}>{blog.category || 'General'}</div>

                <h1 style={{ fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.1, marginBottom: '32px', fontWeight: 700 }}>
                    {blog.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--zinc-800)', paddingBottom: '32px', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Author Avatar */}
                        {blog.author?.avatar_url ? (
                            <img src={blog.author.avatar_url} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                        ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--zinc-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={20} />
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 500, color: isLight ? '#1a1a2e' : 'white' }}>{blog.author?.full_name || 'Anonymous'}</div>
                            <div style={{ fontSize: '13px', color: 'var(--zinc-500)', display: 'flex', gap: '12px' }}>
                                <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{blog.read_time || 5} min read</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="icon-btn" title="Share"><Share2 size={20} /></button>
                        <button className="icon-btn" title="Save"><Bookmark size={20} /></button>
                    </div>
                </div>

                {blog.cover_image && (
                    <img
                        src={blog.cover_image}
                        alt={blog.title}
                        style={{ width: '100%', borderRadius: '16px', marginBottom: '60px', border: '1px solid var(--zinc-800)' }}
                    />
                )}

                {/* Content Area - Render JSON Blocks or Legacy HTML */}
                {blog.content && blog.content.trim().startsWith('[') ? (
                    <div className="notion-renderer">
                        <NotionViewer content={blog.content} />
                    </div>
                ) : (
                    <div
                        className="blog-content"
                        style={{ fontSize: '18px', lineHeight: 1.8, color: isLight ? '#444' : 'var(--zinc-300)' }}
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                    >
                    </div>
                )}

                <style>{`
                    .blog-content h1 { font-size: 2.25em; font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; color: ${isLight ? '#1a1a2e' : 'white'}; line-height: 1.2; }
                    .blog-content h2 { font-size: 1.75em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: ${isLight ? '#1a1a2e' : 'white'}; line-height: 1.3; }
                    .blog-content h3 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: ${isLight ? '#1a1a2e' : 'white'}; line-height: 1.4; }
                    
                    .blog-content p { margin-bottom: 1.5em; }
                    
                    .blog-content ul, .blog-content ol { padding-left: 1.5em; margin-bottom: 1.5em; }
                    .blog-content ul { list-style-type: disc; }
                    .blog-content ol { list-style-type: decimal; }
                    .blog-content li { margin-bottom: 0.5em; }
                    
                    .blog-content blockquote {
                        border-left: 4px solid #6366f1;
                        padding-left: 1rem;
                        font-style: italic;
                        color: ${isLight ? '#666' : '#a1a1aa'};
                        margin: 2em 0;
                        background: ${isLight ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.1)'};
                        padding: 1rem;
                        border-radius: 0 8px 8px 0;
                    }
                    
                    .blog-content pre {
                        background: ${isLight ? '#f0f0f5' : '#18181b'};
                        padding: 1.5em;
                        border-radius: 8px;
                        overflow-x: auto;
                        color: ${isLight ? '#333' : '#e4e4e7'};
                        font-family: 'Fira Code', monospace;
                        margin: 2em 0;
                        border: 1px solid ${isLight ? '#ddd' : '#27272a'};
                    }
                    
                    .blog-content code {
                        background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'};
                        padding: 0.2em 0.4em;
                        border-radius: 4px;
                        font-size: 0.9em;
                        color: ${isLight ? '#333' : '#e4e4e7'};
                        font-family: monospace;
                    }

                    .blog-content pre code {
                        background: transparent;
                        padding: 0;
                        color: inherit;
                        font-size: 0.9em;
                    }
                    
                    .blog-content img {
                        max-width: 100%;
                        border-radius: 12px;
                        margin: 2em 0;
                        border: 1px solid ${isLight ? '#ddd' : '#27272a'};
                    }

                    .blog-content hr {
                        border: 0;
                        border-top: 1px solid ${isLight ? '#ddd' : '#3f3f46'};
                        margin: 3em 0;
                    }
                    
                    .blog-content a {
                        color: #818cf8;
                        text-decoration: underline;
                        text-underline-offset: 4px;
                    }
                `}</style>
            </article>
        </div>
    );
}
