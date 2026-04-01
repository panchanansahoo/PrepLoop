export type FileBlockConfig = ReturnType<typeof createFileBlockConfig>;
export declare const createFileBlockConfig: () => import("../../index.js").BlockConfig<"file", {
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
export declare const fileParse: () => (element: HTMLElement) => {
    backgroundColor: string | undefined;
    url: string | undefined;
} | {
    backgroundColor: string | undefined;
    caption: string | undefined;
    url: string | undefined;
} | undefined;
export declare const createFileBlockSpec: (options?: Partial<Partial<Record<string, any>>> | undefined) => import("../../index.js").BlockSpec<"file", {
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
