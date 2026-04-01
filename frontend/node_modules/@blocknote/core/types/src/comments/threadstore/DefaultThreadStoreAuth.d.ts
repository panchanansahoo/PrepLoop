import { CommentData, ThreadData } from "../types.js";
import { ThreadStoreAuth } from "./ThreadStoreAuth.js";
export declare class DefaultThreadStoreAuth extends ThreadStoreAuth {
    private readonly userId;
    private readonly role;
    constructor(userId: string, role: "comment" | "editor");
    /**
     * Auth: should be possible by anyone with comment access
     */
    canCreateThread(): boolean;
    /**
     * Auth: should be possible by anyone with comment access
     */
    canAddComment(_thread: ThreadData): boolean;
    /**
     * Auth: should only be possible by the comment author
     */
    canUpdateComment(comment: CommentData): boolean;
    /**
     * Auth: should be possible by the comment author OR an editor of the document
     */
    canDeleteComment(comment: CommentData): boolean;
    /**
     * Auth: should only be possible by an editor of the document
     */
    canDeleteThread(_thread: ThreadData): boolean;
    /**
     * Auth: should be possible by anyone with comment access
     */
    canResolveThread(_thread: ThreadData): boolean;
    /**
     * Auth: should be possible by anyone with comment access
     */
    canUnresolveThread(_thread: ThreadData): boolean;
    /**
     * Auth: should be possible by anyone with comment access
     *
     * Note: will also check if the user has already reacted with the same emoji. TBD: is that a nice design or should this responsibility be outside of auth?
     */
    canAddReaction(comment: CommentData, emoji?: string): boolean;
    /**
     * Auth: should be possible by anyone with comment access
     *
     * Note: will also check if the user has already reacted with the same emoji. TBD: is that a nice design or should this responsibility be outside of auth?
     */
    canDeleteReaction(comment: CommentData, emoji?: string): boolean;
}
