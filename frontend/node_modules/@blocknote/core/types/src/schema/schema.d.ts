import { BlockNoteEditor } from "../editor/BlockNoteEditor.js";
import { BlockNoDefaults, BlockSchema, BlockSpecs, InlineContentConfig, InlineContentSchema, InlineContentSpec, InlineContentSpecs, LooseBlockSpec, PartialBlockNoDefaults, StyleSchema, StyleSpecs } from "./index.js";
export declare class CustomBlockNoteSchema<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema> {
    private opts;
    readonly BlockNoteEditor: BlockNoteEditor<BSchema, ISchema, SSchema>;
    readonly Block: BlockNoDefaults<BSchema, ISchema, SSchema>;
    readonly PartialBlock: PartialBlockNoDefaults<BSchema, ISchema, SSchema>;
    inlineContentSpecs: InlineContentSpecs;
    styleSpecs: StyleSpecs;
    blockSpecs: {
        [K in keyof BSchema]: K extends string ? LooseBlockSpec<K, BSchema[K]["propSchema"], BSchema[K]["content"]> : never;
    };
    blockSchema: BSchema;
    inlineContentSchema: ISchema;
    styleSchema: SSchema;
    constructor(opts: {
        blockSpecs: BlockSpecs;
        inlineContentSpecs: InlineContentSpecs;
        styleSpecs: StyleSpecs;
    });
    private init;
    /**
     * Adds additional block specs to the current schema in a builder pattern.
     * This method allows extending the schema after it has been created.
     *
     * @param additionalBlockSpecs - Additional block specs to add to the schema
     * @returns The current schema instance for chaining
     */
    extend<AdditionalBlockSpecs extends BlockSpecs = Record<string, never>, AdditionalInlineContentSpecs extends Record<string, InlineContentSpec<InlineContentConfig>> = Record<string, never>, AdditionalStyleSpecs extends StyleSpecs = Record<string, never>>(opts: {
        blockSpecs?: AdditionalBlockSpecs;
        inlineContentSpecs?: AdditionalInlineContentSpecs;
        styleSpecs?: AdditionalStyleSpecs;
    }): CustomBlockNoteSchema<AdditionalBlockSpecs extends undefined | Record<string, never> ? BSchema : BSchema & {
        [K in keyof AdditionalBlockSpecs]: K extends string ? AdditionalBlockSpecs[K]["config"] : never;
    }, AdditionalInlineContentSpecs extends undefined | Record<string, never> ? ISchema : ISchema & {
        [K in keyof AdditionalInlineContentSpecs]: AdditionalInlineContentSpecs[K]["config"];
    }, AdditionalStyleSpecs extends undefined | Record<string, never> ? SSchema : SSchema & {
        [K in keyof AdditionalStyleSpecs]: AdditionalStyleSpecs[K]["config"];
    }>;
}
