import * as Y from "yjs";
import { CommentData, ThreadData } from "../../types.js";
export declare function commentToYMap(comment: CommentData): Y.Map<any>;
export declare function threadToYMap(thread: ThreadData): Y.Map<unknown>;
type SingleUserCommentReactionData = {
    emoji: string;
    createdAt: Date;
    userId: string;
};
export declare function yMapToReaction(yMap: Y.Map<any>): SingleUserCommentReactionData;
export declare function yMapToComment(yMap: Y.Map<any>): CommentData;
export declare function yMapToThread(yMap: Y.Map<any>): ThreadData;
export {};
