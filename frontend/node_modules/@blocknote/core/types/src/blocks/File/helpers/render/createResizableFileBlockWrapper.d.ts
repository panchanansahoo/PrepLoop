import type { BlockNoteEditor } from "../../../../editor/BlockNoteEditor.js";
import { BlockConfig, BlockFromConfigNoChildren } from "../../../../schema/index.js";
export declare const createResizableFileBlockWrapper: (block: BlockFromConfigNoChildren<BlockConfig<string, {
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
    previewWidth?: {
        default: number;
    };
    textAlignment?: {
        default: "left";
    };
}, "none">, any, any>, editor: BlockNoteEditor<any, any, any>, element: {
    dom: HTMLElement;
    destroy?: () => void;
}, resizeHandlesContainerElement: HTMLElement, buttonIcon?: HTMLElement) => {
    dom: HTMLElement;
    destroy: () => void;
};
