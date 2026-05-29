import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Loader, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { addBook, updateBook, deleteBook, getBooks } from '../api/libraryService';

export default function AdminLibraryPanel() {
    const { user, token } = useAuth();
    const location = useLocation();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // State Management
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [adminBooks, setAdminBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [searchFilter, setSearchFilter] = useState('');
    const selectedBookId = new URLSearchParams(location.search).get('book');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        description: '',
        category: 'Programming',
        difficulty_level: 'Intermediate',
        cover_url: '',
        pages: '',
        published_year: new Date().getFullYear(),
        tags: ''
    });

    // Fetch books on mount
    useEffect(() => {
        fetchAdminBooks();
    }, []);

    useEffect(() => {
        if (!selectedBookId || adminBooks.length === 0 || editingBook) {
            return;
        }

        const selectedBook = adminBooks.find((book) => book.id === selectedBookId);
        if (selectedBook) {
            handleEdit(selectedBook);
        }
    }, [selectedBookId, adminBooks, editingBook]);

    const fetchAdminBooks = async () => {
        try {
            setLoading(true);
            const data = await getBooks({ limit: 100 });
            setAdminBooks(data.books);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load books' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pages' || name === 'published_year' ? parseInt(value) || '' : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.author || !formData.isbn) {
            setMessage({ type: 'error', text: 'Title, author, and ISBN are required' });
            return;
        }

        try {
            setSubmitting(true);
            
            const bookData = {
                ...formData,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
            };

            if (editingBook) {
                await updateBook(editingBook.id, bookData, token);
                setMessage({ type: 'success', text: 'Book updated successfully!' });
            } else {
                await addBook(bookData, token);
                setMessage({ type: 'success', text: 'Book added successfully!' });
            }

            // Reset form and refresh
            setFormData({
                title: '',
                author: '',
                isbn: '',
                description: '',
                category: 'Programming',
                difficulty_level: 'Intermediate',
                cover_url: '',
                pages: '',
                published_year: new Date().getFullYear(),
                tags: ''
            });
            setShowAddForm(false);
            setEditingBook(null);
            await fetchAdminBooks();
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.message || 'Failed to save book'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (book) => {
        setFormData({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            description: book.description || '',
            category: book.category,
            difficulty_level: book.difficulty_level,
            cover_url: book.cover_url || '',
            pages: book.pages || '',
            published_year: book.published_year || new Date().getFullYear(),
            tags: book.tags ? book.tags.join(', ') : ''
        });
        setEditingBook(book);
        setShowAddForm(true);
    };

    const handleDelete = async (bookId) => {
        if (!window.confirm('Are you sure you want to delete this book?')) return;

        try {
            setSubmitting(true);
            await deleteBook(bookId, token);
            setMessage({ type: 'success', text: 'Book deleted successfully!' });
            await fetchAdminBooks();
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.message || 'Failed to delete book'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseForm = () => {
        setShowAddForm(false);
        setEditingBook(null);
        setFormData({
            title: '',
            author: '',
            isbn: '',
            description: '',
            category: 'Programming',
            difficulty_level: 'Intermediate',
            cover_url: '',
            pages: '',
            published_year: new Date().getFullYear(),
            tags: ''
        });
    };

    const filteredBooks = adminBooks.filter(book =>
        book.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        book.author.toLowerCase().includes(searchFilter.toLowerCase()) ||
        book.isbn.includes(searchFilter)
    );

    // Check if user is admin
    if (!user || user.role !== 'admin') {
        return (
            <div style={{
                background: isLight ? '#fee2e2' : '#7f1d1d',
                border: isLight ? '1px solid #fca5a5' : '1px solid #dc2626',
                borderRadius: '8px',
                padding: '20px',
                color: isLight ? '#991b1b' : '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <AlertCircle size={20} />
                <span>You do not have permission to access the admin library panel.</span>
            </div>
        );
    }

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
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>
                        <div>
                            <h1 style={{ fontSize: 'clamp(1.9rem, 5.5vw, 2.6rem)', fontWeight: 'bold', marginBottom: '8px', lineHeight: 1.1 }}>
                                Library <span className="text-gradient">Management</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                                Add, edit, and manage books in the library
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Plus size={18} /> Add New Book
                        </button>
                    </div>
                </div>

                {/* Message Alert */}
                {message && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: message.type === 'success'
                            ? isLight ? '#dcfce7' : '#166534'
                            : isLight ? '#fee2e2' : '#7f1d1d',
                        border: message.type === 'success'
                            ? isLight ? '1px solid #86efac' : '1px solid #22c55e'
                            : isLight ? '1px solid #fca5a5' : '1px solid #dc2626',
                        color: message.type === 'success'
                            ? isLight ? '#166534' : '#86efac'
                            : isLight ? '#991b1b' : '#fca5a5'
                    }}>
                        {message.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span>{message.text}</span>
                        <button
                            onClick={() => setMessage(null)}
                            style={{
                                marginLeft: 'auto',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'inherit'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Add/Edit Form Modal */}
                {showAddForm && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: isLight ? 'white' : '#1a1a1a',
                            borderRadius: '16px',
                            border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '32px'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px'
                            }}>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                    {editingBook ? 'Edit Book' : 'Add New Book'}
                                </h2>
                                <button
                                    onClick={handleCloseForm}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: isLight ? '#1a1a2e' : 'white'
                                    }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {editingBook && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px', alignItems: 'start' }}>
                                        <div style={{
                                            width: '160px',
                                            height: '220px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: isLight ? '1px solid #e5e7eb' : '1px solid var(--zinc-800)',
                                            background: isLight ? '#f3f4f6' : '#0a0a0a',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {formData.cover_url ? (
                                                <img
                                                    src={formData.cover_url}
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
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                                Cover Photo URL
                                            </label>
                                            <input
                                                type="url"
                                                name="cover_url"
                                                value={formData.cover_url}
                                                onChange={handleInputChange}
                                                placeholder="https://..."
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                                    background: isLight ? '#f9f9f9' : '#0a0a0a',
                                                    color: isLight ? '#1a1a2e' : 'white',
                                                    fontSize: '14px'
                                                }}
                                            />
                                            <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                Paste a new image URL to update the book cover.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Title */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Book title"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                            background: isLight ? '#f9f9f9' : '#0a0a0a',
                                            color: isLight ? '#1a1a2e' : 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>

                                {/* Author */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                        Author *
                                    </label>
                                    <input
                                        type="text"
                                        name="author"
                                        value={formData.author}
                                        onChange={handleInputChange}
                                        placeholder="Author name"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                            background: isLight ? '#f9f9f9' : '#0a0a0a',
                                            color: isLight ? '#1a1a2e' : 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>

                                {/* ISBN */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                        ISBN *
                                    </label>
                                    <input
                                        type="text"
                                        name="isbn"
                                        value={formData.isbn}
                                        onChange={handleInputChange}
                                        placeholder="ISBN-13 (e.g., 978-0-13-110362-7)"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                            background: isLight ? '#f9f9f9' : '#0a0a0a',
                                            color: isLight ? '#1a1a2e' : 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Brief description of the book"
                                        rows="4"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                            background: isLight ? '#f9f9f9' : '#0a0a0a',
                                            color: isLight ? '#1a1a2e' : 'white',
                                            fontSize: '14px',
                                            fontFamily: 'inherit',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* Category & Difficulty - Two columns */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                            Category
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                                background: isLight ? '#f9f9f9' : '#0a0a0a',
                                                color: isLight ? '#1a1a2e' : 'white',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option>DSA</option>
                                            <option>System Design</option>
                                            <option>Programming</option>
                                            <option>Web Development</option>
                                            <option>Interview Prep</option>
                                            <option>Career</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                            Difficulty
                                        </label>
                                        <select
                                            name="difficulty_level"
                                            value={formData.difficulty_level}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                                background: isLight ? '#f9f9f9' : '#0a0a0a',
                                                color: isLight ? '#1a1a2e' : 'white',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Cover URL & Pages - Two columns */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                            Pages
                                        </label>
                                        <input
                                            type="number"
                                            name="pages"
                                            value={formData.pages}
                                            onChange={handleInputChange}
                                            placeholder="Number of pages"
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                                background: isLight ? '#f9f9f9' : '#0a0a0a',
                                                color: isLight ? '#1a1a2e' : 'white',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Published Year & Tags - Two columns */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                            Published Year
                                        </label>
                                        <input
                                            type="number"
                                            name="published_year"
                                            value={formData.published_year}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 2024"
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                                background: isLight ? '#f9f9f9' : '#0a0a0a',
                                                color: isLight ? '#1a1a2e' : 'white',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                            Tags (comma-separated)
                                        </label>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={formData.tags}
                                            onChange={handleInputChange}
                                            placeholder="e.g., algorithms, trees, graphs"
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                                background: isLight ? '#f9f9f9' : '#0a0a0a',
                                                color: isLight ? '#1a1a2e' : 'white',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    marginTop: '20px'
                                }}>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn btn-primary"
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            opacity: submitting ? 0.7 : 1
                                        }}
                                    >
                                        {submitting && <Loader size={16} className="animate-spin" />}
                                        {editingBook ? 'Update Book' : 'Add Book'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseForm}
                                        disabled={submitting}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                            background: isLight ? '#f9f9f9' : '#0a0a0a',
                                            color: isLight ? '#1a1a2e' : 'white',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            opacity: submitting ? 0.7 : 1
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Search Filter */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
                        <Search size={16} style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search by title, author, or ISBN..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 36px',
                                borderRadius: '8px',
                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                background: isLight ? 'white' : '#1a1a1a',
                                color: isLight ? '#1a1a2e' : 'white',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Showing {filteredBooks.length} of {adminBooks.length} books
                    </p>
                </div>

                {/* Books List */}
                {loading ? (
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
                ) : filteredBooks.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gap: '12px'
                    }}>
                        {filteredBooks.map(book => (
                            <div key={book.id} className="card" style={{
                                background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(10, 10, 10, 0.6)',
                                backdropFilter: 'blur(10px)',
                                border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                borderRadius: '12px',
                                padding: '20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '20px',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ flex: 1, minWidth: '250px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                                        {book.title}
                                    </h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        by {book.author}
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                        <span>ISBN: {book.isbn}</span>
                                        <span>{book.category}</span>
                                        <span>{book.difficulty_level}</span>
                                        {book.pages && <span>{book.pages} pages</span>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => handleEdit(book)}
                                        disabled={submitting}
                                        style={{
                                            padding: '8px 16px',
                                            minWidth: '98px',
                                            borderRadius: '8px',
                                            border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                                            background: isLight ? 'white' : '#1a1a1a',
                                            color: isLight ? '#1a1a2e' : 'white',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '14px',
                                            opacity: submitting ? 0.7 : 1
                                        }}
                                    >
                                        <Edit2 size={16} /> Edit Cover
                                    </button>
                                    <button
                                        onClick={() => handleDelete(book.id)}
                                        disabled={submitting}
                                        style={{
                                            padding: '8px 16px',
                                            minWidth: '98px',
                                            borderRadius: '8px',
                                            border: '1px solid #dc2626',
                                            background: 'rgba(220, 38, 38, 0.1)',
                                            color: '#dc2626',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '14px',
                                            opacity: submitting ? 0.7 : 1
                                        }}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'var(--text-secondary)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                            {searchFilter ? 'No books found' : 'No books yet'}
                        </h3>
                        <p>{searchFilter ? 'Try different search terms' : 'Click "Add New Book" to get started'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
