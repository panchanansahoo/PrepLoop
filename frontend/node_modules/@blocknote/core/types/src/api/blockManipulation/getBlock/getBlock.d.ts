import type { Node } from "prosemirror-model";
import type { Block } from "../../../blocks/defaultBlocks.js";
import type { BlockIdentifier, BlockSchema, InlineContentSchema, StyleSchema } from "../../../schema/index.js";
export declare function getBlock<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(doc: Node, blockIdentifier: BlockIdentifier): Block<BSchema, I, S> | undefined;
export declare function getPrevBlock<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(doc: Node, blockIdentifier: BlockIdentifier): Block<BSchema, I, S> | undefined;
export declare function getNextBlock<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(doc: Node, blockIdentifier: BlockIdentifier): Block<BSchema, I, S> | undefined;
export declare function getParentBlock<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(doc: Node, blockIdentifier: BlockIdentifier): Block<BSchema, I, S> | undefined;
