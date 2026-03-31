import { Extension } from "@tiptap/core";
import type { BlockNoteEditor } from "../../../editor/BlockNoteEditor.js";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../../schema/index.js";
export declare const createDropFileExtension: <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(editor: BlockNoteEditor<BSchema, I, S>) => Extension<{
    editor: BlockNoteEditor<BSchema, I, S>;
}, undefined>;
