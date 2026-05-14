import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import EditorMenu from './EditorMenu';
// import { SlashCommand, slashCommandSuggestion } from './SlashCommand';

export default function TiptapEditor({ content, onChange, placeholder = "Type '/' for commands..." }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            // Image,
            // Link.configure({ openOnClick: false }),
            // Underline,
            // TaskList,
            // TaskItem.configure({ nested: true }),
            /*
            SlashCommand.configure({
                suggestion: slashCommandSuggestion,
            }),
            */
        ],
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-lg max-w-none focus:outline-none tiptap-editor',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="tiptap-container">
            {editor && <EditorMenu editor={editor} />}
            <EditorContent editor={editor} />

            <style>{`
        .tiptap-container {
            width: 100%;
        }
        .tiptap-editor {
            min-height: 300px;
            color: #d4d4d8; /* zinc-300 */
        }
        .tiptap-editor p {
            margin-bottom: 1em;
            line-height: 1.7;
        }
        .tiptap-editor h1 { font-size: 2.25em; font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; color: white; }
        .tiptap-editor h2 { font-size: 1.75em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: white; }
        .tiptap-editor h3 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: white; }
        
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 1.5em; margin-bottom: 1em; }
        .tiptap-editor ul { list-style-type: disc; }
        .tiptap-editor ol { list-style-type: decimal; }
        
        .tiptap-editor blockquote {
            border-left: 3px solid #6366f1;
            padding-left: 1em;
            font-style: italic;
            color: #a1a1aa;
            margin: 1.5em 0;
        }
        
        .tiptap-editor pre {
            background: #18181b;
            padding: 1em;
            border-radius: 8px;
            overflow-x: auto;
            color: #ef4444; /* primitive syntax highlight color */
            font-family: monospace;
            margin: 1.5em 0;
        }
        
        .tiptap-editor code {
            background: #27272a;
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-size: 0.9em;
            color: #e4e4e7;
        }
        
        .tiptap-editor img {
            max-width: 100%;
            border-radius: 8px;
            margin: 1.5em 0;
        }

        .tiptap-editor hr {
            border: 0;
            border-top: 1px solid #3f3f46;
            margin: 2em 0;
        }
        
        /* Placeholder */
        .tiptap p.is-editor-empty:first-child::before {
            color: #52525b;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
        }
      `}</style>
        </div>
    );
}
