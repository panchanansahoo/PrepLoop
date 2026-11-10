import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import DOMPurify from 'dompurify';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2, Quote, Code } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function SimpleEditor({ content, onChange, placeholder = 'Start typing...' }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2],
                },
            }),
            Underline,
        ],
        content: content ? DOMPurify.sanitize(content) : '',
        editorProps: {
            attributes: {
                class: `simple-editor-editable outline-none min-h-[300px] p-6 ${isLight ? 'prose max-w-none' : 'prose prose-invert max-w-none'}`,
                'aria-label': 'Rich text editor',
                'data-placeholder': placeholder,
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            if (onChange) {
                onChange(currentEditor.getHTML());
            }
        },
    });

    // Sync external content changes safely
    useEffect(() => {
        if (!editor || content === undefined || content === null) return;
        const sanitized = DOMPurify.sanitize(content);
        if (editor.getHTML() !== sanitized) {
            editor.commands.setContent(sanitized, false);
        }
    }, [content, editor]);

    const ToolbarButton = ({ onClick, icon: Icon, active = false, title }) => (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`p-2 rounded ${isLight ? 'hover:bg-gray-200 text-gray-500 hover:text-gray-900' : 'hover:bg-zinc-700 text-zinc-400 hover:text-white'} transition-colors ${active ? (isLight ? 'bg-gray-200 text-gray-900 font-bold' : 'bg-zinc-700 text-white font-bold') : ''}`}
        >
            <Icon size={18} />
        </button>
    );

    return (
        <div className={`simple-editor-container border ${isLight ? 'border-gray-200 bg-white' : 'border-zinc-800 bg-zinc-900'} rounded-lg overflow-hidden flex flex-col h-[500px]`}>
            {/* Toolbar */}
            <div className={`flex items-center gap-1 p-2 border-b ${isLight ? 'border-gray-200 bg-gray-50' : 'border-zinc-800 bg-zinc-900/50'}`}>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    icon={Bold}
                    active={Boolean(editor?.isActive('bold'))}
                    title="Bold"
                />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    icon={Italic}
                    active={Boolean(editor?.isActive('italic'))}
                    title="Italic"
                />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    icon={UnderlineIcon}
                    active={Boolean(editor?.isActive('underline'))}
                    title="Underline"
                />
                <div className={`w-[1px] h-6 ${isLight ? 'bg-gray-200' : 'bg-zinc-800'} mx-1`}></div>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    icon={Heading1}
                    active={Boolean(editor?.isActive('heading', { level: 1 }))}
                    title="Heading 1"
                />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    icon={Heading2}
                    active={Boolean(editor?.isActive('heading', { level: 2 }))}
                    title="Heading 2"
                />
                <div className={`w-[1px] h-6 ${isLight ? 'bg-gray-200' : 'bg-zinc-800'} mx-1`}></div>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    icon={List}
                    active={Boolean(editor?.isActive('bulletList'))}
                    title="Bullet List"
                />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    icon={ListOrdered}
                    active={Boolean(editor?.isActive('orderedList'))}
                    title="Ordered List"
                />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    icon={Quote}
                    active={Boolean(editor?.isActive('blockquote'))}
                    title="Blockquote"
                />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    icon={Code}
                    active={Boolean(editor?.isActive('codeBlock'))}
                    title="Code Block"
                />
            </div>

            {/* Editable Area */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            <div className={`px-4 py-2 ${isLight ? 'bg-gray-50 text-gray-400 border-t border-gray-200' : 'bg-zinc-900/30 text-zinc-500 border-t border-zinc-800'} text-xs text-right`}>
                Rich Text Editor &bull; Powered by Tiptap
            </div>

            <style>{`
        .simple-editor-editable {
          min-height: 300px;
        }
        .simple-editor-editable:empty:before {
          content: attr(data-placeholder);
          color: ${isLight ? '#94a3b8' : '#52525b'};
          cursor: text;
          pointer-events: none;
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
