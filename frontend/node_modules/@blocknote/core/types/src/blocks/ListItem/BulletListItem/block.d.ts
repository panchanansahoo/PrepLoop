export type BulletListItemBlockConfig = ReturnType<typeof createBulletListItemBlockConfig>;
export declare const createBulletListItemBlockConfig: () => import("../../../index.js").BlockConfig<"bulletListItem", {
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
export declare const createBulletListItemBlockSpec: (options?: Partial<Partial<Record<string, any>>> | undefined) => import("../../../index.js").BlockSpec<"bulletListItem", {
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
