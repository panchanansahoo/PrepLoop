import { BlockNoteEditor, BlockNoteEditorOptions, CustomBlockNoteSchema, DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema } from "@blocknote/core";
import { DependencyList } from "react";
/**
 * Hook to instantiate a BlockNote Editor instance in React
 */
export declare const useCreateBlockNote: <Options extends Partial<BlockNoteEditorOptions<any, any, any>> | undefined>(options?: Options, deps?: DependencyList) => Options extends {
    schema: CustomBlockNoteSchema<infer BSchema, infer ISchema, infer SSchema>;
} ? BlockNoteEditor<BSchema, ISchema, SSchema> : BlockNoteEditor<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema>;
