export type QuoteBlockConfig = ReturnType<typeof createQuoteBlockConfig>;
export declare const createQuoteBlockConfig: () => import("../../index.js").BlockConfig<"quote", {
    readonly backgroundColor: {
        default: "default";
    };
    readonly textColor: {
        default: "default";
    };
}, "inline">;
export declare const createQuoteBlockSpec: (options?: Partial<Partial<Record<string, any>>> | undefined) => import("../../index.js").BlockSpec<"quote", {
    readonly backgroundColor: {
        default: "default";
    };
    readonly textColor: {
        default: "default";
    };
}, "inline">;
