import { BlockNoteEditor, BlockSchema, InlineContentSchema, StyleSchema } from "@blocknote/core";
import React, { HTMLAttributes, ReactNode, Ref } from "react";
import { BlockNoteDefaultUIProps } from "./BlockNoteDefaultUI.js";
import "./styles.css";
export type BlockNoteViewProps<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema> = {
    /**
     * The {@link BlockNoteEditor} instance to render.
     * @remarks `BlockNoteEditor`
     */
    editor: BlockNoteEditor<BSchema, ISchema, SSchema>;
    /**
     * Forces the editor to use the light or dark theme. See [Themes](https://www.blocknotejs.org/docs/react/styling-theming/themes) for additional customization when using Mantine.
     */
    theme?: "light" | "dark";
    /**
     * Locks the editor from being editable by the user if set to `false`.
     *
     * @default true
     */
    editable?: boolean;
    /**
     * A callback function that runs whenever the text cursor position or selection changes.
     */
    onSelectionChange?: () => void;
    /**
     * A callback function that runs whenever the editor's contents change.
     * Same as {@link BlockNoteEditor.onChange}.
     * @remarks `(editor: BlockNoteEditor) => void`
     */
    onChange?: Parameters<BlockNoteEditor<BSchema, ISchema, SSchema>["onChange"]>[0];
    /**
     * Whether to render the editor element itself.
     * When `false`, you're responsible for rendering the editor yourself using the {@link BlockNoteViewEditor} component.
     *
     * @default true
     */
    renderEditor?: boolean;
    /**
     * Pass child elements to the {@link BlockNoteView} to create or customize toolbars, menus, or other UI components. See [UI Components](https://www.blocknotejs.org/docs/ui-components) for more.
     */
    children?: ReactNode;
    ref?: Ref<HTMLDivElement> | undefined;
} & BlockNoteDefaultUIProps;
declare function BlockNoteViewComponent<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema>(props: BlockNoteViewProps<BSchema, ISchema, SSchema> & Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "onSelectionChange" | "children">, ref: React.Ref<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
export declare const BlockNoteViewRaw: <BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema>(props: BlockNoteViewProps<BSchema, ISchema, SSchema> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "onSelectionChange" | "children">) => ReturnType<typeof BlockNoteViewComponent<BSchema, ISchema, SSchema>>;
/**
 * Renders the contentEditable editor itself (.bn-editor element) and the
 * default UI elements.
 */
export declare const BlockNoteViewEditor: (props: {
    children?: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export {};
