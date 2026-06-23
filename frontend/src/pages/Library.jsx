import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Search, BookOpen, Star, Loader, X, Filter, BookText, ExternalLink } from 'lucide-react';
import { getBooks, updateBook } from '../api/libraryService';

export default function Library() {
    const EDIT_FORM_LABELS = {
        coverPhotoUrl: 'Cover Photo URL',
        description: 'Description',
        tags: 'Tags (comma-separated)',
    };

    const { theme } = useTheme();
    const { user } = useAuth();
    const isLight = theme === 'light';
    const isAdmin = user?.role === 'admin';
    
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editMessage, setEditMessage] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        description: '',
        category: 'Programming',
        difficulty_level: 'Intermediate',
        cover_url: '',
        resource_url: '',
        pages: '',
        publisher: '',
        subcategory: '',
        publication_date: '',
        edition: '',
        amazon_url: '',
        goodreads_url: '',
        tags: ''
    });

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

    const handleOpenBook = (book) => {
        if (book.resource_url) {
            window.open(book.resource_url, '_blank', 'noopener,noreferrer');
            return;
        }
        alert('No book link is available for this item yet.');
    };

    const handleEditBook = (book) => {
        setEditingBook(book);
        setEditMessage(null);
        setEditFormData({
            title: book.title || '',
            author: book.author || '',
            isbn: book.isbn || '',
            description: book.description || '',
            category: book.category || 'Programming',
            difficulty_level: book.difficulty_level || 'Intermediate',
            cover_url: book.cover_url || '',
            resource_url: book.resource_url || '',
            pages: book.pages || '',
            publisher: book.publisher || '',
            subcategory: book.subcategory || '',
            publication_date: book.publication_date ? String(book.publication_date).slice(0, 10) : '',
            edition: book.edition || '',
            amazon_url: book.amazon_url || '',
            goodreads_url: book.goodreads_url || '',
            tags: Array.isArray(book.tags) ? book.tags.join(', ') : ''
        });
        setShowEditModal(true);
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: name === 'pages' ? (value === '' ? '' : parseInt(value, 10) || '') : value
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!editingBook) {
            return;
        }

        try {
            setEditSubmitting(true);
            setEditMessage(null);

            const payload = {
                ...editFormData,
                tags: editFormData.tags
                    ? editFormData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
                    : []
            };

            await updateBook(editingBook.id, payload);

            setBooks((currentBooks) => currentBooks.map((book) => (
                book.id === editingBook.id ? { ...book, ...payload } : book
            )));
            setEditMessage({ type: 'success', text: 'Book updated successfully.' });
            setShowEditModal(false);
            setEditingBook(null);
        } catch (err) {
            console.error('Error updating book:', err);
            setEditMessage({ type: 'error', text: err.message || 'Failed to update book.' });
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingBook(null);
        setEditMessage(null);
    };

    const customStyles = `
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .book-card-container {
            perspective: 1200px;
            animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .book-card {
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            transform-style: preserve-3d;
            height: 100%;
        }

        .book-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border-color: var(--color-accent-primary);
        }

        .book-card:hover .book-cover {
            transform: rotateY(-20deg) rotateX(5deg) scale(1.05) translateX(10px);
            box-shadow: 
                -25px 25px 40px rgba(0,0,0,0.6), 
                inset 4px 0 10px rgba(255,255,255,0.3), 
                inset -1px 0 2px rgba(0,0,0,0.4);
        }

        .book-card:hover .open-book-btn {
            background: var(--color-accent-primary);
            color: white;
            border-color: var(--color-accent-primary);
            transform: translateY(-2px);
        }

        .book-cover {
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            transform-origin: left center;
            border-radius: 4px 8px 8px 4px;
            box-shadow: 
                -5px 10px 20px rgba(0,0,0,0.3),
                inset 3px 0 8px rgba(255,255,255,0.1);
        }
        
        .book-cover::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 12px;
            background: linear-gradient(to right, rgba(255,255,255,0.25), rgba(0,0,0,0.1) 40%, transparent);
            border-radius: 4px 0 0 4px;
            z-index: 2;
        }

        .book-cover::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
            border-radius: inherit;
            z-index: 3;
            pointer-events: none;
        }

        .glass-header {
            position: sticky;
            top: 80px;
            z-index: 40;
            background: var(--color-bg-glass);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--color-border);
            padding: 24px 0;
            margin-bottom: 40px;
            transition: all 0.3s ease;
        }
    `;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            paddingTop: '100px',
            paddingBottom: '80px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <style>{customStyles}</style>

            {/* Premium Background Elements */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                background: 'var(--image-surface-gradient)'
            }} />
            
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                
                {/* Hero Section */}
                <div style={{ marginBottom: '20px', textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px auto' }}>
                    <div className="badge" style={{ 
                        marginBottom: '20px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--color-accent-primary)',
                        border: '1px solid var(--color-border)',
                        padding: '6px 16px',
                        borderRadius: '99px',
                        fontWeight: '600'
                    }}>
                        <BookText size={16} /> Premium Knowledge Base
                    </div>

                    <h1 style={{ 
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                        fontWeight: '800', 
                        marginBottom: '20px', 
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em'
                    }}>
                        The Library of <span className="text-gradient" style={{ background: 'var(--color-accent-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Excellence</span>
                    </h1>
                    <p style={{ 
                        color: 'var(--color-text-secondary)', 
                        fontSize: 'clamp(16px, 2vw, 20px)', 
                        maxWidth: '650px',
                        margin: '0 auto',
                        lineHeight: 1.6
                    }}>
                        Explore our highly curated collection of programming, system design, and algorithms books to accelerate your career growth.
                    </p>
                </div>

                {/* Sticky Glass Header for Search & Filters */}
                <div className="glass-header">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            flex: '1 1 300px',
                            maxWidth: '500px'
                        }}>
                            <Search size={20} style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-secondary)'
                            }} />
                            <input
                                type="text"
                                placeholder="Search books, authors, or ISBN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'var(--color-bg-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '16px',
                                    padding: '16px 16px 16px 48px',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--color-accent-primary)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--color-border)';
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            flex: '1 1 auto',
                            justifyContent: 'flex-end',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ position: 'relative' }}>
                                <Filter size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
                                <select
                                    value={category}
                                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                                    style={{
                                        appearance: 'none',
                                        padding: '12px 36px 12px 40px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-secondary)',
                                        color: 'var(--color-text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s',
                                        minWidth: '160px'
                                    }}
                                >
                                    <option value="">All Categories</option>
                                    <option value="DSA">DSA</option>
                                    <option value="System Design">System Design</option>
                                    <option value="Programming">Programming</option>
                                    <option value="Web Development">Web Development</option>
                                    <option value="AI/ML">AI & Machine Learning</option>
                                    <option value="Cybersecurity">Cybersecurity</option>
                                </select>
                            </div>

                            <select
                                value={difficulty}
                                onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s',
                                    minWidth: '140px'
                                }}
                            >
                                <option value="">All Levels</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>
                </div>

                {!loading && (
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent-primary)', boxShadow: '0 0 10px var(--color-accent-primary)' }} />
                        <p style={{ fontSize: '14px', fontWeight: '500' }}>
                            Displaying <span style={{ color: 'var(--color-text-primary)' }}>{books.length}</span> masterpieces
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '400px',
                        gap: '20px'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', inset: -10, background: 'var(--color-accent-primary)', filter: 'blur(20px)', opacity: 0.3, borderRadius: '50%' }} />
                            <Loader size={36} className="animate-spin" style={{ color: 'var(--color-accent-primary)', position: 'relative' }} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text-secondary)', letterSpacing: '1px' }}>Curating your library...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{
                        padding: '24px',
                        background: 'rgba(220, 38, 38, 0.1)',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        borderRadius: '16px',
                        color: 'var(--color-danger)',
                        marginBottom: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontWeight: '500'
                    }}>
                        <X size={20} /> {error}
                    </div>
                )}

                {/* Books Grid */}
                {!loading && books.length > 0 && (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                            gap: '32px',
                            marginBottom: '60px'
                        }}>
                            {books.map((book, index) => (
                                <div key={book.id} className="book-card-container" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="book-card card glass-panel" style={{
                                        background: 'var(--color-bg-card)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {/* Beautiful Book Cover Showcase Area */}
                                        <div style={{
                                            height: '260px',
                                            background: 'var(--color-bg-secondary)',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'visible' // allow pop-out effect
                                        }}>
                                            {/* Blurred Ambient Glow */}
                                            <div style={{
                                                position: 'absolute',
                                                inset: '20%',
                                                backgroundImage: book.cover_url ? `url(${book.cover_url})` : 'none',
                                                background: book.cover_url ? undefined : getGradientForTitle(book.title),
                                                backgroundSize: 'cover',
                                                filter: 'blur(30px)',
                                                opacity: 0.5,
                                                transform: 'translateY(20px)'
                                            }} />
                                            
                                            {/* Actual Cover */}
                                            {book.cover_url ? (
                                                <img
                                                    src={book.cover_url}
                                                    alt={book.title}
                                                    className="book-cover"
                                                    style={{
                                                        height: '210px',
                                                        width: '140px',
                                                        objectFit: 'cover',
                                                        position: 'relative',
                                                        zIndex: 10
                                                    }}
                                                />
                                            ) : (
                                                <div className="book-cover" style={{
                                                    height: '210px',
                                                    width: '140px',
                                                    background: getGradientForTitle(book.title),
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '16px',
                                                    textAlign: 'center',
                                                    position: 'relative',
                                                    zIndex: 10,
                                                    color: 'white',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{ width: '100%', display: 'block' }}>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                            lineHeight: '1.3',
                                                            marginBottom: '12px',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 4,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                                            zIndex: 5
                                                        }}>
                                                            {book.title}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '11px',
                                                            opacity: 0.9,
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                                            zIndex: 5
                                                        }}>
                                                            {book.author}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Content Area */}
                                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                                {book.category && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: '700',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        color: 'var(--color-accent-primary)'
                                                    }}>
                                                        {book.category}
                                                    </span>
                                                )}
                                                {book.difficulty_level && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: '700',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        background: 'var(--color-bg-tertiary)',
                                                        border: '1px solid var(--color-border)',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        color: 'var(--color-text-secondary)'
                                                    }}>
                                                        {book.difficulty_level}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ width: '100%', display: 'block' }}>
                                                <h3 style={{
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    marginBottom: '6px',
                                                    lineHeight: '1.4',
                                                    color: 'var(--color-text-primary)',
                                                    minHeight: '50px',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {book.title}
                                                </h3>
                                            </div>
                                            <p style={{ 
                                                color: 'var(--color-text-secondary)', 
                                                fontSize: '14px', 
                                                marginBottom: '20px', 
                                                fontWeight: '500',
                                                minHeight: '20px' 
                                            }}>
                                                by {book.author}
                                            </p>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginTop: 'auto',
                                                paddingTop: '16px',
                                                borderTop: '1px solid var(--color-border)',
                                                marginBottom: '20px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                                                    {book.avgRating > 0 ? (
                                                        <>
                                                            <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                                                            <span style={{ color: 'var(--color-text-primary)' }}>{book.avgRating}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BookOpen size={14} />
                                                            <span>PDF Resource</span>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {book.pages && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                                                        <span>{book.pages} pages</span>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleOpenBook(book)}
                                                className="open-book-btn"
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    background: 'var(--color-bg-tertiary)',
                                                    border: '1px solid var(--color-border)',
                                                    color: 'var(--color-text-primary)',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Read Book <ExternalLink size={16} />
                                            </button>

                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleEditBook(book)}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        padding: '10px',
                                                        marginTop: '12px',
                                                        borderRadius: '10px',
                                                        background: 'transparent',
                                                        border: '1px dashed var(--color-border)',
                                                        color: 'var(--color-text-secondary)',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.target.style.color = 'var(--color-text-primary)';
                                                        e.target.style.borderColor = 'var(--color-border)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.target.style.color = 'var(--color-text-secondary)';
                                                        e.target.style.borderColor = 'var(--color-border)';
                                                    }}
                                                >
                                                    Edit Details
                                                </button>
                                            )}
                                        </div>
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
                                gap: '16px',
                                marginTop: '20px',
                                padding: '20px',
                                background: 'var(--color-bg-glass)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '16px',
                                border: '1px solid var(--color-border)',
                                maxWidth: 'fit-content',
                                margin: '0 auto'
                            }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        background: page === 1 ? 'transparent' : 'var(--color-accent-primary)',
                                        color: page === 1 ? 'var(--color-text-secondary)' : 'white',
                                        border: page === 1 ? '1px solid var(--color-border)' : 'none',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        background: page === totalPages ? 'transparent' : 'var(--color-accent-primary)',
                                        color: page === totalPages ? 'var(--color-text-secondary)' : 'white',
                                        border: page === totalPages ? '1px solid var(--color-border)' : 'none',
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
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
                        padding: '80px 20px',
                        background: 'var(--color-bg-glass)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        border: '1px dashed var(--color-border)',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: 'var(--color-accent-primary)'
                        }}>
                            <BookOpen size={40} />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-text-primary)' }}>No resources found</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>Try adjusting your search terms or relaxing the filters to find what you're looking for.</p>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && editingBook && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        animation: 'fadeUp 0.3s ease-out'
                    }}>
                        <div style={{
                            width: '100%',
                            maxWidth: '840px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '24px',
                            padding: '32px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Edit Book Details</h2>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>{editingBook.title}</p>
                                </div>
                                <button onClick={handleCloseEditModal} style={{ 
                                    background: 'var(--color-bg-secondary)', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    color: 'inherit',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                onMouseOut={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {editMessage && (
                                <div style={{
                                    marginBottom: '24px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: editMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: editMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                                    fontWeight: '500'
                                }}>
                                    {editMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gap: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '24px', alignItems: 'start' }}>
                                    <div style={{
                                        width: '160px',
                                        height: '240px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        {(editFormData.cover_url || editingBook.cover_url) ? (
                                            <img
                                                src={editFormData.cover_url || editingBook.cover_url}
                                                alt={`${editingBook.title} cover preview`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px', fontSize: '14px' }}>
                                                Add a cover URL to preview the book photo here.
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label style={labelStyle}>{EDIT_FORM_LABELS.coverPhotoUrl}</label>
                                        <input
                                            name="cover_url"
                                            value={editFormData.cover_url}
                                            onChange={handleEditInputChange}
                                            style={inputStyle()}
                                            placeholder="https://..."
                                        />
                                        <p style={{ marginTop: '10px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                            Paste a new image URL to update the book cover dynamically.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                    <Field label="Title *" name="title" value={editFormData.title} onChange={handleEditInputChange} required />
                                    <Field label="Author *" name="author" value={editFormData.author} onChange={handleEditInputChange} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                    <Field label="ISBN" name="isbn" value={editFormData.isbn} onChange={handleEditInputChange} />
                                    <Field label="Resource URL" name="resource_url" value={editFormData.resource_url} onChange={handleEditInputChange} />
                                </div>

                                <div>
                                    <label style={labelStyle}>{EDIT_FORM_LABELS.description}</label>
                                    <textarea name="description" value={editFormData.description} onChange={handleEditInputChange} rows="4" style={inputStyle(true)} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                    <SelectField label="Category" name="category" value={editFormData.category} onChange={handleEditInputChange} options={['DSA', 'System Design', 'Programming', 'Web Development', 'Interview Prep', 'Career', 'AI/ML', 'Database', 'Cybersecurity']} />
                                    <SelectField label="Difficulty" name="difficulty_level" value={editFormData.difficulty_level} onChange={handleEditInputChange} options={['Beginner', 'Intermediate', 'Advanced']} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                    <Field label="Pages" name="pages" type="number" value={editFormData.pages} onChange={handleEditInputChange} />
                                    <Field label="Publisher" name="publisher" value={editFormData.publisher} onChange={handleEditInputChange} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                    <Field label="Subcategory" name="subcategory" value={editFormData.subcategory} onChange={handleEditInputChange} />
                                    <Field label="Edition" name="edition" value={editFormData.edition} onChange={handleEditInputChange} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                    <Field label="Publication Date" name="publication_date" type="date" value={editFormData.publication_date} onChange={handleEditInputChange} />
                                    <Field label="Tags (comma separated)" name="tags" value={editFormData.tags} onChange={handleEditInputChange} placeholder="algorithms, dsa, interview" />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                    <Field label="Amazon URL" name="amazon_url" value={editFormData.amazon_url} onChange={handleEditInputChange} />
                                    <Field label="Goodreads URL" name="goodreads_url" value={editFormData.goodreads_url} onChange={handleEditInputChange} />
                                </div>

                                <div style={{ 
                                    display: 'flex', 
                                    gap: '16px', 
                                    justifyContent: 'flex-end', 
                                    flexWrap: 'wrap',
                                    marginTop: '10px',
                                    paddingTop: '24px',
                                    borderTop: '1px solid var(--color-border)'
                                }}>
                                    <button type="button" onClick={handleCloseEditModal} disabled={editSubmitting} style={secondaryButtonStyle(editSubmitting)}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editSubmitting} className="btn btn-primary" style={{ minWidth: '180px', padding: '12px 24px', borderRadius: '12px', fontWeight: '600' }}>
                                        {editSubmitting ? <><Loader size={18} className="animate-spin" style={{marginRight: '8px', display: 'inline-block', verticalAlign: 'middle'}} /> Saving...</> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function getGradientForTitle(title) {
    if (!title) return 'linear-gradient(135deg, #4f46e5, #ec4899)';
    const colors = [
        ['#4f46e5', '#ec4899'],
        ['#0ea5e9', '#10b981'],
        ['#f59e0b', '#ef4444'],
        ['#8b5cf6', '#3b82f6'],
        ['#ec4899', '#f43f5e'],
        ['#14b8a6', '#3b82f6'],
        ['#f97316', '#eab308'],
        ['#6366f1', '#a855f7'],
        ['#ef4444', '#f97316']
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`;
}

function Field({ label, name, value, onChange, required = false, type = 'text', placeholder = '' }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                style={inputStyle()}
            />
        </div>
    );
}

function SelectField({ label, name, value, onChange, options }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <select name={name} value={value} onChange={onChange} style={inputStyle()}>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
        </div>
    );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--color-text-secondary)' };

function inputStyle(textarea = false) {
    return {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        fontSize: '15px',
        fontFamily: textarea ? 'inherit' : 'inherit',
        resize: textarea ? 'vertical' : 'none',
        transition: 'all 0.2s',
        outline: 'none'
    };
}

function secondaryButtonStyle(disabled) {
    return {
        padding: '12px 24px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        fontWeight: '600',
        transition: 'all 0.2s'
    };
}
