import * as Y from "yjs";
import { CommentBody, ThreadData } from "../../types.js";
import { ThreadStoreAuth } from "../ThreadStoreAuth.js";
import { YjsThreadStoreBase } from "./YjsThreadStoreBase.js";
/**
 * This is a Yjs-based implementation of the ThreadStore interface.
 *
 * It reads and writes thread / comments information directly to the underlying Yjs Document.
 *
 * @important While this is the easiest to add to your app, there are two challenges:
 * - The user needs to be able to write to the Yjs document to store the information.
 *   So a user without write access to the Yjs document cannot leave any comments.
 * - Even with write access, the operations are not secure. Unless your Yjs server
 *   guards against malicious operations, it's technically possible for one user to make changes to another user's comments, etc.
 *   (even though these options are not visible in the UI, a malicious user can make unauthorized changes to the underlying Yjs document)
 */
export declare class YjsThreadStore extends YjsThreadStoreBase {
    private readonly userId;
    constructor(userId: string, threadsYMap: Y.Map<any>, auth: ThreadStoreAuth);
    private transact;
    createThread: (options: {
        initialComment: {
            body: CommentBody;
            metadata?: any;
        };
        metadata?: any;
    }) => Promise<ThreadData>;
    addThreadToDocument: undefined;
    addComment: (options: {
        comment: {
            body: CommentBody;
            metadata?: any;
        };
        threadId: string;
    }) => Promise<{
        type: "comment";
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        reactions: import("../../types.js").CommentReactionData[];
        metadata: any;
    } & {
        deletedAt?: never;
        body: CommentBody;
    }>;
    updateComment: (options: {
        comment: {
            body: CommentBody;
            metadata?: any;
        };
        threadId: string;
        commentId: string;
    }) => Promise<void>;
    deleteComment: (options: {
        threadId: string;
        commentId: string;
        softDelete?: boolean;
    }) => Promise<void>;
    deleteThread: (options: {
        threadId: string;
    }) => Promise<void>;
    resolveThread: (options: {
        threadId: string;
    }) => Promise<void>;
    unresolveThread: (options: {
        threadId: string;
    }) => Promise<void>;
    addReaction: (options: {
        threadId: string;
        commentId: string;
        emoji: string;
    }) => Promise<void>;
    deleteReaction: (options: {
        threadId: string;
        commentId: string;
        emoji: string;
    }) => Promise<void>;
}
