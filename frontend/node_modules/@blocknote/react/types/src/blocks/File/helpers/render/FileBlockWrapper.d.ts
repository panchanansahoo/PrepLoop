import { FileBlockConfig } from "@blocknote/core";
import { CSSProperties, ReactNode } from "react";
import { ReactCustomBlockRenderProps } from "../../../../schema/ReactBlockSpec.js";
export declare const FileBlockWrapper: (props: Omit<ReactCustomBlockRenderProps<FileBlockConfig["type"], FileBlockConfig["propSchema"] & {
    showPreview?: {
        default: true;
    };
}, FileBlockConfig["content"]>, "contentRef"> & {
    buttonIcon?: ReactNode;
    children?: ReactNode;
} & {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    style?: CSSProperties;
}) => import("react/jsx-runtime").JSX.Element;
