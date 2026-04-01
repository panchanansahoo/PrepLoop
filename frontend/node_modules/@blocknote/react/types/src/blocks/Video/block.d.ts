import { createVideoBlockConfig } from "@blocknote/core";
import { ReactCustomBlockRenderProps } from "../../schema/ReactBlockSpec.js";
export declare const VideoPreview: (props: Omit<ReactCustomBlockRenderProps<ReturnType<typeof createVideoBlockConfig>["type"], ReturnType<typeof createVideoBlockConfig>["propSchema"], ReturnType<typeof createVideoBlockConfig>["content"]>, "contentRef">) => import("react/jsx-runtime").JSX.Element;
export declare const VideoToExternalHTML: (props: Omit<ReactCustomBlockRenderProps<ReturnType<typeof createVideoBlockConfig>["type"], ReturnType<typeof createVideoBlockConfig>["propSchema"], ReturnType<typeof createVideoBlockConfig>["content"]>, "contentRef">) => import("react/jsx-runtime").JSX.Element;
export declare const VideoBlock: (props: ReactCustomBlockRenderProps<ReturnType<typeof createVideoBlockConfig>["type"], ReturnType<typeof createVideoBlockConfig>["propSchema"], ReturnType<typeof createVideoBlockConfig>["content"]>) => import("react/jsx-runtime").JSX.Element;
export declare const ReactVideoBlock: (options?: Partial<{
    icon: string;
}> | undefined) => import("@blocknote/core").BlockSpec<"video", {
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
