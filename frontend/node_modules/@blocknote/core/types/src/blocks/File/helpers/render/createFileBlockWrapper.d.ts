import type { BlockNoteEditor } from "../../../../editor/BlockNoteEditor.js";
import { BlockConfig, BlockFromConfigNoChildren } from "../../../../schema/index.js";
export declare const createFileBlockWrapper: (block: BlockFromConfigNoChildren<BlockConfig<string, {
    backgroundColor: {
        default: "default";
    };
    name: {
        default: "";
    };
    url: {
        default: "";
    };
    caption: {
        default: "";
    };
    showPreview?: {
        default: true;
    };
}, "none">, any, any>, editor: BlockNoteEditor<any, any, any>, element?: {
    dom: HTMLElement;
    destroy?: () => void;
}, buttonIcon?: HTMLElement) => {
    dom: HTMLElement;
    destroy?: () => void;
};
