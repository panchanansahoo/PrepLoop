export type NumberedListItemBlockConfig = ReturnType<typeof createNumberedListItemBlockConfig>;
export declare const createNumberedListItemBlockConfig: () => import("../../../index.js").BlockConfig<"numberedListItem", {
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
export declare const createNumberedListItemBlockSpec: (options?: Partial<Partial<Record<string, any>>> | undefined) => import("../../../index.js").BlockSpec<"numberedListItem", {
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
