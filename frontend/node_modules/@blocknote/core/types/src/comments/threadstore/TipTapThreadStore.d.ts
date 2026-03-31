import type { TiptapCollabProvider } from "@hocuspocus/provider";
import { CommentBody, ThreadData } from "../types.js";
import { ThreadStore } from "./ThreadStore.js";
import { ThreadStoreAuth } from "./ThreadStoreAuth.js";
/**
 * The `TiptapThreadStore` integrates with Tiptap's collaboration provider for comment management.
 * You can pass a `TiptapCollabProvider` to the constructor which takes care of storing the comments.
 *
 * Under the hood, this actually works similarly to the `YjsThreadStore` implementation. (comments are stored in the Yjs document)
 */
export declare class TiptapThreadStore extends ThreadStore {
    private readonly userId;
    private readonly provider;
    constructor(userId: string, provider: TiptapCollabProvider, auth: ThreadStoreAuth);
    /**
     * Creates a new thread with an initial comment.
     */
    createThread(options: {
        initialComment: {
            body: CommentBody;
            metadata?: any;
        };
        metadata?: any;
    }): Promise<ThreadData>;
    addThreadToDocument: undefined;
    /**
     * Adds a comment to a thread.
     */
    addComment(options: {
        comment: {
            body: CommentBody;
            metadata?: any;
        };
        threadId: string;
    }): Promise<CommentBody>;
    /**
     * Updates a comment in a thread.
     */
    updateComment(options: {
        comment: {
            body: CommentBody;
            metadata?: any;
        };
        threadId: string;
        commentId: string;
    }): Promise<void>;
    private tiptapCommentToCommentData;
    private tiptapThreadToThreadData;
    /**
     * Deletes a comment from a thread.
     */
    deleteComment(options: {
        threadId: string;
        commentId: string;
    }): Promise<void>;
    /**
     * Deletes a thread.
     */
    deleteThread(options: {
        threadId: string;
    }): Promise<void>;
    /**
     * Marks a thread as resolved.
     */
    resolveThread(options: {
        threadId: string;
    }): Promise<void>;
    /**
     * Marks a thread as unresolved.
     */
    unresolveThread(options: {
        threadId: string;
    }): Promise<void>;
    /**
     * Adds a reaction to a comment.
     *
     * Auth: should be possible by anyone with comment access
     */
    addReaction(options: {
        threadId: string;
        commentId: string;
        emoji: string;
    }): Promise<void>;
    /**
     * Deletes a reaction from a comment.
     *
     * Auth: should be possible by the reaction author
     */
    deleteReaction(options: {
        threadId: string;
        commentId: string;
        emoji: string;
    }): Promise<void>;
    getThread(threadId: string): ThreadData;
    getThreads(): Map<string, ThreadData>;
    subscribe(cb: (threads: Map<string, ThreadData>) => void): () => void;
}
