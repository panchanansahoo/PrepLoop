import { BubbleMenu } from '@tiptap/react';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Link,
    List as _ListIcon
} from 'lucide-react';

export default function EditorMenu({ editor }) {
    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleToggleBold = () => {
        editor.chain().focus().toggleBold().run();
    };

    const handleToggleItalic = () => {
        editor.chain().focus().toggleItalic().run();
    };

    const handleToggleStrike = () => {
        editor.chain().focus().toggleStrike().run();
    };

    const handleToggleCode = () => {
        editor.chain().focus().toggleCode().run();
    };

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bubble-menu"
        >
            <button
                onClick={handleToggleBold}
                className={editor.isActive('bold') ? 'is-active' : ''}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={handleToggleItalic}
                className={editor.isActive('italic') ? 'is-active' : ''}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={handleToggleStrike}
                className={editor.isActive('strike') ? 'is-active' : ''}
                title="Strike"
            >
                <Strikethrough size={16} />
            </button>
            <button
                onClick={handleToggleCode}
                className={editor.isActive('code') ? 'is-active' : ''}
                title="Inline Code"
            >
                <Code size={16} />
            </button>
            <button
                onClick={setLink}
                className={editor.isActive('link') ? 'is-active' : ''}
                title="Link"
            >
                <Link size={16} />
            </button>

            <style>{`
        .bubble-menu {
          display: flex;
          background-color: #1a1a1a;
          padding: 4px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          gap: 2px;
        }

        .bubble-menu button {
          border: none;
          background: none;
          color: #bdbdbd;
          font-size: 14px;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bubble-menu button:hover {
          background-color: #333;
          color: #fff;
        }

        .bubble-menu button.is-active {
          background-color: #6366f1;
          color: #fff;
        }
      `}</style>
        </BubbleMenu>
    );
}
