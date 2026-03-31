import { BlockNoteEditor, CustomInlineContentConfig, CustomInlineContentImplementation, InlineContentFromConfig, InlineContentSchemaWithInlineContent, InlineContentSpec, PartialCustomInlineContentFromConfig, Props, PropSchema, StyleSchema } from "@blocknote/core";
import { FC, JSX } from "react";
export type ReactCustomInlineContentRenderProps<T extends CustomInlineContentConfig, S extends StyleSchema> = {
    inlineContent: InlineContentFromConfig<T, S>;
    updateInlineContent: (update: PartialCustomInlineContentFromConfig<T, S>) => void;
    editor: BlockNoteEditor<any, InlineContentSchemaWithInlineContent<T["type"], T>, S>;
    contentRef: (node: HTMLElement | null) => void;
};
export type ReactInlineContentImplementation<T extends CustomInlineContentConfig, S extends StyleSchema> = {
    render: FC<ReactCustomInlineContentRenderProps<T, S>>;
    toExternalHTML?: FC<ReactCustomInlineContentRenderProps<T, S>>;
} & Omit<CustomInlineContentImplementation<T, S>, "render" | "toExternalHTML">;
export declare function InlineContentWrapper<IType extends string, PSchema extends PropSchema>(props: {
    children: JSX.Element;
    inlineContentType: IType;
    inlineContentProps: Props<PSchema>;
    propSchema: PSchema;
}): import("react/jsx-runtime").JSX.Element;
export declare function createReactInlineContentSpec<const T extends CustomInlineContentConfig, S extends StyleSchema>(inlineContentConfig: T, inlineContentImplementation: ReactInlineContentImplementation<T, S>): InlineContentSpec<T>;
