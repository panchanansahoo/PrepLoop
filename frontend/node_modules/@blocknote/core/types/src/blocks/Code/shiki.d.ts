import { CodeBlockOptions } from "./block.js";
export declare const shikiParserSymbol: unique symbol;
export declare const shikiHighlighterPromiseSymbol: unique symbol;
export declare function lazyShikiPlugin(options: CodeBlockOptions): import("prosemirror-state").Plugin<import("prosemirror-highlight").HighlightPluginState>;
