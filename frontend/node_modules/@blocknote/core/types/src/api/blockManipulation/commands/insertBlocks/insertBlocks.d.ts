import type { Transaction } from "prosemirror-state";
import { Block, PartialBlock } from "../../../../blocks/defaultBlocks.js";
import { BlockIdentifier, BlockSchema, InlineContentSchema, StyleSchema } from "../../../../schema/index.js";
export declare function insertBlocks<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(tr: Transaction, blocksToInsert: PartialBlock<BSchema, I, S>[], referenceBlock: BlockIdentifier, placement?: "before" | "after"): Block<BSchema, I, S>[];
