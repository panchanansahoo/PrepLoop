import type { Transaction } from "prosemirror-state";
import { Block, DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema } from "../blocks/defaultBlocks.js";
import type { BlockSchema } from "../schema/index.js";
import type { InlineContentSchema } from "../schema/inlineContent/types.js";
import type { StyleSchema } from "../schema/styles/types.js";
/**
 * This attributes the changes to a specific source.
 */
export type BlockChangeSource = {
    type: "local";
} | {
    type: "paste";
} | {
    type: "drop";
} | {
    type: "undo" | "redo" | "undo-redo";
} | {
    type: "yjs-remote";
};
export type BlocksChanged<BSchema extends BlockSchema = DefaultBlockSchema, ISchema extends InlineContentSchema = DefaultInlineContentSchema, SSchema extends StyleSchema = DefaultStyleSchema> = Array<{
    /**
     * The affected block.
     */
    block: Block<BSchema, ISchema, SSchema>;
    /**
     * The source of the change.
     */
    source: BlockChangeSource;
} & ({
    type: "insert" | "delete";
    /**
     * Insert and delete changes don't have a previous block.
     */
    prevBlock: undefined;
} | {
    type: "update";
    /**
     * The previous block.
     */
    prevBlock: Block<BSchema, ISchema, SSchema>;
} | {
    type: "move";
    /**
     * The affected block.
     */
    block: Block<BSchema, ISchema, SSchema>;
    /**
     * The block before the move.
     */
    prevBlock: Block<BSchema, ISchema, SSchema>;
    /**
     * The previous parent block (if it existed).
     */
    prevParent?: Block<BSchema, ISchema, SSchema>;
    /**
     * The current parent block (if it exists).
     */
    currentParent?: Block<BSchema, ISchema, SSchema>;
})>;
/**
 * Get the blocks that were changed by a transaction.
 */
export declare function getBlocksChangedByTransaction<BSchema extends BlockSchema = DefaultBlockSchema, ISchema extends InlineContentSchema = DefaultInlineContentSchema, SSchema extends StyleSchema = DefaultStyleSchema>(transaction: Transaction, appendedTransactions?: Transaction[]): BlocksChanged<BSchema, ISchema, SSchema>;
