import { Schema } from "prosemirror-model";
import { Block } from "../../../blocks/defaultBlocks.js";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../../schema/index.js";
export declare function markdownToHTML(markdown: string): string;
export declare function markdownToBlocks<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(markdown: string, pmSchema: Schema): Block<BSchema, I, S>[];
