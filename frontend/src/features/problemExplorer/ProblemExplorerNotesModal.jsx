import { StickyNote, X } from 'lucide-react';

export function ProblemExplorerNotesModal({
    activeNote,
    setActiveNote,
    isLight,
    problems,
    noteText,
    setNoteText,
    saveNote,
}) {
    if (activeNote === null) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onClick={() => setActiveNote(null)}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 440,
                    padding: 24,
                    borderRadius: 16,
                    background: isLight ? '#fff' : '#1a1a2e',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#e9d5ff' }}>
                        <StickyNote size={16} />
                        Problem Notes
                    </div>
                    <button onClick={() => setActiveNote(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={18} color={isLight ? '#94a3b8' : 'rgba(255,255,255,0.4)'} />
                    </button>
                </div>
                <div style={{ fontSize: 13, color: isLight ? '#64748b' : 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                    {problems.find((problem) => problem.id === activeNote)?.title}
                </div>
                <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add your notes, approach, key insights..."
                    style={{
                        width: '100%',
                        minHeight: 120,
                        padding: 12,
                        borderRadius: 10,
                        background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.04)',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                        color: isLight ? '#1e293b' : '#fff',
                        fontSize: 13,
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.6,
                    }}
                    autoFocus
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                    {noteText && (
                        <button
                            onClick={() => {
                                setNoteText('');
                                saveNote(activeNote, '');
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                background: 'rgba(248,113,113,0.1)',
                                border: '1px solid rgba(248,113,113,0.2)',
                                color: '#f87171',
                            }}
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={() => saveNote(activeNote, noteText)}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            border: 'none',
                            color: '#fff',
                        }}
                    >
                        Save Note
                    </button>
                </div>
            </div>
        </div>
    );
}
