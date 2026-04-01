import { Fragment } from "@tiptap/pm/model";
import { BlockNoDefaults, BlockSchema, InlineContentSchema, StyleSchema } from "../../schema/index.js";
/**
 * Converts all Blocks within a fragment to BlockNote blocks.
 */
export declare function fragmentToBlocks<B extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(fragment: Fragment): BlockNoDefaults<B, I, S>[];
