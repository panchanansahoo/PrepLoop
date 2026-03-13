import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Quote, Code } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function SimpleEditor({ content, onChange, placeholder }) {
    const editorRef = useRef(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Sync initial content
    useEffect(() => {
        if (editorRef.current && content && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }, []);

    const handleInput = (e) => {
        onChange(e.currentTarget.innerHTML);
    };

    const exec = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current.focus();
    };

    const ToolbarButton = ({ onClick, icon: Icon, active = false }) => (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`p-2 rounded ${isLight ? 'hover:bg-gray-200 text-gray-500 hover:text-gray-900' : 'hover:bg-zinc-700 text-zinc-400 hover:text-white'} transition-colors ${active ? (isLight ? 'bg-gray-200 text-gray-900' : 'bg-zinc-700 text-white') : ''}`}
        >
            <Icon size={18} />
        </button>
    );

    return (
        <div className={`simple-editor-container border ${isLight ? 'border-gray-200' : 'border-zinc-800'} rounded-lg overflow-hidden flex flex-col h-[500px]`}>
            {/* Toolbar */}
            <div className={`flex items-center gap-1 p-2 border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-zinc-800 bg-zinc-900/50'}`}>
                <ToolbarButton onClick={() => exec('bold')} icon={Bold} />
                <ToolbarButton onClick={() => exec('italic')} icon={Italic} />
                <ToolbarButton onClick={() => exec('underline')} icon={Underline} />
                <div className={`w-[1px] h-6 ${isLight ? 'bg-gray-200' : 'bg-zinc-800'} mx-1`}></div>
                <ToolbarButton onClick={() => exec('formatBlock', 'H1')} icon={Heading1} />
                <ToolbarButton onClick={() => exec('formatBlock', 'H2')} icon={Heading2} />
                <div className={`w-[1px] h-6 ${isLight ? 'bg-gray-200' : 'bg-zinc-800'} mx-1`}></div>
                <ToolbarButton onClick={() => exec('insertUnorderedList')} icon={List} />
                <ToolbarButton onClick={() => exec('insertOrderedList')} icon={ListOrdered} />
                <ToolbarButton onClick={() => exec('formatBlock', 'blockquote')} icon={Quote} />
                <ToolbarButton onClick={() => exec('formatBlock', 'pre')} icon={Code} />
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                className={`flex-1 p-6 outline-none overflow-y-auto ${isLight ? 'prose max-w-none' : 'prose prose-invert max-w-none'}`}
                contentEditable
                onInput={handleInput}
                style={{ minHeight: '300px' }}
                placeholder={placeholder}
            />

            <div className={`px-4 py-2 ${isLight ? 'bg-gray-50 text-gray-400 border-t border-gray-200' : 'bg-zinc-900/30 text-zinc-500 border-t border-zinc-800'} text-xs text-right`}>
                Custom Editor (Safe Mode) &bull; Tiptap Unavailable
            </div>

            <style>{`
        [contentEditable]:empty:before {
          content: attr(placeholder);
          color: ${isLight ? '#94a3b8' : '#52525b'};
          cursor: text;
        }
        .prose h1 { font-size: 2em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; color: ${isLight ? '#1e293b' : 'white'}; }
        .prose h2 { font-size: 1.5em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; color: ${isLight ? '#1e293b' : 'white'}; }
        .prose ul { list-style-type: disc; padding-left: 1.5em; margin: 1em 0; }
        .prose ol { list-style-type: decimal; padding-left: 1.5em; margin: 1em 0; }
        .prose blockquote { border-left: 4px solid #6366f1; padding-left: 1em; margin: 1em 0; color: ${isLight ? '#64748b' : '#a1a1aa'}; background: ${isLight ? '#f1f5f9' : '#1f1f22'}; padding: 0.5em 1em; border-radius: 0 4px 4px 0; }
        .prose pre { background: ${isLight ? '#f8fafc' : '#18181b'}; padding: 1em; border-radius: 8px; font-family: monospace; margin: 1em 0; color: #ef4444; }
      `}</style>
        </div>
    );
}
