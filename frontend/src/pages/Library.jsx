import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Search, BookOpen, Star, Loader, X } from 'lucide-react';
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

    return (
        <div style={{
            minHeight: '100vh',
            background: isLight ? '#f8f9fa' : '#030303',
            color: isLight ? '#1a1a2e' : 'white',
            paddingTop: '130px',
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
                            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
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
                                            onClick={() => handleOpenBook(book)}
                                            className="btn btn-primary"
                                            style={{
                                                width: '100%',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <>
                                                <BookOpen size={16} /> Open Book
                                            </>
                                        </button>

                                        {isAdmin && (
                                            <button
                                                onClick={() => handleEditBook(book)}
                                                className="btn"
                                                style={{
                                                    width: '100%',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    marginTop: '10px',
                                                    border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                                    background: isLight ? 'white' : '#1a1a1a',
                                                    color: isLight ? '#1a1a2e' : 'white'
                                                }}
                                            >
                                                Edit Book Photo
                                            </button>
                                        )}
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

                {showEditModal && editingBook && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <div style={{
                            width: '100%',
                            maxWidth: '840px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            background: isLight ? 'white' : '#111111',
                            color: isLight ? '#1a1a2e' : 'white',
                            border: isLight ? '1px solid #e5e7eb' : '1px solid var(--zinc-800)',
                            borderRadius: '18px',
                            padding: '24px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Edit Book</h2>
                                    <p style={{ color: 'var(--text-secondary)' }}>{editingBook.title}</p>
                                </div>
                                <button onClick={handleCloseEditModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {editMessage && (
                                <div style={{
                                    marginBottom: '16px',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    background: editMessage.type === 'success' ? (isLight ? '#dcfce7' : '#14532d') : (isLight ? '#fee2e2' : '#7f1d1d'),
                                    color: editMessage.type === 'success' ? (isLight ? '#166534' : '#bbf7d0') : (isLight ? '#991b1b' : '#fecaca')
                                }}>
                                    {editMessage.text}
                                </div>
                            )}

                            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px', alignItems: 'start' }}>
                                    <div style={{
                                        width: '160px',
                                        height: '220px',
                                        borderRadius: '14px',
                                        overflow: 'hidden',
                                        border: isLight ? '1px solid #e5e7eb' : '1px solid var(--zinc-800)',
                                        background: isLight ? '#f3f4f6' : '#0a0a0a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {(editFormData.cover_url || editingBook.cover_url) ? (
                                            <img
                                                src={editFormData.cover_url || editingBook.cover_url}
                                                alt={`${editingBook.title} cover preview`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '16px', fontSize: '14px' }}>
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
                                            style={inputStyle(isLight)}
                                            placeholder="https://..."
                                        />
                                        <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            Paste a new image URL to update the book cover.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <Field label="Title *" name="title" value={editFormData.title} onChange={handleEditInputChange} isLight={isLight} required />
                                    <Field label="Author *" name="author" value={editFormData.author} onChange={handleEditInputChange} isLight={isLight} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <Field label="ISBN" name="isbn" value={editFormData.isbn} onChange={handleEditInputChange} isLight={isLight} />
                                    <Field label="Resource URL" name="resource_url" value={editFormData.resource_url} onChange={handleEditInputChange} isLight={isLight} />
                                </div>

                                <div>
                                    <label style={labelStyle}>{EDIT_FORM_LABELS.description}</label>
                                    <textarea name="description" value={editFormData.description} onChange={handleEditInputChange} rows="4" style={inputStyle(isLight, true)} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <SelectField label="Category" name="category" value={editFormData.category} onChange={handleEditInputChange} isLight={isLight} options={['DSA', 'System Design', 'Programming', 'Web Development', 'Interview Prep', 'Career', 'AI/ML', 'Database']} />
                                    <SelectField label="Difficulty" name="difficulty_level" value={editFormData.difficulty_level} onChange={handleEditInputChange} isLight={isLight} options={['Beginner', 'Intermediate', 'Advanced']} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <Field label="Pages" name="pages" type="number" value={editFormData.pages} onChange={handleEditInputChange} isLight={isLight} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <Field label="Publisher" name="publisher" value={editFormData.publisher} onChange={handleEditInputChange} isLight={isLight} />
                                    <Field label="Subcategory" name="subcategory" value={editFormData.subcategory} onChange={handleEditInputChange} isLight={isLight} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <Field label="Publication Date" name="publication_date" type="date" value={editFormData.publication_date} onChange={handleEditInputChange} isLight={isLight} />
                                    <Field label="Edition" name="edition" value={editFormData.edition} onChange={handleEditInputChange} isLight={isLight} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <Field label="Amazon URL" name="amazon_url" value={editFormData.amazon_url} onChange={handleEditInputChange} isLight={isLight} />
                                    <Field label="Goodreads URL" name="goodreads_url" value={editFormData.goodreads_url} onChange={handleEditInputChange} isLight={isLight} />
                                </div>

                                <div>
                                    <label style={labelStyle}>{EDIT_FORM_LABELS.tags}</label>
                                    <input name="tags" value={editFormData.tags} onChange={handleEditInputChange} style={inputStyle(isLight)} placeholder="algorithms, dsa, interview" />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={handleCloseEditModal} disabled={editSubmitting} style={secondaryButtonStyle(isLight, editSubmitting)}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editSubmitting} className="btn btn-primary" style={{ minWidth: '160px' }}>
                                        {editSubmitting ? <><Loader size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
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

function Field({ label, name, value, onChange, isLight, required = false, type = 'text' }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                style={inputStyle(isLight)}
            />
        </div>
    );
}

function SelectField({ label, name, value, onChange, isLight, options }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <select name={name} value={value} onChange={onChange} style={inputStyle(isLight)}>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
        </div>
    );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 600 };

function inputStyle(isLight, textarea = false) {
    return {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
        background: isLight ? '#f9f9f9' : '#0a0a0a',
        color: isLight ? '#1a1a2e' : 'white',
        fontSize: '14px',
        fontFamily: textarea ? 'inherit' : 'inherit',
        resize: textarea ? 'vertical' : 'none'
    };
}

function secondaryButtonStyle(isLight, disabled) {
    return {
        padding: '10px 16px',
        borderRadius: '8px',
        border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
        background: isLight ? '#f9f9f9' : '#0a0a0a',
        color: isLight ? '#1a1a2e' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1
    };
}
