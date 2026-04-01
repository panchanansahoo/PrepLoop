import type { BlockNoteEditor } from "../../../../editor/BlockNoteEditor.js";
import { BlockConfig, BlockFromConfigNoChildren } from "../../../../schema/index.js";
export declare const createAddFileButton: (block: BlockFromConfigNoChildren<BlockConfig<string, any, "none">, any, any>, editor: BlockNoteEditor<any, any, any>, buttonIcon?: HTMLElement) => {
    dom: HTMLDivElement;
    destroy: () => void;
};
