import React, { useState, useEffect, useCallback } from 'react';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Image as ImageIcon,
    CheckSquare,
    Minus
} from 'lucide-react';

const CommandList = ({ items, command, editor }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        setSelectedIndex(0);
    }, [items]);

    const onKeyDown = useCallback(
        ({ event }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + items.length - 1) % items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
        [items, selectedIndex]
    );

    useEffect(() => {
        // Expose onKeyDown to the parent renderer
        if (editor && editor.storage) {
            // This is a bit of a hack to pass keydown events from the tiptap plugin to the react component
        }
    }, [editor, onKeyDown]);

    const selectItem = (index) => {
        const item = items[index];
        if (item) {
            command(item);
        }
    };

    // Attach key listener manually since we are in a portal/renderer context
    // Actually, standard Tiptap suggestion handles keydown via props.command({ ... }) 
    // but we need to intercept it in the `render` function of the suggestion utility.
    // The `ReactRenderer` exposes `ref` which we can use.

    return (
        <div className="slash-command-menu">
            {items.length > 0 ? (
                items.map((item, index) => (
                    <button
                        key={index}
                        className={`slash-command-item ${index === selectedIndex ? 'is-selected' : ''}`}
                        onClick={() => selectItem(index)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <span className="icon">{item.icon}</span>
                        <div className="label">
                            <div className="title">{item.title}</div>
                            <div className="subtitle">{item.description}</div>
                        </div>
                    </button>
                ))
            ) : (
                <div className="slash-command-empty">No results</div>
            )}
            <style>{`
        .slash-command-menu {
          background: #111;
          border: 1px solid #333;
          border-radius: 8px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 300px;
          max-height: 300px;
          overflow-y: auto;
        }
        .slash-command-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          color: white;
          width: 100%;
        }
        .slash-command-item.is-selected {
          background: #262626;
        }
        .slash-command-item .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #333;
          border-radius: 4px;
          color: white;
        }
        .slash-command-item .label {
          display: flex;
          flex-direction: column;
        }
        .slash-command-item .title {
          font-size: 14px;
          font-weight: 500;
        }
        .slash-command-item .subtitle {
          font-size: 12px;
          color: #888;
        }
        .slash-command-empty {
            padding: 8px;
            text-align: center;
            color: #888;
            font-size: 13px;
        }
      `}</style>
        </div>
    );
};

// ... Suggestion configuration
const getSuggestionItems = ({ query }) => {
    return [
        {
            title: 'Heading 1',
            description: 'Big section heading',
            icon: <Heading1 size={14} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
            },
        },
        {
            title: 'Heading 2',
            description: 'Medium section heading',
            icon: <Heading2 size={14} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
            },
        },
        {
            title: 'Heading 3',
            description: 'Small section heading',
            icon: <Heading3 size={14} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
            },
        },
        {
            title: 'Bullet List',
            description: 'Create a simple bullet list',
            icon: <List size={14} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: 'Numbered List',
            description: 'Create a list with numbering',
            icon: <ListOrdered size={14} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: 'Quote',
            description: 'Capture a quote',
            icon: <Quote size={14} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setBlockquote().run();
            },
        },
        {
            title: 'Code Block',
            description: 'Capture a code snippet',
            icon: <Code size={14} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setCodeBlock().run();
            },
        },
        {
            title: 'Divider',
            description: 'Visually separate content',
            icon: <Minus size={14} />,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
            },
        },
        {
            title: 'Image',
            description: 'Upload or embed an image',
            icon: <ImageIcon size={14} />,
            command: ({ editor, range }) => {
                const url = window.prompt('Enter image URL');
                if (url) {
                    editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
                }
            },
        }
    ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()));
};

const renderSuggestion = () => {
    let component;
    let popup;

    return {
        onStart: (props) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            });
        },
        onUpdate(props) {
            component.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            popup[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown(props) {
            if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
            }
            // Delegate key handling to the component
            return component.ref?.onKeyDown(props);
        },
        onExit() {
            popup[0].destroy();
            component.destroy();
        },
    };
};

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const slashCommandSuggestion = {
    items: getSuggestionItems,
    render: renderSuggestion,
};

export default SlashCommand;
