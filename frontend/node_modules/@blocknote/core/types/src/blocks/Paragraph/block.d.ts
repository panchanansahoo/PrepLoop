export type ParagraphBlockConfig = ReturnType<typeof createParagraphBlockConfig>;
export declare const createParagraphBlockConfig: () => import("../../index.js").BlockConfig<"paragraph", {
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
export declare const createParagraphBlockSpec: (options?: Partial<Partial<Record<string, any>>> | undefined) => import("../../index.js").BlockSpec<"paragraph", {
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
