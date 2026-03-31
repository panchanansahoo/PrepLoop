import { createImageBlockConfig } from "@blocknote/core";
import { ReactCustomBlockRenderProps } from "../../schema/ReactBlockSpec.js";
export declare const ImagePreview: (props: Omit<ReactCustomBlockRenderProps<ReturnType<typeof createImageBlockConfig>["type"], ReturnType<typeof createImageBlockConfig>["propSchema"], ReturnType<typeof createImageBlockConfig>["content"]>, "contentRef">) => import("react/jsx-runtime").JSX.Element;
export declare const ImageToExternalHTML: (props: Omit<ReactCustomBlockRenderProps<ReturnType<typeof createImageBlockConfig>["type"], ReturnType<typeof createImageBlockConfig>["propSchema"], ReturnType<typeof createImageBlockConfig>["content"]>, "contentRef">) => import("react/jsx-runtime").JSX.Element;
export declare const ImageBlock: (props: ReactCustomBlockRenderProps<ReturnType<typeof createImageBlockConfig>["type"], ReturnType<typeof createImageBlockConfig>["propSchema"], ReturnType<typeof createImageBlockConfig>["content"]>) => import("react/jsx-runtime").JSX.Element;
export declare const ReactImageBlock: (options?: Partial<{
    icon: string;
}> | undefined) => import("@blocknote/core").BlockSpec<"image", {
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
