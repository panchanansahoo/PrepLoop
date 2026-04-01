import { ParseRule } from "@tiptap/pm/model";
import { StyleConfig, StyleSpec } from "./types.js";
export type CustomStyleImplementation<T extends StyleConfig> = {
    render: (value: T["propSchema"] extends "boolean" ? undefined : string) => {
        dom: HTMLElement;
        contentDOM?: HTMLElement;
    };
    toExternalHTML?: (value: T["propSchema"] extends "boolean" ? undefined : string) => {
        dom: HTMLElement;
        contentDOM?: HTMLElement;
    };
    parse?: (element: HTMLElement) => (T["propSchema"] extends "boolean" ? true : string) | undefined;
    runsBefore?: string[];
};
export declare function getStyleParseRules<T extends StyleConfig>(config: T, customParseFunction?: CustomStyleImplementation<T>["parse"]): ParseRule[];
export declare function createStyleSpec<const T extends StyleConfig>(styleConfig: T, styleImplementation: CustomStyleImplementation<T>): StyleSpec<T>;
