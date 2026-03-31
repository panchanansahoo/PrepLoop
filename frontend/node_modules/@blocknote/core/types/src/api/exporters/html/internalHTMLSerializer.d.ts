import { Schema } from "prosemirror-model";
import { PartialBlock } from "../../../blocks/defaultBlocks.js";
import type { BlockNoteEditor } from "../../../editor/BlockNoteEditor.js";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../../schema/index.js";
export declare const createInternalHTMLSerializer: <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(schema: Schema, editor: BlockNoteEditor<BSchema, I, S>) => {
    serializeBlocks: (blocks: PartialBlock<BSchema, I, S>[], options: {
        document?: Document;
    }) => string;
};
