import type { HighlighterGeneric } from "@shikijs/types";
export type CodeBlockOptions = {
    /**
     * Whether to indent lines with a tab when the user presses `Tab` in a code block.
     *
     * @default true
     */
    indentLineWithTab?: boolean;
    /**
     * The default language to use for code blocks.
     *
     * @default "text"
     */
    defaultLanguage?: string;
    /**
     * The languages that are supported in the editor.
     *
     * @example
     * {
     *   javascript: {
     *     name: "JavaScript",
     *     aliases: ["js"],
     *   },
     *   typescript: {
     *     name: "TypeScript",
     *     aliases: ["ts"],
     *   },
     * }
     */
    supportedLanguages?: Record<string, {
        /**
         * The display name of the language.
         */
        name: string;
        /**
         * Aliases for this language.
         */
        aliases?: string[];
    }>;
    /**
     * The highlighter to use for code blocks.
     */
    createHighlighter?: () => Promise<HighlighterGeneric<any, any>>;
};
export type CodeBlockConfig = ReturnType<typeof createCodeBlockConfig>;
export declare const createCodeBlockConfig: (options: CodeBlockOptions) => import("../../index.js").BlockConfig<"codeBlock", {
    readonly language: {
        readonly default: string;
    };
}, "inline">;
export declare const createCodeBlockSpec: (options?: Partial<{
    indentLineWithTab: boolean;
    defaultLanguage: string;
    supportedLanguages: Record<string, {
        /**
         * The display name of the language.
         */
        name: string;
        /**
         * Aliases for this language.
         */
        aliases?: string[];
    }>;
    createHighlighter: () => Promise<HighlighterGeneric<any, any>>;
}> | undefined) => import("../../index.js").BlockSpec<"codeBlock", {
    readonly language: {
        readonly default: string;
    };
}, "inline">;
export declare function getLanguageId(options: CodeBlockOptions, languageName: string): string | undefined;
