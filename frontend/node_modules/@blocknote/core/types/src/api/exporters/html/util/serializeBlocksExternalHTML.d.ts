import { DOMSerializer } from "prosemirror-model";
import { PartialBlock } from "../../../../blocks/defaultBlocks.js";
import type { BlockNoteEditor } from "../../../../editor/BlockNoteEditor.js";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../../../schema/index.js";
export declare function serializeInlineContentExternalHTML<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(editor: BlockNoteEditor<any, I, S>, blockContent: PartialBlock<BSchema, I, S>["content"], serializer: DOMSerializer, options?: {
    document?: Document;
}): DocumentFragment;
export declare const serializeBlocksExternalHTML: <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(editor: BlockNoteEditor<BSchema, I, S>, blocks: PartialBlock<BSchema, I, S>[], serializer: DOMSerializer, orderedListItemBlockTypes: Set<string>, unorderedListItemBlockTypes: Set<string>, options?: {
    document?: Document;
}) => DocumentFragment;
