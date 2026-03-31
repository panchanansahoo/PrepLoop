import { Node } from "prosemirror-model";
import type { Transaction } from "prosemirror-state";
export declare function insertContentAt(tr: Transaction, position: number | {
    from: number;
    to: number;
}, nodes: Node[], options?: {
    updateSelection: boolean;
}): boolean;
