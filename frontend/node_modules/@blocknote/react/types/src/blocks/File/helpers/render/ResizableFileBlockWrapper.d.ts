import { FileBlockConfig } from "@blocknote/core";
import { ReactNode } from "react";
import { ReactCustomBlockRenderProps } from "../../../../schema/ReactBlockSpec.js";
export declare const ResizableFileBlockWrapper: (props: Omit<ReactCustomBlockRenderProps<FileBlockConfig["type"], FileBlockConfig["propSchema"] & {
    showPreview?: {
        default: true;
    };
    previewWidth?: {
        default: number;
    };
    textAlignment?: {
        default: "left";
    };
}, FileBlockConfig["content"]>, "contentRef"> & {
    buttonIcon?: ReactNode;
    children?: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
