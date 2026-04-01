import { Block, DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema, PartialBlock } from "../../blocks/defaultBlocks.js";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../schema/index.js";
import { BlockNoteEditor } from "../BlockNoteEditor.js";
export declare class ExportManager<BSchema extends BlockSchema = DefaultBlockSchema, ISchema extends InlineContentSchema = DefaultInlineContentSchema, SSchema extends StyleSchema = DefaultStyleSchema> {
    private editor;
    constructor(editor: BlockNoteEditor<BSchema, ISchema, SSchema>);
    /**
     * Exports blocks into a simplified HTML string. To better conform to HTML standards, children of blocks which aren't list
     * items are un-nested in the output HTML.
     *
     * @param blocks An array of blocks that should be serialized into HTML.
     * @returns The blocks, serialized as an HTML string.
     */
    blocksToHTMLLossy(blocks?: PartialBlock<BSchema, ISchema, SSchema>[]): string;
    /**
     * Serializes blocks into an HTML string in the format that would normally be rendered by the editor.
     *
     * Use this method if you want to server-side render HTML (for example, a blog post that has been edited in BlockNote)
     * and serve it to users without loading the editor on the client (i.e.: displaying the blog post)
     *
     * @param blocks An array of blocks that should be serialized into HTML.
     * @returns The blocks, serialized as an HTML string.
     */
    blocksToFullHTML(blocks?: PartialBlock<BSchema, ISchema, SSchema>[]): string;
    /**
     * Parses blocks from an HTML string. Tries to create `Block` objects out of any HTML block-level elements, and
     * `InlineNode` objects from any HTML inline elements, though not all element types are recognized. If BlockNote
     * doesn't recognize an HTML element's tag, it will parse it as a paragraph or plain text.
     * @param html The HTML string to parse blocks from.
     * @returns The blocks parsed from the HTML string.
     */
    tryParseHTMLToBlocks(html: string): Block<BSchema, ISchema, SSchema>[];
    /**
     * Serializes blocks into a Markdown string. The output is simplified as Markdown does not support all features of
     * BlockNote - children of blocks which aren't list items are un-nested and certain styles are removed.
     * @param blocks An array of blocks that should be serialized into Markdown.
     * @returns The blocks, serialized as a Markdown string.
     */
    blocksToMarkdownLossy(blocks?: PartialBlock<BSchema, ISchema, SSchema>[]): string;
    /**
     * Creates a list of blocks from a Markdown string. Tries to create `Block` and `InlineNode` objects based on
     * Markdown syntax, though not all symbols are recognized. If BlockNote doesn't recognize a symbol, it will parse it
     * as text.
     * @param markdown The Markdown string to parse blocks from.
     * @returns The blocks parsed from the Markdown string.
     */
    tryParseMarkdownToBlocks(markdown: string): Block<BSchema, ISchema, SSchema>[];
    /**
     * Paste HTML into the editor. Defaults to converting HTML to BlockNote HTML.
     * @param html The HTML to paste.
     * @param raw Whether to paste the HTML as is, or to convert it to BlockNote HTML.
     */
    pasteHTML(html: string, raw?: boolean): void;
    /**
     * Paste text into the editor. Defaults to interpreting text as markdown.
     * @param text The text to paste.
     */
    pasteText(text: string): boolean;
    /**
     * Paste markdown into the editor.
     * @param markdown The markdown to paste.
     */
    pasteMarkdown(markdown: string): void;
}
