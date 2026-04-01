import { BlockSchema, InlineContentSchema, StyleSchema } from "@blocknote/core";
import { BlockNoteViewRaw } from "@blocknote/react";
import React from "react";
import { Theme } from "./BlockNoteTheme.js";
export declare const BlockNoteView: <BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema>(props: Omit<React.ComponentProps<typeof BlockNoteViewRaw<BSchema, ISchema, SSchema>>, "theme"> & {
    theme?: "light" | "dark" | Theme | {
        light: Theme;
        dark: Theme;
    };
}) => import("react/jsx-runtime.js").JSX.Element;
