import { BlockNoteEditor, BlockNoteSchema, BlockSchema, DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema, InlineContentSchema, StyleSchema } from "@blocknote/core";
import { useState } from "react";
export type BlockNoteContextValue<BSchema extends BlockSchema = DefaultBlockSchema, ISchema extends InlineContentSchema = DefaultInlineContentSchema, SSchema extends StyleSchema = DefaultStyleSchema> = {
    setContentEditableProps?: ReturnType<typeof useState<Record<string, any>>>[1];
    editor?: BlockNoteEditor<BSchema, ISchema, SSchema>;
    colorSchemePreference?: "light" | "dark";
};
export declare const BlockNoteContext: import("react").Context<BlockNoteContextValue<import("@blocknote/core")._DefaultBlockSchema, import("@blocknote/core").InlineContentSchemaFromSpecs<{
    text: {
        config: "text";
        implementation: any;
    };
    link: {
        config: "link";
        implementation: any;
    };
}>, import("@blocknote/core").StyleSchemaFromSpecs<{
    bold: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("@blocknote/core").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    italic: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("@blocknote/core").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    underline: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("@blocknote/core").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    strike: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("@blocknote/core").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    code: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("@blocknote/core").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    textColor: import("@blocknote/core").StyleSpec<{
        readonly type: "textColor";
        readonly propSchema: "string";
    }>;
    backgroundColor: import("@blocknote/core").StyleSpec<{
        readonly type: "backgroundColor";
        readonly propSchema: "string";
    }>;
}>> | undefined>;
/**
 * Get the BlockNoteContext instance from the nearest BlockNoteContext provider
 * @param _schema: optional, pass in the schema to return type-safe Context if you're using a custom schema
 */
export declare function useBlockNoteContext<BSchema extends BlockSchema = DefaultBlockSchema, ISchema extends InlineContentSchema = DefaultInlineContentSchema, SSchema extends StyleSchema = DefaultStyleSchema>(_schema?: BlockNoteSchema<BSchema, ISchema, SSchema>): BlockNoteContextValue<BSchema, ISchema, SSchema> | undefined;
