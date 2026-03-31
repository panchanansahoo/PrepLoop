declare const HEADING_LEVELS: readonly [1, 2, 3, 4, 5, 6];
export interface HeadingOptions {
    defaultLevel?: (typeof HEADING_LEVELS)[number];
    levels?: readonly number[];
    allowToggleHeadings?: boolean;
}
export type HeadingBlockConfig = ReturnType<typeof createHeadingBlockConfig>;
export declare const createHeadingBlockConfig: (() => import("../../index.js").BlockConfig<"heading", {
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
}, "inline">) | ((options: HeadingOptions) => import("../../index.js").BlockConfig<"heading", {
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
}, "inline">);
export declare const createHeadingBlockSpec: (options?: Partial<{
    defaultLevel: (typeof HEADING_LEVELS)[number];
    levels: readonly number[];
    allowToggleHeadings: boolean;
}> | undefined) => import("../../index.js").BlockSpec<"heading", {
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
export {};
