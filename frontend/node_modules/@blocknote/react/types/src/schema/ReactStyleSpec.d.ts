import { BlockNoteEditor, StyleConfig } from "@blocknote/core";
import { FC } from "react";
export type ReactCustomStyleImplementation<T extends StyleConfig> = {
    render: FC<{
        value: T["propSchema"] extends "boolean" ? undefined : string;
        contentRef: (el: HTMLElement | null) => void;
        editor: BlockNoteEditor<any, any, any>;
    }>;
    runsBefore?: string[];
};
export declare function createReactStyleSpec<T extends StyleConfig>(styleConfig: T, styleImplementation: ReactCustomStyleImplementation<T>): {
    config: T;
    implementation: import("@blocknote/core").StyleImplementation<T>;
};
