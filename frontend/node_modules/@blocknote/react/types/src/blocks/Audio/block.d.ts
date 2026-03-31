import { createAudioBlockConfig } from "@blocknote/core";
import { ReactCustomBlockRenderProps } from "../../schema/ReactBlockSpec.js";
export declare const AudioPreview: (props: Omit<ReactCustomBlockRenderProps<ReturnType<typeof createAudioBlockConfig>["type"], ReturnType<typeof createAudioBlockConfig>["propSchema"], ReturnType<typeof createAudioBlockConfig>["content"]>, "contentRef">) => import("react/jsx-runtime").JSX.Element;
export declare const AudioToExternalHTML: (props: Omit<ReactCustomBlockRenderProps<ReturnType<typeof createAudioBlockConfig>["type"], ReturnType<typeof createAudioBlockConfig>["propSchema"], ReturnType<typeof createAudioBlockConfig>["content"]>, "contentRef">) => import("react/jsx-runtime").JSX.Element;
export declare const AudioBlock: (props: ReactCustomBlockRenderProps<ReturnType<typeof createAudioBlockConfig>["type"], ReturnType<typeof createAudioBlockConfig>["propSchema"], ReturnType<typeof createAudioBlockConfig>["content"]>) => import("react/jsx-runtime").JSX.Element;
export declare const ReactAudioBlock: (options?: Partial<{
    icon: string;
}> | undefined) => import("@blocknote/core").BlockSpec<"audio", {
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
}, "none">;
