import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';
import {
    Bookmark, Search, Tag, Filter, Plus, Trash2,
    Edit3, Save, X, Hash, ListFilter, StickyNote
} from 'lucide-react';

const TYPES = [
    { id: 'all', label: 'All' },
    { id: 'dsa', label: 'DSA' },
    { id: 'sql', label: 'SQL' },
    { id: 'aptitude', label: 'Aptitude' },
    { id: 'interview', label: 'Interview' },
    { id: 'custom', label: 'Custom' },
];

const PRESET_TAGS = [
    'Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'SQL', 'HR',
    'System Design', 'Aptitude', 'Important', 'Revision', 'Weak'
];

export default function NotesBookmarks() {
    const { user } = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const buildNotesApiUrl = (path) => buildApiUrl(path, { rawBaseUrl: API_BASE_URL, apiPrefix: '/api' });
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editNote, setEditNote] = useState('');
    const [editTags, setEditTags] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBookmark, setNewBookmark] = useState({ title: '', type: 'custom', tags: [], note: '' });

    // Fetch bookmarks
    const fetchBookmarks = async () => {
        try {
            const params = new URLSearchParams();
            if (typeFilter !== 'all') params.append('type', typeFilter);
            if (search) params.append('search', search);
            if (tagFilter !== 'all') params.append('tag', tagFilter);

            const res = await fetch(`${buildNotesApiUrl('/notes/bookmarks')}?${params}`, {
                headers: buildAuthHeaders(user),
            });
            const data = await res.json();
            setBookmarks(data.bookmarks || []);
        } catch (err) {
            console.error(err);
            // Fallback to localStorage
            const saved = JSON.parse(localStorage.getItem('preploop_bookmarks') || '[]');
            setBookmarks(saved);
        }
        setLoading(false);
    };

    useEffect(() => { fetchBookmarks(); }, [typeFilter, tagFilter]);

    // Add bookmark
    const addBookmark = async () => {
        if (!newBookmark.title.trim()) return;
        try {
            const res = await fetch(buildNotesApiUrl('/notes/bookmark'), {
                method: 'POST',
                headers: buildAuthHeaders(user),
                body: JSON.stringify({
                    questionId: `custom_${Date.now()}`,
                    questionTitle: newBookmark.title,
                    questionType: newBookmark.type,
                    tags: newBookmark.tags,
                    note: newBookmark.note,
                }),
            });
            if (res.ok) {
                await fetchBookmarks();
                setNewBookmark({ title: '', type: 'custom', tags: [], note: '' });
                setShowAddForm(false);
            }
        } catch (err) {
            // Fallback: save to localStorage
            const saved = JSON.parse(localStorage.getItem('preploop_bookmarks') || '[]');
            const newEntry = {
                id: Date.now(),
                question_title: newBookmark.title,
                question_type: newBookmark.type,
                tags: newBookmark.tags,
                note: newBookmark.note,
                created_at: new Date().toISOString(),
            };
            saved.unshift(newEntry);
            localStorage.setItem('preploop_bookmarks', JSON.stringify(saved));
            setBookmarks(saved);
            setNewBookmark({ title: '', type: 'custom', tags: [], note: '' });
            setShowAddForm(false);
        }
    };

    // Update note
    const updateNote = async (id) => {
        try {
            await fetch(buildNotesApiUrl(`/notes/bookmark/${id}/note`), {
                method: 'PUT',
                headers: buildAuthHeaders(user),
                body: JSON.stringify({ note: editNote, tags: editTags }),
            });
            await fetchBookmarks();
        } catch (err) {
            console.error(err);
        }
        setEditingId(null);
    };

    // Delete bookmark
    const deleteBookmark = async (id) => {
        try {
            await fetch(buildNotesApiUrl(`/notes/bookmark/${id}`), {
                method: 'DELETE',
                headers: buildAuthHeaders(user),
            });
            await fetchBookmarks();
        } catch (err) {
            // Fallback
            const saved = JSON.parse(localStorage.getItem('preploop_bookmarks') || '[]');
            localStorage.setItem('preploop_bookmarks', JSON.stringify(saved.filter(b => b.id !== id)));
            setBookmarks(prev => prev.filter(b => b.id !== id));
        }
    };

    const allTags = [...new Set(bookmarks.flatMap(b => b.tags || []))];

    const filteredBookmarks = bookmarks.filter(b => {
        if (search) {
            const s = search.toLowerCase();
            if (!b.question_title?.toLowerCase().includes(s) && !b.note?.toLowerCase().includes(s)) return false;
        }
        return true;
    });

    const toggleTag = (tag, setter, current) => {
        setter(current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]);
    };

    return (
        <div className="nb-container">
            <div className="nb-header">
                <div className="nb-header-left">
                    <Bookmark size={28} style={{ color: 'var(--accent)' }} />
                    <div>
                        <h1>Notes & Bookmarks</h1>
                        <p>{bookmarks.length} items saved</p>
                    </div>
                </div>
                <button className="nb-add-btn" onClick={() => setShowAddForm(true)}>
                    <Plus size={16} /> Add Note
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="nb-add-form">
                    <input
                        type="text"
                        placeholder="Title or question name..."
                        value={newBookmark.title}
                        onChange={e => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                        className="nb-input"
                    />
                    <select
                        value={newBookmark.type}
                        onChange={e => setNewBookmark(prev => ({ ...prev, type: e.target.value }))}
                        className="nb-select"
                    >
                        {TYPES.filter(t => t.id !== 'all').map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                    <div className="nb-tag-picker">
                        {PRESET_TAGS.map(tag => (
                            <button
                                key={tag}
                                className={`nb-tag-chip ${newBookmark.tags.includes(tag) ? 'active' : ''}`}
                                onClick={() => toggleTag(tag, (tags) => setNewBookmark(prev => ({ ...prev, tags })), newBookmark.tags)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    <textarea
                        placeholder="Add a note..."
                        value={newBookmark.note}
                        onChange={e => setNewBookmark(prev => ({ ...prev, note: e.target.value }))}
                        className="nb-textarea"
                        rows={3}
                    />
                    <div className="nb-form-actions">
                        <button className="nb-save-btn" onClick={addBookmark}>
                            <Save size={14} /> Save
                        </button>
                        <button className="nb-cancel-btn" onClick={() => setShowAddForm(false)}>
                            <X size={14} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="nb-filters">
                <div className="nb-search-wrap">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search bookmarks..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="nb-search"
                    />
                </div>
                <div className="nb-type-filters">
                    {TYPES.map(t => (
                        <button
                            key={t.id}
                            className={`nb-type-btn ${typeFilter === t.id ? 'active' : ''}`}
                            onClick={() => setTypeFilter(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {allTags.length > 0 && (
                    <div className="nb-tag-filters">
                        <Tag size={12} />
                        <button className={`nb-tag-btn ${tagFilter === 'all' ? 'active' : ''}`} onClick={() => setTagFilter('all')}>All</button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`nb-tag-btn ${tagFilter === tag ? 'active' : ''}`}
                                onClick={() => setTagFilter(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bookmarks List */}
            {loading ? (
                <div className="nb-loading">Loading...</div>
            ) : filteredBookmarks.length === 0 ? (
                <div className="nb-empty">
                    <StickyNote size={40} style={{ color: 'rgba(255,255,255,0.15)' }} />
                    <p>No bookmarks yet. Start saving questions!</p>
                </div>
            ) : (
                <div className="nb-list">
                    {filteredBookmarks.map(bm => (
                        <div key={bm.id} className="nb-card">
                            <div className="nb-card-header">
                                <h3>{bm.question_title}</h3>
                                <div className="nb-card-actions">
                                    <button onClick={() => { setEditingId(bm.id); setEditNote(bm.note || ''); setEditTags(bm.tags || []); }}>
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={() => deleteBookmark(bm.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="nb-card-meta">
                                <span className={`nb-type-badge nb-type-${bm.question_type}`}>{bm.question_type}</span>
                                {bm.tags?.map(tag => (
                                    <span key={tag} className="nb-tag">{tag}</span>
                                ))}
                            </div>
                            {bm.note && <p className="nb-card-note">{bm.note}</p>}
                            <span className="nb-card-date">{new Date(bm.created_at).toLocaleDateString()}</span>

                            {/* Edit inline */}
                            {editingId === bm.id && (
                                <div className="nb-edit-inline">
                                    <textarea
                                        value={editNote}
                                        onChange={e => setEditNote(e.target.value)}
                                        className="nb-textarea"
                                        rows={3}
                                        placeholder="Edit your note..."
                                    />
                                    <div className="nb-tag-picker">
                                        {PRESET_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                className={`nb-tag-chip ${editTags.includes(tag) ? 'active' : ''}`}
                                                onClick={() => toggleTag(tag, setEditTags, editTags)}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="nb-form-actions">
                                        <button className="nb-save-btn" onClick={() => updateNote(bm.id)}>
                                            <Save size={14} /> Update
                                        </button>
                                        <button className="nb-cancel-btn" onClick={() => setEditingId(null)}>
                                            <X size={14} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
