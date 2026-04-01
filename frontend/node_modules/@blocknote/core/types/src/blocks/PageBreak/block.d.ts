import { BlockSchema, InlineContentSchema, StyleSchema } from "../../schema/index.js";
import { BlockNoteSchema } from "../BlockNoteSchema.js";
export type PageBreakBlockConfig = ReturnType<typeof createPageBreakBlockConfig>;
export declare const createPageBreakBlockConfig: () => import("../../index.js").BlockConfig<"pageBreak", {}, "none">;
export declare const createPageBreakBlockSpec: (options?: Partial<Partial<Record<string, any>>> | undefined) => import("../../index.js").BlockSpec<"pageBreak", {}, "none">;
/**
 * Adds page break support to the given schema.
 */
export declare const withPageBreak: <B extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(schema: BlockNoteSchema<B, I, S>) => import("../../index.js").CustomBlockNoteSchema<B & {
    pageBreak: import("../../index.js").BlockConfig<"pageBreak", {}, "none">;
}, I, S>;
