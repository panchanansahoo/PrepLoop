import * as Y from "yjs";
import { ThreadData } from "../../types.js";
import { ThreadStore } from "../ThreadStore.js";
import { ThreadStoreAuth } from "../ThreadStoreAuth.js";
/**
 * This is an abstract class that only implements the READ methods required by the ThreadStore interface.
 * The data is read from a Yjs Map.
 */
export declare abstract class YjsThreadStoreBase extends ThreadStore {
    protected readonly threadsYMap: Y.Map<any>;
    constructor(threadsYMap: Y.Map<any>, auth: ThreadStoreAuth);
    getThread(threadId: string): ThreadData;
    getThreads(): Map<string, ThreadData>;
    subscribe(cb: (threads: Map<string, ThreadData>) => void): () => void;
}
