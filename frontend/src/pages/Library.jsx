import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Search, BookOpen, Star, Loader } from 'lucide-react';
import { getBooks, addToShelf } from '../api/libraryService';

export default function Library() {
    const { theme } = useTheme();
    const { user, token } = useAuth();
    const isLight = theme === 'light';
    
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [addingToShelf, setAddingToShelf] = useState(null);

    // Fetch books from API
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getBooks({
                    search: searchTerm,
                    category: category || undefined,
                    difficulty_level: difficulty || undefined,
                    page,
                    limit: 20
                });
                setBooks(data.books);
                setTotalPages(data.pagination.totalPages);
            } catch (err) {
                console.error('Error fetching books:', err);
                setError('Failed to load books. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchBooks, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, category, difficulty, page]);

    const handleAddToShelf = async (bookId, status = 'wishlist') => {
        if (!user || !token) {
            alert('Please log in to add books to your shelf');
            return;
        }

        try {
            setAddingToShelf(bookId);
            await addToShelf(bookId, { status }, token);
            alert('Book added to your shelf!');
        } catch (err) {
            console.error('Error adding to shelf:', err);
            alert('Failed to add book to shelf');
        } finally {
            setAddingToShelf(null);
        }
    };

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
                            <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 'bold', marginBottom: '16px', lineHeight: 1.1 }}>
                                Resource <span className="text-gradient">Library</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px' }}>
                                A curated collection of books and resources to help you ace your interviews.
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
                                onBlur={(e) => e.target.style.borderColor = isLight ? '#e0e0e0' : 'var(--zinc-800)'}
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '32px',
                        flexWrap: 'wrap'
                    }}>
                        <select
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                            style={{
                                flex: '1 1 180px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                background: isLight ? 'white' : '#1a1a1a',
                                color: isLight ? '#1a1a2e' : 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">All Categories</option>
                            <option value="DSA">DSA</option>
                            <option value="System Design">System Design</option>
                            <option value="Programming">Programming</option>
                            <option value="Web Development">Web Development</option>
                            <option value="Interview Prep">Interview Prep</option>
                            <option value="Career">Career</option>
                        </select>

                        <select
                            value={difficulty}
                            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
                            style={{
                                flex: '1 1 180px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                background: isLight ? 'white' : '#1a1a1a',
                                color: isLight ? '#1a1a2e' : 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">All Levels</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>

                    {!loading && (
                        <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            Showing {books.length} results
                        </p>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '300px',
                        gap: '12px'
                    }}>
                        <Loader size={24} className="animate-spin" />
                        <span>Loading books...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{
                        padding: '20px',
                        background: isLight ? '#fee2e2' : '#7f1d1d',
                        border: isLight ? '1px solid #fca5a5' : '1px solid #dc2626',
                        borderRadius: '8px',
                        color: isLight ? '#991b1b' : '#fca5a5',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Books Grid */}
                {!loading && books.length > 0 && (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '32px',
                            marginBottom: '40px'
                        }}>
                            {books.map((book) => (
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
                                            backgroundImage: `url(${book.cover_url || ''})`,
                                            backgroundSize: 'cover',
                                            filter: 'blur(20px) brightness(0.4)',
                                            transform: 'scale(1.2)'
                                        }} />
                                        {book.cover_url ? (
                                            <img
                                                src={book.cover_url}
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
                                        ) : (
                                            <div style={{
                                                height: '180px',
                                                width: '120px',
                                                borderRadius: '4px',
                                                background: isLight ? '#d1d5db' : '#374151',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                zIndex: 1
                                            }}>
                                                <BookOpen size={40} opacity={0.5} />
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                            {book.tags && book.tags.slice(0, 3).map(tag => (
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
                                            {book.category && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '99px',
                                                    color: '#6366f1'
                                                }}>
                                                    {book.category}
                                                </span>
                                            )}
                                        </div>

                                        <h3 style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            marginBottom: '8px',
                                            lineHeight: '1.4',
                                            color: isLight ? '#1a1a2e' : 'white',
                                            minHeight: '50px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {book.title}
                                        </h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', minHeight: '20px' }}>
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
                                            {book.avgRating > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                                                    <span style={{ color: isLight ? '#1a1a2e' : 'white' }}>
                                                        {book.avgRating} ({book.reviewCount})
                                                    </span>
                                                </div>
                                            )}
                                            {book.pages && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <BookOpen size={14} />
                                                    <span>{book.pages} pages</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleAddToShelf(book.id)}
                                            disabled={addingToShelf === book.id}
                                            className="btn btn-primary"
                                            style={{
                                                width: '100%',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                opacity: addingToShelf === book.id ? 0.7 : 1
                                            }}
                                        >
                                            {addingToShelf === book.id ? (
                                                <>
                                                    <Loader size={16} className="animate-spin" /> Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <BookOpen size={16} /> Add to Shelf
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                                marginTop: '40px'
                            }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                        background: isLight ? 'white' : '#1a1a1a',
                                        color: isLight ? '#1a1a2e' : 'white',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        opacity: page === 1 ? 0.5 : 1
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                        background: isLight ? 'white' : '#1a1a1a',
                                        color: isLight ? '#1a1a2e' : 'white',
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        opacity: page === totalPages ? 0.5 : 1
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {!loading && books.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-secondary)'
                    }}>
                        <BookOpen size={48} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>No books found</h3>
                        <p>Try adjusting your filters or search terms</p>
                    </div>
                )}
            </div>
        </div>
    );
}
