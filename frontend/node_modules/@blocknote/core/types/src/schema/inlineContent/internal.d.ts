import { KeyboardShortcutCommand, Node } from "@tiptap/core";
import { PropSchema, Props } from "../propTypes.js";
import { CustomInlineContentConfig, InlineContentImplementation, InlineContentSchemaFromSpecs, InlineContentSpec, InlineContentSpecs } from "./types.js";
export declare function addInlineContentAttributes<IType extends string, PSchema extends PropSchema>(element: {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
}, inlineContentType: IType, inlineContentProps: Props<PSchema>, propSchema: PSchema): {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
};
export declare function addInlineContentKeyboardShortcuts<T extends CustomInlineContentConfig>(config: T): {
    [p: string]: KeyboardShortcutCommand;
};
export declare function createInternalInlineContentSpec<const T extends CustomInlineContentConfig>(config: T, implementation: InlineContentImplementation<NoInfer<T>>): InlineContentSpec<T>;
export declare function createInlineContentSpecFromTipTapNode<T extends Node, P extends PropSchema>(node: T, propSchema: P, implementation: Omit<InlineContentImplementation<CustomInlineContentConfig>, "node">): InlineContentSpec<{
    readonly type: T["name"];
    readonly propSchema: P;
    readonly content: "none" | "styled";
}>;
export declare function getInlineContentSchemaFromSpecs<T extends InlineContentSpecs>(specs: T): InlineContentSchemaFromSpecs<T>;
