import { BlockNoteEditor } from "../../editor/BlockNoteEditor.js";
export declare function setupTestEnv(): () => BlockNoteEditor<import("../../index.js")._DefaultBlockSchema, import("../../index.js").InlineContentSchemaFromSpecs<{
    text: {
        config: "text";
        implementation: any;
    };
    link: {
        config: "link";
        implementation: any;
    };
}>, import("../../index.js").StyleSchemaFromSpecs<{
    bold: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    italic: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    underline: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    strike: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    code: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    textColor: import("../../index.js").StyleSpec<{
        readonly type: "textColor";
        readonly propSchema: "string";
    }>;
    backgroundColor: import("../../index.js").StyleSpec<{
        readonly type: "backgroundColor";
        readonly propSchema: "string";
    }>;
}>>;
