import { BlockNoteEditor } from "../../editor/BlockNoteEditor.js";
import { DefaultSuggestionItem } from "../../extensions/SuggestionMenu/DefaultSuggestionItem.js";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../schema/index.js";
import { createPageBreakBlockConfig } from "./block.js";
export declare function checkPageBreakBlocksInSchema<I extends InlineContentSchema, S extends StyleSchema>(editor: BlockNoteEditor<any, I, S>): editor is BlockNoteEditor<{
    pageBreak: ReturnType<typeof createPageBreakBlockConfig>;
}, I, S>;
export declare function getPageBreakSlashMenuItems<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(editor: BlockNoteEditor<BSchema, I, S>): (Omit<DefaultSuggestionItem, "key"> & {
    key: "page_break";
})[];
