import { TagParseRule } from "@tiptap/pm/model";
import type { BlockNoteEditor } from "../../editor/BlockNoteEditor.js";
import { Props } from "../propTypes.js";
import { StyleSchema } from "../styles/types.js";
import { CustomInlineContentConfig, InlineContentFromConfig, InlineContentSpec, PartialCustomInlineContentFromConfig } from "./types.js";
export type CustomInlineContentImplementation<T extends CustomInlineContentConfig, S extends StyleSchema> = {
    meta?: {
        draggable?: boolean;
    };
    /**
     * Parses an external HTML element into a inline content of this type when it returns the block props object, otherwise undefined
     */
    parse?: (el: HTMLElement) => Partial<Props<T["propSchema"]>> | undefined;
    /**
     * Renders an inline content to DOM elements
     */
    render: (
    /**
     * The custom inline content to render
     */
    inlineContent: InlineContentFromConfig<T, S>, 
    /**
     * A callback that allows overriding the inline content element
     */
    updateInlineContent: (update: PartialCustomInlineContentFromConfig<T, S>) => void, 
    /**
     * The BlockNote editor instance
     * This is typed generically. If you want an editor with your custom schema, you need to
     * cast it manually, e.g.: `const e = editor as BlockNoteEditor<typeof mySchema>;`
     */
    editor: BlockNoteEditor<any, any, S>) => {
        dom: HTMLElement;
        contentDOM?: HTMLElement;
        destroy?: () => void;
    };
    /**
     * Renders an inline content to external HTML elements for use outside the editor
     * If not provided, falls back to the render method
     */
    toExternalHTML?: (
    /**
     * The custom inline content to render
     */
    inlineContent: InlineContentFromConfig<T, S>, 
    /**
     * The BlockNote editor instance
     * This is typed generically. If you want an editor with your custom schema, you need to
     * cast it manually, e.g.: `const e = editor as BlockNoteEditor<typeof mySchema>;`
     */
    editor: BlockNoteEditor<any, any, S>) => {
        dom: HTMLElement | DocumentFragment;
        contentDOM?: HTMLElement;
    } | undefined;
    runsBefore?: string[];
};
export declare function getInlineContentParseRules<C extends CustomInlineContentConfig>(config: C, customParseFunction?: CustomInlineContentImplementation<C, any>["parse"]): TagParseRule[];
export declare function createInlineContentSpec<T extends CustomInlineContentConfig, S extends StyleSchema>(inlineContentConfig: T, inlineContentImplementation: CustomInlineContentImplementation<T, S>): InlineContentSpec<T>;
