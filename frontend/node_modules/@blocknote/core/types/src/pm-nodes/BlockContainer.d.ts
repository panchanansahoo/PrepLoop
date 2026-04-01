import { Node } from "@tiptap/core";
import type { BlockNoteEditor } from "../editor/BlockNoteEditor.js";
import { BlockNoteDOMAttributes } from "../schema/index.js";
/**
 * The main "Block node" documents consist of
 */
export declare const BlockContainer: Node<{
    domAttributes?: BlockNoteDOMAttributes;
    editor: BlockNoteEditor<any, any, any>;
}, any>;
