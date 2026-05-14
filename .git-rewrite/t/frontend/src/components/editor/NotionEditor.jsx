import React, { useEffect, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { MantineProvider } from "@mantine/core";
import "@blocknote/core/fonts/inter.css";
import "@mantine/core/styles.css";
import "@blocknote/mantine/style.css";
import './NotionEditor.css';

export default function NotionEditor({
    initialContent,
    onChange,
    editable = true,
    onEditorReady
}) {
    // Initialize editor
    const editor = useCreateBlockNote({
        // If initialContent is an array, use it as blocks. Otherwise start undefined (empty)
        initialContent: Array.isArray(initialContent) ? initialContent : undefined,
    });

    // Expose editor instance
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Handle Legacy HTML Content
    // If initialContent is a string (HTML), we parse it into blocks once the editor is ready.
    useEffect(() => {
        const loadHTML = async () => {
            if (editor && typeof initialContent === 'string' && initialContent.trim().length > 0) {
                // Try to parse HTML.
                const blocks = await editor.tryParseHTMLToBlocks(initialContent);
                // Replace the default empty block with the parsed blocks
                editor.replaceBlocks(editor.document, blocks);
            }
        };

        // Only run this if we have editor and valid HTML string, and we haven't already initialized with blocks
        if (editor && !Array.isArray(initialContent)) {
            loadHTML();
        }
    }, [editor, initialContent]); // Dependency on initialContent is tricky if it changes. 
    // Ideally initialContent should be stable or we only run this on mount.

    if (!editor) {
        return <div className="p-4 text-zinc-500">Loading Editor...</div>;
    }

    return (
        <MantineProvider>
            <div className="notion-editor-wrapper">
                <BlockNoteView
                    editor={editor}
                    editable={editable}
                    onChange={() => {
                        // Pass the document JSON back to parent
                        if (onChange) onChange(editor.document);
                    }}
                    theme="dark"
                />
            </div>
        </MantineProvider>
    );
}
