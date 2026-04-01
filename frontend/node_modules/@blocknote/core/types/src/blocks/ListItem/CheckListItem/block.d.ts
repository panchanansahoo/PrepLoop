export type CheckListItemBlockConfig = ReturnType<typeof createCheckListItemConfig>;
export declare const createCheckListItemConfig: () => import("../../../index.js").BlockConfig<"checkListItem", {
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
export declare const createCheckListItemBlockSpec: (options?: Partial<Partial<Record<string, any>>> | undefined) => import("../../../index.js").BlockSpec<"checkListItem", {
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
