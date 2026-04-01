import { Mark } from "@tiptap/core";
import { BlockNoteEditor } from "../../editor/BlockNoteEditor.js";
export type StylePropSchema = "boolean" | "string";
export type StyleConfig = {
    type: string;
    readonly propSchema: StylePropSchema;
};
export type StyleImplementation<T extends StyleConfig> = {
    mark: Mark;
    render: (value: T["propSchema"] extends "boolean" ? undefined : string, editor: BlockNoteEditor<any, any, any>) => {
        dom: HTMLElement;
        contentDOM?: HTMLElement;
    };
    toExternalHTML?: (value: T["propSchema"] extends "boolean" ? undefined : string, editor: BlockNoteEditor<any, any, any>) => {
        dom: HTMLElement;
        contentDOM?: HTMLElement;
    };
    runsBefore?: string[];
};
export type StyleSpec<T extends StyleConfig> = {
    config: T;
    implementation: StyleImplementation<T>;
};
export type StyleSchema = Record<string, StyleConfig>;
export type StyleSpecs = Record<string, StyleSpec<StyleConfig>>;
export type StyleSchemaFromSpecs<T extends StyleSpecs> = {
    [K in keyof T]: T[K]["config"];
};
export type Styles<T extends StyleSchema> = {
    [K in keyof T]?: T[K]["propSchema"] extends "boolean" ? boolean : T[K]["propSchema"] extends "string" ? string : never;
};
