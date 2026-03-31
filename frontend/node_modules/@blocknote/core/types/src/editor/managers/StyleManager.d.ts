import { BlockSchema, InlineContentSchema, PartialInlineContent, StyleSchema, Styles } from "../../schema/index.js";
import { DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema } from "../../blocks/defaultBlocks.js";
import { BlockNoteEditor } from "../BlockNoteEditor.js";
export declare class StyleManager<BSchema extends BlockSchema = DefaultBlockSchema, ISchema extends InlineContentSchema = DefaultInlineContentSchema, SSchema extends StyleSchema = DefaultStyleSchema> {
    private editor;
    constructor(editor: BlockNoteEditor<BSchema, ISchema, SSchema>);
    /**
     * Insert a piece of content at the current cursor position.
     *
     * @param content can be a string, or array of partial inline content elements
     */
    insertInlineContent(content: PartialInlineContent<ISchema, SSchema>, { updateSelection }?: {
        updateSelection?: boolean;
    }): void;
    /**
     * Gets the active text styles at the text cursor position or at the end of the current selection if it's active.
     */
    getActiveStyles(): Styles<SSchema>;
    /**
     * Adds styles to the currently selected content.
     * @param styles The styles to add.
     */
    addStyles(styles: Styles<SSchema>): void;
    /**
     * Removes styles from the currently selected content.
     * @param styles The styles to remove.
     */
    removeStyles(styles: Styles<SSchema>): void;
    /**
     * Toggles styles on the currently selected content.
     * @param styles The styles to toggle.
     */
    toggleStyles(styles: Styles<SSchema>): void;
    /**
     * Gets the currently selected text.
     */
    getSelectedText(): string;
    /**
     * Gets the URL of the last link in the current selection, or `undefined` if there are no links in the selection.
     */
    getSelectedLinkUrl(): string | undefined;
    /**
     * Creates a new link to replace the selected content.
     * @param url The link URL.
     * @param text The text to display the link with.
     */
    createLink(url: string, text?: string): void;
}
