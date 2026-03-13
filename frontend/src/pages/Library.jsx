import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Search, BookOpen, Star, ArrowRight, Library as LibraryIcon } from 'lucide-react';


import { books } from '../data/books';

export default function Library() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: isLight ? '#f8f9fa' : '#030303',
            color: isLight ? '#1a1a2e' : 'white',
            paddingTop: '100px',
            paddingBottom: '80px',
            position: 'relative',
            overflow: 'hidden'
        }}>


            {/* Background Gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                background: isLight
                    ? `radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 25%), radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.05) 0%, transparent 25%)`
                    : `radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 25%), radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 25%)`
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ marginBottom: '60px' }}>
                    <div className="badge" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={14} /> Knowledge Hub
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                        gap: '24px'
                    }}>
                        <div>
                            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
                                Resource <span className="text-gradient">Library</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px' }}>
                                A curated collection of tools, guides, and practice materials to help you ace your interviews.
                            </p>
                        </div>

                        <div style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '320px'
                        }}>
                            <Search size={18} style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)'
                            }} />
                            <input
                                type="text"
                                placeholder="Search books or authors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                                    border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                    borderRadius: '12px',
                                    padding: '12px 16px 12px 44px',
                                    color: isLight ? '#1a1a2e' : 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--zinc-800)'}
                            />
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '32px'
                }}>
                    {filteredBooks.map((book) => (
                        <div key={book.id} className="card glow-hover" style={{
                            background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 10, 10, 0.6)',
                            backdropFilter: 'blur(10px)',
                            border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.3s ease'
                        }}>
                            <div style={{
                                height: '220px',
                                background: isLight ? '#e8e8e8' : '#1a1a1a',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundImage: `url(${book.cover})`,
                                    backgroundSize: 'cover',
                                    filter: 'blur(20px) brightness(0.4)',
                                    transform: 'scale(1.2)'
                                }} />
                                <img
                                    src={book.cover}
                                    alt={book.title}
                                    style={{
                                        height: '180px',
                                        borderRadius: '4px',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                        position: 'relative',
                                        zIndex: 1,
                                        transition: 'transform 0.3s ease'
                                    }}
                                />
                            </div>

                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                    {book.tags.map(tag => (
                                        <span key={tag} style={{
                                            fontSize: '11px',
                                            background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                                            border: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '99px',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', lineHeight: '1.4', color: isLight ? '#1a1a2e' : 'white' }}>
                                    {book.title}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                                    by {book.author}
                                </p>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    marginTop: 'auto',
                                    marginBottom: '20px',
                                    fontSize: '13px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                                        <span style={{ color: isLight ? '#1a1a2e' : 'white' }}>{book.rating}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <BookOpen size={14} />
                                        <span>{book.pages} pages</span>
                                    </div>
                                </div>

                                <a
                                    href={book.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <BookOpen size={16} /> Open Book
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
