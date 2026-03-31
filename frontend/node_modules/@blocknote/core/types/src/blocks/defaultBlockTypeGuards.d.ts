import { CellSelection } from "prosemirror-tables";
import type { BlockNoteEditor } from "../editor/BlockNoteEditor.js";
import { BlockConfig, PropSchema, PropSpec } from "../schema/index.js";
import { Block } from "./defaultBlocks.js";
import { Selection } from "prosemirror-state";
export declare function editorHasBlockWithType<BType extends string, Props extends PropSchema | Record<string, "boolean" | "number" | "string"> | undefined = undefined>(editor: BlockNoteEditor<any, any, any>, blockType: BType, props?: Props): editor is BlockNoteEditor<{
    [BT in BType]: Props extends PropSchema ? BlockConfig<BT, Props> : Props extends Record<string, "boolean" | "number" | "string"> ? BlockConfig<BT, {
        [PN in keyof Props]: {
            default: undefined;
            type: Props[PN];
            values?: any[];
        };
    }> : BlockConfig<BT, PropSchema>;
}, any, any>;
export declare function blockHasType<BType extends string, Props extends PropSchema | Record<string, "boolean" | "number" | "string"> | undefined = undefined>(block: Block<any, any, any>, editor: BlockNoteEditor<any, any, any>, blockType: BType, props?: Props): block is Block<{
    [BT in BType]: Props extends PropSchema ? BlockConfig<BT, Props> : Props extends Record<string, "boolean" | "number" | "string"> ? BlockConfig<BT, {
        [PN in keyof Props]: PropSpec<Props[PN] extends "boolean" ? boolean : Props[PN] extends "number" ? number : Props[PN] extends "string" ? string : never>;
    }> : BlockConfig<BT, PropSchema>;
}, any, any>;
export declare function isTableCellSelection(selection: Selection): selection is CellSelection;
