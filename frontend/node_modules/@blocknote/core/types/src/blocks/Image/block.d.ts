import { BlockNoteEditor } from "../../editor/BlockNoteEditor.js";
import { BlockFromConfig } from "../../schema/index.js";
export declare const FILE_IMAGE_ICON_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M5 11.1005L7 9.1005L12.5 14.6005L16 11.1005L19 14.1005V5H5V11.1005ZM4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM15.5 10C14.6716 10 14 9.32843 14 8.5C14 7.67157 14.6716 7 15.5 7C16.3284 7 17 7.67157 17 8.5C17 9.32843 16.3284 10 15.5 10Z\"></path></svg>";
export interface ImageOptions {
    icon?: string;
}
export type ImageBlockConfig = ReturnType<typeof createImageBlockConfig>;
export declare const createImageBlockConfig: (() => import("../../index.js").BlockConfig<"image", {
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
}, "none">) | ((options: ImageOptions) => import("../../index.js").BlockConfig<"image", {
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
}, "none">);
export declare const imageParse: (_config?: ImageOptions) => (element: HTMLElement) => {
    backgroundColor: string | undefined;
    url: string | undefined;
    previewWidth: number | undefined;
    name: string | undefined;
} | {
    backgroundColor: string | undefined;
    caption: string | undefined;
    url: string | undefined;
    previewWidth: number | undefined;
    name: string | undefined;
} | undefined;
export declare const imageRender: (config?: ImageOptions) => (block: BlockFromConfig<ReturnType<typeof createImageBlockConfig>, any, any>, editor: BlockNoteEditor<Record<"image", ReturnType<typeof createImageBlockConfig>>, any, any>) => {
    dom: HTMLElement;
    destroy: () => void;
};
export declare const imageToExternalHTML: (_config?: ImageOptions) => (block: BlockFromConfig<ReturnType<typeof createImageBlockConfig>, any, any>, _editor: BlockNoteEditor<Record<"image", ReturnType<typeof createImageBlockConfig>>, any, any>) => {
    dom: HTMLElement;
};
export declare const createImageBlockSpec: (options?: Partial<{
    icon: string;
}> | undefined) => import("../../index.js").BlockSpec<"image", {
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
