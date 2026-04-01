import { Plugin } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
/**
 * This plugin adds decorations to numbered list items to display their index.
 */
export declare const NumberedListIndexingDecorationPlugin: () => Plugin<{
    decorations: DecorationSet;
}>;
