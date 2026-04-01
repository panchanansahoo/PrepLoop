import { DOMSerializer } from "prosemirror-model";
import { PartialBlock } from "../../../../blocks/defaultBlocks.js";
import type { BlockNoteEditor } from "../../../../editor/BlockNoteEditor.js";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../../../schema/index.js";
export declare function serializeInlineContentInternalHTML<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(editor: BlockNoteEditor<any, I, S>, blockContent: PartialBlock<BSchema, I, S>["content"], serializer: DOMSerializer, blockType?: string, options?: {
    document?: Document;
}): DocumentFragment;
export declare const serializeBlocksInternalHTML: <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(editor: BlockNoteEditor<BSchema, I, S>, blocks: PartialBlock<BSchema, I, S>[], serializer: DOMSerializer, options?: {
    document?: Document;
}) => HTMLElement;
