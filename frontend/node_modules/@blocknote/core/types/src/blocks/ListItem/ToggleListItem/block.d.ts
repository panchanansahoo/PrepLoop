export type ToggleListItemBlockConfig = ReturnType<typeof createToggleListItemBlockConfig>;
export declare const createToggleListItemBlockConfig: () => import("../../../index.js").BlockConfig<"toggleListItem", {
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
export declare const createToggleListItemBlockSpec: (options?: Partial<Partial<Record<string, any>>> | undefined) => import("../../../index.js").BlockSpec<"toggleListItem", {
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
