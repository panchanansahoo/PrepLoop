import { useState, useEffect, useCallback, useRef } from 'react';

import { useAuth } from '../context/AuthContext';
import { getAccountStorageKey, readDraft, writeDraft } from '../utils/accountStorage';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { Bookmark, Search, Tag, Filter, Plus, Trash2, Edit3, Save, X, Hash, ListFilter, StickyNote } from 'lucide-react';

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

const buildNotesApiUrl = path => buildApiUrl(path, { rawBaseUrl: import.meta.env.VITE_API_URL || '', apiPrefix: '/api' });

async function notesRequest(path, options) {
    const response = await authFetch(buildNotesApiUrl(path), options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The request failed. Please try again.');
    return data;
}

export default function NotesBookmarks() {
    const { user, loading } = useAuth();
    if (loading) return null;
    const userId = user?.isGuest ? null : user?.id;
    return <AccountNotesBookmarks key={userId || 'guest'} userId={userId} />;
}

function AccountNotesBookmarks({ userId }) {
    const cacheKey = getAccountStorageKey('notes', userId);
    const requestVersion = useRef(0);
    const mounted = useRef(false);
    const [loadError, setLoadError] = useState('');
    const [actionError, setActionError] = useState('');
    const [saving, setSaving] = useState(false);
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

    const fetchBookmarks = useCallback(async () => {
        const version = ++requestVersion.current;
        if (!userId) {
            setLoading(false);
            setLoadError('Sign in to load your notes.');
            return;
        }
        setLoadError('');
        setLoading(prev => bookmarks.length === 0 ? true : prev);
        try {
            const items = [];
            let page = 1;
            let hasMore;
            do {
                const data = await notesRequest(`/notes/bookmarks?page=${page}&limit=100`);
                if (version !== requestVersion.current) return;
                if (!Array.isArray(data.bookmarks)) throw new Error('Invalid bookmarks response');
                items.push(...data.bookmarks);
                hasMore = data.pagination?.hasMore && data.bookmarks.length > 0 && page < 100;
                page++;
            } while (hasMore);
            const seenIds = new Set();
            const uniqueItems = items.filter(item => {
                if (item?.id == null || seenIds.has(item.id)) return false;
                seenIds.add(item.id);
                return true;
            });
            setBookmarks(uniqueItems);
            writeDraft(cacheKey, userId, JSON.stringify(uniqueItems));
        } catch {
            if (version !== requestVersion.current) return;
            let saved = [];
            try {
                const data = JSON.parse(readDraft(cacheKey, userId) || '[]');
                if (Array.isArray(data)) saved = data;
            } catch { /* The list can be loaded again. */ }
            setBookmarks(saved);
            setLoadError(saved.length ? 'Could not refresh notes. Showing your last saved list.' : 'Could not load your notes.');
        } finally {
            if (version === requestVersion.current) setLoading(false);
        }
    }, [cacheKey, userId]);

    useEffect(() => {
        mounted.current = true;
        fetchBookmarks();
        return () => {
            mounted.current = false;
            requestVersion.current++;
        };
    }, [fetchBookmarks]);

    const saveChange = async (request, onSuccess) => {
        if (saving) return;
        setSaving(true);
        setActionError('');
        try {
            const data = await request();
            if (mounted.current) onSuccess(data);
        } catch (error) {
            if (mounted.current) setActionError(error.message || 'Could not save your change. Please try again.');
        } finally {
            if (mounted.current) setSaving(false);
        }
    };

    const commitBookmarks = next => {
        requestVersion.current++;
        setBookmarks(next);
        setLoading(false);
        writeDraft(cacheKey, userId, JSON.stringify(next));
    };

    const addBookmark = () => {
        if (!newBookmark.title.trim()) return;
        saveChange(() => notesRequest('/notes/bookmark', {
            method: 'POST',
            body: JSON.stringify({
                questionTitle: newBookmark.title.trim(),
                questionType: newBookmark.type,
                tags: newBookmark.tags,
                note: newBookmark.note,
            }),
        }), ({ bookmark }) => {
            commitBookmarks([bookmark, ...bookmarks.filter(item => item.id !== bookmark.id)]);
            setNewBookmark({ title: '', type: 'custom', tags: [], note: '' });
            setShowAddForm(false);
        });
    };

    const updateNote = id => saveChange(() => notesRequest(`/notes/bookmark/${id}/note`, {
        method: 'PUT',
        body: JSON.stringify({ note: editNote, tags: editTags }),
    }), ({ bookmark }) => {
        commitBookmarks(bookmarks.map(item => item.id === id ? bookmark : item));
        setEditingId(null);
    });

    const deleteBookmark = id => saveChange(
        () => notesRequest(`/notes/bookmark/${id}`, { method: 'DELETE' }),
        () => {
            if (editingId === id) setEditingId(null);
            commitBookmarks(bookmarks.filter(item => item.id !== id));
        }
    );

    const allTags = [...new Set(bookmarks.flatMap(b => b.tags || []))];

    const filteredBookmarks = bookmarks.filter(b => {
        if (typeFilter !== 'all' && b.question_type !== typeFilter) return false;
        if (tagFilter !== 'all' && !b.tags?.includes(tagFilter)) return false;
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
                        {(bookmarks.length > 0 || (!loading && !loadError)) && <p>{bookmarks.length} items saved</p>}
                    </div>
                </div>
                <button className="nb-add-btn" disabled={!userId || loading} onClick={() => setShowAddForm(true)}>
                    <Plus size={16} /> Add Note
                </button>
            </div>

            {loadError && <p role="alert">{loadError} {userId && <button onClick={fetchBookmarks}>Try again</button>}</p>}
            {actionError && <p role="alert">{actionError}</p>}

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
                        <button className="nb-save-btn" disabled={saving} onClick={addBookmark}>
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
            ) : filteredBookmarks.length === 0 ? !loadError && (
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
                                    <button disabled={saving} onClick={() => deleteBookmark(bm.id)}>
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
                                        <button className="nb-save-btn" disabled={saving} onClick={() => updateNote(bm.id)}>
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
