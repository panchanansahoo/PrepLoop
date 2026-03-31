import type { BlockNoteEditor } from "../editor/BlockNoteEditor.js";
import type { BlockNoDefaults, BlockSchema, InlineContentSchema, StyleSchema } from "../schema/index.js";
export declare function createDefaultBlockDOMOutputSpec(blockName: string, htmlTag: string, blockContentHTMLAttributes: Record<string, string>, inlineContentHTMLAttributes: Record<string, string>): {
    dom: HTMLDivElement;
    contentDOM: HTMLElement;
};
export declare const defaultBlockToHTML: <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(block: BlockNoDefaults<BSchema, I, S>, editor: BlockNoteEditor<BSchema, I, S>) => {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
};
export declare function mergeParagraphs(element: HTMLElement, separator?: string): void;
