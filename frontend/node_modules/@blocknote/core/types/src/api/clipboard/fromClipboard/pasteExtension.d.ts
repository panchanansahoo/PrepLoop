import { Extension } from "@tiptap/core";
import type { BlockNoteEditor, BlockNoteEditorOptions } from "../../../editor/BlockNoteEditor";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../../schema/index.js";
export declare const createPasteFromClipboardExtension: <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(editor: BlockNoteEditor<BSchema, I, S>, pasteHandler: Exclude<BlockNoteEditorOptions<any, any, any>["pasteHandler"], undefined>) => Extension<any, any>;
