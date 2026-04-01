import type { CommentData, ThreadData } from "@blocknote/core/comments";
export type CommentProps = {
    comment: CommentData;
    thread: ThreadData;
    showResolveButton?: boolean;
};
/**
 * The Comment component displays a single comment with actions,
 * a reaction list and an editor when editing.
 *
 * It's generally used in the `Thread` component for comments that have already been created.
 *
 */
export declare const Comment: ({ comment, thread, showResolveButton, }: CommentProps) => import("react/jsx-runtime").JSX.Element | null;
