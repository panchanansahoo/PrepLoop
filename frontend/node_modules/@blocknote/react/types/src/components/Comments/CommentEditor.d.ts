import { BlockNoteEditor } from "@blocknote/core";
import { FC } from "react";
/**
 * The CommentEditor component displays an editor for creating or editing a comment.
 * Currently, we also use the non-editable version for displaying a comment.
 *
 * It's used:
 * - to create a new comment (FloatingComposer.tsx)
 * - As the last item in a Thread, to compose a reply (Thread.tsx)
 * - To edit or display an existing comment (Comment.tsx)
 *
 */
export declare const CommentEditor: (props: {
    autoFocus?: boolean;
    editable: boolean;
    actions?: FC<{
        isFocused: boolean;
        isEmpty: boolean;
    }>;
    editor: BlockNoteEditor<any, any, any>;
}) => import("react/jsx-runtime").JSX.Element;
