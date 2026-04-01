import { BlockNoDefaults, BlockSchema, InlineContentSchema, PartialBlockNoDefaults, StyleSchema } from "../schema/index.js";
export declare const defaultBlockSpecs: {
    readonly audio: import("../index.js").BlockSpec<"audio", {
        readonly backgroundColor: {
            default: "default";
        };
        readonly name: {
            readonly default: "";
        };
        readonly url: {
            readonly default: "";
        };
        readonly caption: {
            readonly default: "";
        };
        readonly showPreview: {
            readonly default: true;
        };
    }, "none">;
    readonly bulletListItem: import("../index.js").BlockSpec<"bulletListItem", {
        readonly backgroundColor: {
            default: "default";
        };
        readonly textColor: {
            default: "default";
        };
        readonly textAlignment: {
            default: "left";
            values: readonly ["left", "center", "right", "justify"];
        };
    }, "inline">;
    readonly checkListItem: import("../index.js").BlockSpec<"checkListItem", {
        readonly checked: {
            readonly default: false;
            readonly type: "boolean";
        };
        readonly backgroundColor: {
            default: "default";
        };
        readonly textColor: {
            default: "default";
        };
        readonly textAlignment: {
            default: "left";
            values: readonly ["left", "center", "right", "justify"];
        };
    }, "inline">;
    readonly codeBlock: import("../index.js").BlockSpec<"codeBlock", {
        readonly language: {
            readonly default: string;
        };
    }, "inline">;
    readonly divider: import("../index.js").BlockSpec<"divider", {}, "none">;
    readonly file: import("../index.js").BlockSpec<"file", {
        readonly backgroundColor: {
            default: "default";
        };
        readonly name: {
            readonly default: "";
        };
        readonly url: {
            readonly default: "";
        };
        readonly caption: {
            readonly default: "";
        };
    }, "none">;
    readonly heading: import("../index.js").BlockSpec<"heading", {
        readonly isToggleable?: {
            readonly default: false;
            readonly optional: true;
        } | undefined;
        readonly level: {
            readonly default: 1 | 4 | 2 | 3 | 5 | 6;
            readonly values: readonly number[];
        };
        readonly backgroundColor: {
            default: "default";
        };
        readonly textColor: {
            default: "default";
        };
        readonly textAlignment: {
            default: "left";
            values: readonly ["left", "center", "right", "justify"];
        };
    }, "inline">;
    readonly image: import("../index.js").BlockSpec<"image", {
        readonly textAlignment: {
            default: "left";
            values: readonly ["left", "center", "right", "justify"];
        };
        readonly backgroundColor: {
            default: "default";
        };
        readonly name: {
            readonly default: "";
        };
        readonly url: {
            readonly default: "";
        };
        readonly caption: {
            readonly default: "";
        };
        readonly showPreview: {
            readonly default: true;
        };
        readonly previewWidth: {
            readonly default: undefined;
            readonly type: "number";
        };
    }, "none">;
    readonly numberedListItem: import("../index.js").BlockSpec<"numberedListItem", {
        readonly start: {
            readonly default: undefined;
            readonly type: "number";
        };
        readonly backgroundColor: {
            default: "default";
        };
        readonly textColor: {
            default: "default";
        };
        readonly textAlignment: {
            default: "left";
            values: readonly ["left", "center", "right", "justify"];
        };
    }, "inline">;
    readonly paragraph: import("../index.js").BlockSpec<"paragraph", {
        backgroundColor: {
            default: "default";
        };
        textColor: {
            default: "default";
        };
        textAlignment: {
            default: "left";
            values: readonly ["left", "center", "right", "justify"];
        };
    }, "inline">;
    readonly quote: import("../index.js").BlockSpec<"quote", {
        readonly backgroundColor: {
            default: "default";
        };
        readonly textColor: {
            default: "default";
        };
    }, "inline">;
    readonly table: import("../index.js").LooseBlockSpec<"table", {
        textColor: {
            default: "default";
        };
    }, "table">;
    readonly toggleListItem: import("../index.js").BlockSpec<"toggleListItem", {
        readonly backgroundColor: {
            default: "default";
        };
        readonly textColor: {
            default: "default";
        };
        readonly textAlignment: {
            default: "left";
            values: readonly ["left", "center", "right", "justify"];
        };
    }, "inline">;
    readonly video: import("../index.js").BlockSpec<"video", {
        textAlignment: {
            default: "left";
            values: readonly ["left", "center", "right", "justify"];
        };
        backgroundColor: {
            default: "default";
        };
        name: {
            default: "";
        };
        url: {
            default: "";
        };
        caption: {
            default: "";
        };
        showPreview: {
            default: boolean;
        };
        previewWidth: {
            default: undefined;
            type: "number";
        };
    }, "none">;
};
export type _DefaultBlockSchema = {
    [K in keyof typeof defaultBlockSpecs]: (typeof defaultBlockSpecs)[K]["config"];
};
export type DefaultBlockSchema = _DefaultBlockSchema;
export declare const defaultStyleSpecs: {
    bold: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    italic: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    underline: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    strike: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    code: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    textColor: import("../index.js").StyleSpec<{
        readonly type: "textColor";
        readonly propSchema: "string";
    }>;
    backgroundColor: import("../index.js").StyleSpec<{
        readonly type: "backgroundColor";
        readonly propSchema: "string";
    }>;
};
export declare const defaultStyleSchema: import("../index.js").StyleSchemaFromSpecs<{
    bold: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    italic: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    underline: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    strike: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    code: {
        config: {
            type: string;
            propSchema: "boolean";
        };
        implementation: import("../index.js").StyleImplementation<{
            type: string;
            propSchema: "boolean";
        }>;
    };
    textColor: import("../index.js").StyleSpec<{
        readonly type: "textColor";
        readonly propSchema: "string";
    }>;
    backgroundColor: import("../index.js").StyleSpec<{
        readonly type: "backgroundColor";
        readonly propSchema: "string";
    }>;
}>;
export type _DefaultStyleSchema = typeof defaultStyleSchema;
export type DefaultStyleSchema = _DefaultStyleSchema;
export declare const defaultInlineContentSpecs: {
    text: {
        config: "text";
        implementation: any;
    };
    link: {
        config: "link";
        implementation: any;
    };
};
export declare const defaultInlineContentSchema: import("../index.js").InlineContentSchemaFromSpecs<{
    text: {
        config: "text";
        implementation: any;
    };
    link: {
        config: "link";
        implementation: any;
    };
}>;
export type _DefaultInlineContentSchema = typeof defaultInlineContentSchema;
export type DefaultInlineContentSchema = _DefaultInlineContentSchema;
export type PartialBlock<BSchema extends BlockSchema = DefaultBlockSchema, I extends InlineContentSchema = DefaultInlineContentSchema, S extends StyleSchema = DefaultStyleSchema> = PartialBlockNoDefaults<BSchema, I, S>;
export type Block<BSchema extends BlockSchema = DefaultBlockSchema, I extends InlineContentSchema = DefaultInlineContentSchema, S extends StyleSchema = DefaultStyleSchema> = BlockNoDefaults<BSchema, I, S>;
