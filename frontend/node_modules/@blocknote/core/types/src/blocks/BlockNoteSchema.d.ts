import { BlockSchema, BlockSchemaFromSpecs, BlockSpecs, CustomBlockNoteSchema, InlineContentSchema, InlineContentSchemaFromSpecs, InlineContentSpecs, StyleSchema, StyleSchemaFromSpecs, StyleSpecs } from "../schema/index.js";
import { defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from "./defaultBlocks.js";
export declare class BlockNoteSchema<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema> extends CustomBlockNoteSchema<BSchema, ISchema, SSchema> {
    static create<BSpecs extends BlockSpecs | undefined = undefined, ISpecs extends InlineContentSpecs | undefined = undefined, SSpecs extends StyleSpecs | undefined = undefined>(options?: {
        /**
         * A list of custom block types that should be available in the editor.
         */
        blockSpecs?: BSpecs;
        /**
         * A list of custom InlineContent types that should be available in the editor.
         */
        inlineContentSpecs?: ISpecs;
        /**
         * A list of custom Styles that should be available in the editor.
         */
        styleSpecs?: SSpecs;
    }): BlockNoteSchema<BSpecs extends undefined ? BlockSchemaFromSpecs<typeof defaultBlockSpecs> : BlockSchemaFromSpecs<NonNullable<BSpecs>>, ISpecs extends undefined ? InlineContentSchemaFromSpecs<typeof defaultInlineContentSpecs> : InlineContentSchemaFromSpecs<NonNullable<ISpecs>>, SSpecs extends undefined ? StyleSchemaFromSpecs<typeof defaultStyleSpecs> : StyleSchemaFromSpecs<NonNullable<SSpecs>>>;
}
