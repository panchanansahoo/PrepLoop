import * as Y from "yjs";
import { CommentBody } from "../../types.js";
import { ThreadStoreAuth } from "../ThreadStoreAuth.js";
import { YjsThreadStoreBase } from "./YjsThreadStoreBase.js";
/**
 * This is a REST-based implementation of the YjsThreadStoreBase.
 * It Reads data directly from the underlying document (same as YjsThreadStore),
 * but for Writes, it sends data to a REST API that should:
 * - check the user has the correct permissions to make the desired changes
 * - apply the updates to the underlying Yjs document
 *
 * (see https://github.com/TypeCellOS/BlockNote-demo-nextjs-hocuspocus)
 *
 * The reason we still use the Yjs document as underlying storage is that it makes it easy to
 * sync updates in real-time to other collaborators.
 * (but technically, you could also implement a different storage altogether
 * and not store the thread related data in the Yjs document)
 */
export declare class RESTYjsThreadStore extends YjsThreadStoreBase {
    private readonly BASE_URL;
    private readonly headers;
    constructor(BASE_URL: string, headers: Record<string, string>, threadsYMap: Y.Map<any>, auth: ThreadStoreAuth);
    private doRequest;
    addThreadToDocument: (options: {
        threadId: string;
        selection: {
            prosemirror: {
                head: number;
                anchor: number;
            };
            yjs: {
                head: any;
                anchor: any;
            };
        };
    }) => Promise<any>;
    createThread: (options: {
        initialComment: {
            body: CommentBody;
            metadata?: any;
        };
        metadata?: any;
    }) => Promise<any>;
    addComment: (options: {
        comment: {
            body: CommentBody;
            metadata?: any;
        };
        threadId: string;
    }) => Promise<any>;
    updateComment: (options: {
        comment: {
            body: CommentBody;
            metadata?: any;
        };
        threadId: string;
        commentId: string;
    }) => Promise<any>;
    deleteComment: (options: {
        threadId: string;
        commentId: string;
        softDelete?: boolean;
    }) => Promise<any>;
    deleteThread: (options: {
        threadId: string;
    }) => Promise<any>;
    resolveThread: (options: {
        threadId: string;
    }) => Promise<any>;
    unresolveThread: (options: {
        threadId: string;
    }) => Promise<any>;
    addReaction: (options: {
        threadId: string;
        commentId: string;
        emoji: string;
    }) => Promise<any>;
    deleteReaction: (options: {
        threadId: string;
        commentId: string;
        emoji: string;
    }) => Promise<any>;
}
